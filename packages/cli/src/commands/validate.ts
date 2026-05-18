// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-003
// Change: artifact-language-config

import { readFile } from 'node:fs/promises';
import pc from 'picocolors';
import { loadWorkflow } from '../workflow/loader.js';
import { projectPaths } from '../workflow/paths.js';
import { loadConfig } from '../workflow/config-loader.js';
import { findChange, listChanges, resolveProduces } from '../lib/change-discovery.js';
import { validateArtifact, WARNING_PREFIX } from '../lib/artifact-validator.js';
import { checkEnforcement } from '../lib/enforce.js';
import { lintSotSpecs } from '../lib/spec-linter.js';
import type { Workflow } from '../types/index.js';

export interface ValidateOptions {
  all?: boolean;
  change?: string;
  strict?: boolean;
}

export async function validateCommand(opts: ValidateOptions): Promise<void> {
  const paths = projectPaths(process.cwd());
  const workflow = await loadWorkflow(paths.workflowFile);

  // FR-003: detect unsupported locale and exit 1 with stderr message
  try {
    const config = await loadConfig(paths.configFile);
    if (config.resolvedLocale.unsupported) {
      const code = config.resolvedLocale.requested;
      const list = [...config.resolvedLocale.supported].join(', ');
      process.stderr.write(pc.red(`unsupported locale: ${code}\n`));
      process.stderr.write(`supported: ${list}\n`);
      process.exitCode = 1;
      return;
    }
  } catch {
    // config.yaml missing or invalid — let the workflow handle it
  }

  const targets: { name: string; dir: string }[] = [];
  if (opts.all) {
    const all = await listChanges(paths, { includeArchived: false });
    targets.push(...all.map((c) => ({ name: c.name, dir: c.dir })));
  } else {
    const name = opts.change ?? (await singleActiveChange(paths));
    const c = await findChange(paths, name);
    if (!c) throw new Error(`change "${name}" not found`);
    targets.push({ name: c.name, dir: c.dir });
  }

  let totalIssues = 0;
  for (const tgt of targets) {
    const issues = await validateOne(tgt.name, tgt.dir, workflow, opts.strict ?? false);
    const errors = issues.filter((i) => !i.startsWith(WARNING_PREFIX));
    const warnings = issues.filter((i) => i.startsWith(WARNING_PREFIX));
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`${pc.green('✓')} ${tgt.name}`);
    } else {
      if (errors.length > 0) {
        totalIssues += errors.length;
        console.log(`${pc.red('✗')} ${tgt.name}`);
        for (const i of errors) console.log(`  - ${i}`);
      } else {
        console.log(`${pc.yellow('⚠')} ${tgt.name}`);
      }
      for (const w of warnings) console.log(`  - ${w}`);
    }
  }

  // Strict mode also lints all Source-of-Truth specs for implementation-detail
  // leakage (regex-based; deterministic). Any violation fails the overall run.
  if (opts.strict) {
    const lintViolations = lintSotSpecs(paths.root);
    if (lintViolations.length > 0) {
      totalIssues += lintViolations.length;
      console.log(`${pc.red('✗')} spec lint`);
      for (const v of lintViolations) {
        console.log(
          `  - ${v.file}:${v.line}:${v.column} [${v.ruleId}] ${v.matched} — ${v.hint}`,
        );
      }
    } else {
      console.log(`${pc.green('✓')} spec lint`);
    }
  }

  if (totalIssues > 0) {
    process.exitCode = 1;
  }
}

async function singleActiveChange(paths: ReturnType<typeof projectPaths>): Promise<string> {
  const live = await listChanges(paths, { includeArchived: false });
  if (live.length === 1) return live[0]!.name;
  if (live.length === 0) throw new Error('no active change. Use --all or --change <name>.');
  throw new Error(`multiple active changes; specify --change: ${live.map((c) => c.name).join(', ')}`);
}

async function validateOne(
  changeName: string,
  changeDir: string,
  workflow: Workflow,
  strict: boolean,
): Promise<string[]> {
  const issues: string[] = [];
  for (const step of workflow.steps) {
    if (step.enabled === false) continue;
    const constitutionRequired = strict && (step.constitution_check ?? false);
    for (const p of step.produces ?? []) {
      const resolved = await resolveProduces(changeDir, p);
      // Validate only files that exist; absence is a status concern, not a validate concern
      for (const filePath of resolved) {
        const contents = await readFile(filePath, 'utf8');
        const fileIssues = validateArtifact({
          filePath,
          contents,
          produces: p,
          constitutionRequired,
          strict,
        });
        issues.push(...fileIssues);
      }
    }
    if (strict) {
      const { issues: enforceIssues } = await checkEnforcement(step, {
        changeName,
        cwd: process.cwd(),
      });
      issues.push(...enforceIssues);
    }
  }
  return issues;
}
