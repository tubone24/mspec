// @mspec-delta 2026-05-26-131033-p1-llm-verify/specs/cli-core/spec.md
// Requirements implemented: FR-005
// Change: p1-llm-verify

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pc from 'picocolors';
import { projectPaths } from '../workflow/paths.js';
import { findChange, listChanges, resolveProduces } from '../lib/change-discovery.js';
import { parseDeltaSpec } from '../parser/delta-spec.js';
import type { Requirement } from '../types/index.js';

export interface VerifyOptions {
  llm?: boolean;
  json?: boolean;
  change?: string;
}

export interface FrCheck {
  fr_id: string;
  title: string;
  prompt: string;
  acceptance_criteria: string[];
}

export interface VerifyLlmOutput {
  change: string;
  fr_checks: FrCheck[];
}

export async function verifyLlmCommand(opts: VerifyOptions): Promise<void> {
  const paths = projectPaths(process.cwd());

  const name = opts.change ?? (await singleActiveChange(paths));
  const change = await findChange(paths, name);
  if (!change) {
    process.stderr.write(pc.red(`Error: change "${name}" not found\n`));
    process.exitCode = 1;
    return;
  }

  const specFiles = await resolveProduces(change.dir, 'specs/*/spec.md');
  if (specFiles.length === 0) {
    process.stderr.write(
      pc.red(`Error: no specs/*/spec.md found in change "${name}"\n`),
    );
    process.exitCode = 1;
    return;
  }

  const allRequirements: Array<Requirement & { capabilityHint: string }> = [];
  for (const specFile of specFiles) {
    const contents = await readFile(specFile, 'utf8');
    const { spec } = parseDeltaSpec(contents);
    for (const req of [...spec.added, ...spec.modified]) {
      allRequirements.push({ ...req, capabilityHint: spec.capability });
    }
  }

  let designContext = '';
  const designFile = join(change.dir, 'design.md');
  try {
    const designContents = await readFile(designFile, 'utf8');
    const decisionsMatch = /^##\s+Decisions[\s\S]*?(?=^##\s|\Z)/m.exec(designContents);
    if (decisionsMatch) {
      designContext = decisionsMatch[0].trim();
    }
  } catch {
    // design.md is optional
  }

  const frChecks: FrCheck[] = allRequirements.map((req) =>
    buildFrCheck(req, designContext),
  );

  const output: VerifyLlmOutput = {
    change: name,
    fr_checks: frChecks,
  };

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}

function extractClauses(
  lines: string[],
  prefix: string,
): string[] {
  return lines
    .filter((l) => l.trim().toLowerCase().startsWith(`- ${prefix.toLowerCase()}`))
    .map((l) => l.replace(/^-\s+(?:given|when|then)\s+/i, '').trim());
}

function buildFrCheck(
  req: Requirement & { capabilityHint: string },
  designContext: string,
): FrCheck {
  const acceptance_criteria = req.scenarios.flatMap((s) =>
    extractClauses(s.lines, 'then'),
  );

  const scenarioText = req.scenarios
    .map((s) => {
      const given = extractClauses(s.lines, 'given').join(', ');
      const when = extractClauses(s.lines, 'when').join(', ');
      const then = extractClauses(s.lines, 'then').join(', ');
      return `シナリオ「${s.name}」:\n  前提: ${given}\n  操作: ${when}\n  期待: ${then}`;
    })
    .join('\n\n');

  const designSection = designContext
    ? `\n\n## 設計上の決定（参考）\n${designContext}`
    : '';

  const prompt =
    `以下の要件「${req.fr_id}: ${req.title}」について、実装が要件を満たしているかを評価してください。\n\n` +
    `## 要件\n${req.body}\n\n` +
    `## 受け入れシナリオ\n${scenarioText}` +
    designSection +
    `\n\n## 評価観点\n` +
    `1. 受け入れ基準（THEN節）が実装でカバーされているか\n` +
    `2. エッジケースや境界条件が考慮されているか\n` +
    `3. 設計との整合性があるか\n\n` +
    `評価結果を「✅ 満たしている」「⚠️ 部分的に満たしている（理由）」「❌ 満たしていない（理由）」の形式で回答してください。`;

  return {
    fr_id: req.fr_id,
    title: req.title,
    prompt,
    acceptance_criteria,
  };
}

async function singleActiveChange(
  paths: ReturnType<typeof projectPaths>,
): Promise<string> {
  const live = await listChanges(paths, { includeArchived: false });
  if (live.length === 1) return live[0]!.name;
  if (live.length === 0) throw new Error('no active change. Use --change <name>.');
  throw new Error(
    `multiple active changes; specify --change: ${live.map((c) => c.name).join(', ')}`,
  );
}
