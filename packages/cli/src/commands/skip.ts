// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-021
// Change: lightweight-change-mode

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import pc from 'picocolors';
import { loadWorkflow } from '../workflow/loader.js';
import { projectPaths } from '../workflow/paths.js';
import { findChange, listChanges, fileExists, resolveProduces } from '../lib/change-discovery.js';
import { recordSkip } from '../lib/skip-log.js';
import { SKIPPED_PLACEHOLDER_MARKER } from '../lib/artifact-validator.js';
import { parseMode } from '../lib/readme-parser.js';

export interface SkipOptions {
  change?: string;
  reason?: string;
  cwd?: string;
}

export async function skipCommand(stepId: string, opts: SkipOptions): Promise<void> {
  if (!opts.reason || opts.reason.trim().length < 10) {
    throw new Error('--reason <text> is required (min 10 chars)');
  }
  const paths = projectPaths(opts.cwd ?? process.cwd());
  const workflow = await loadWorkflow(paths.workflowFile);
  const step = workflow.steps.find((s) => s.id === stepId);
  if (!step) throw new Error(`step "${stepId}" not found in workflow`);
  if (!step.skippable) {
    throw new Error(`step "${stepId}" is not skippable (workflow.yaml flag)`);
  }

  const changeName = opts.change ?? (await singleActiveChange(paths));
  const change = await findChange(paths, changeName);
  if (!change || change.isArchived) {
    throw new Error(`active change "${changeName}" not found`);
  }

  // Force check: bugfix mode cannot skip steps in modes.bugfix.force
  const readmePath = join(change.dir, 'readme.md');
  if (await fileExists(readmePath)) {
    const readmeContent = await readFile(readmePath, 'utf8');
    const mode = parseMode(readmeContent);
    if (mode && workflow.modes) {
      const modeRule = workflow.modes[mode];
      if (modeRule?.force.includes(stepId)) {
        throw new Error(
          `${mode} モードでは "${stepId}" は必須ステップです（スキップ不可）`,
        );
      }
    }
  }

  // Generate placeholder MDs for each `produces` (skip globs that won't expand without files)
  for (const p of step.produces ?? []) {
    if (p.includes('*')) continue; // can't materialize a glob blindly
    const dest = join(change.dir, p);
    if (await fileExists(dest)) continue;
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buildPlaceholder(stepId, opts.reason), 'utf8');
  }

  await recordSkip(paths, change.name, stepId, opts.reason);
  await appendSkipToReadme(change.dir, stepId, opts.reason);

  console.log(`${pc.yellow('skipped:')} ${stepId} (${opts.reason})`);
}

async function singleActiveChange(paths: ReturnType<typeof projectPaths>): Promise<string> {
  const live = await listChanges(paths, { includeArchived: false });
  if (live.length === 1) return live[0]!.name;
  if (live.length === 0) throw new Error('no active change');
  throw new Error(`multiple active changes; specify --change: ${live.map((c) => c.name).join(', ')}`);
}

function buildPlaceholder(stepId: string, reason: string): string {
  return `${SKIPPED_PLACEHOLDER_MARKER}
# Skipped: ${stepId}

Reason: ${reason}
Skipped at: ${new Date().toISOString()}
See: ../readme.md → ## Skipped Steps
`;
}

async function appendSkipToReadme(changeDir: string, stepId: string, reason: string): Promise<void> {
  const readme = join(changeDir, 'readme.md');
  const line = `- ${stepId}: ${reason} (skipped at ${new Date().toISOString()})\n`;
  if (!(await fileExists(readme))) {
    await writeFile(readme, `# (auto-created)\n\n## Skipped Steps\n\n${line}`, 'utf8');
    return;
  }
  // Append under existing `## Skipped Steps` if found; otherwise append a new section
  const { readFile } = await import('node:fs/promises');
  const raw = await readFile(readme, 'utf8');
  if (raw.includes('## Skipped Steps')) {
    await writeFile(readme, raw.replace(/(## Skipped Steps\s*(?:<!--[\s\S]*?-->\s*)?)/, `$1${line}`), 'utf8');
  } else {
    await appendFile(readme, `\n## Skipped Steps\n\n${line}`, 'utf8');
  }
  // Mark as used to satisfy noUnusedLocals
  void resolveProduces;
}
