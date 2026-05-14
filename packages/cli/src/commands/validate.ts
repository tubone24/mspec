import { readFile } from 'node:fs/promises';
import pc from 'picocolors';
import { loadWorkflow } from '../workflow/loader.js';
import { projectPaths } from '../workflow/paths.js';
import { findChange, listChanges, resolveProduces } from '../lib/change-discovery.js';
import { validateArtifact } from '../lib/artifact-validator.js';
import { checkEnforcement } from '../lib/enforce.js';
import type { Workflow } from '../types/index.js';

export interface ValidateOptions {
  all?: boolean;
  change?: string;
  strict?: boolean;
}

export async function validateCommand(opts: ValidateOptions): Promise<void> {
  const paths = projectPaths(process.cwd());
  const workflow = await loadWorkflow(paths.workflowFile);

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
    if (issues.length === 0) {
      console.log(`${pc.green('✓')} ${tgt.name}`);
    } else {
      totalIssues += issues.length;
      console.log(`${pc.red('✗')} ${tgt.name}`);
      for (const i of issues) console.log(`  - ${i}`);
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
