import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Step } from '../types/index.js';
import { scanAnchors } from './anchor-scanner.js';
import { dirExists, fileExists } from './change-discovery.js';
import { projectPaths } from '../workflow/paths.js';

export interface EnforceContext {
  changeName: string;
  cwd: string;
}

export interface EnforceResult {
  issues: string[];
}

/**
 * Check enforce_anchor, enforce_e2e, enforce_tdd flags for a step.
 * Returns a flat list of issue strings; empty means all pass.
 */
export async function checkEnforcement(
  step: Step,
  ctx: EnforceContext,
): Promise<EnforceResult> {
  const issues: string[] = [];

  if (step.enforce_anchor) {
    issues.push(...(await checkEnforceAnchor(ctx)));
  }
  if (step.enforce_tdd) {
    issues.push(...(await checkEnforceTdd(ctx)));
  }
  if (step.enforce_e2e) {
    issues.push(...(await checkEnforceE2e(ctx)));
  }

  return { issues };
}

async function checkEnforceAnchor(ctx: EnforceContext): Promise<string[]> {
  const { anchors } = await scanAnchors(ctx.cwd);
  const relevant = anchors.filter((a) => a.change_dir === ctx.changeName);
  if (relevant.length === 0) {
    return [
      `enforce_anchor: no @mspec-delta anchor blocks found in code/tests referencing change "${ctx.changeName}"`,
    ];
  }
  return [];
}

async function checkEnforceTdd(ctx: EnforceContext): Promise<string[]> {
  const paths = projectPaths(ctx.cwd);
  const redDir = join(paths.cacheDir, 'red-evidence');
  const greenDir = join(paths.cacheDir, 'green-evidence');
  const reds = await listEvidenceTasks(redDir, ctx.changeName);
  const greens = await listEvidenceTasks(greenDir, ctx.changeName);

  if (reds.length === 0) {
    return [
      `enforce_tdd: no red-evidence recorded for change "${ctx.changeName}" (run \`mspec test --expect-red <task-id>\` first)`,
    ];
  }

  const issues: string[] = [];
  for (const t of reds) {
    if (!greens.includes(t)) {
      issues.push(`enforce_tdd: task "${t}" has red-evidence but no green-evidence (TDD cycle incomplete)`);
    }
  }
  return issues;
}

async function checkEnforceE2e(ctx: EnforceContext): Promise<string[]> {
  // v0.1: lightweight heuristic — verify at least 1 anchor lives in a file whose
  // path includes "e2e", "test", or "__tests__". Stricter Scenario-by-Scenario
  // coverage is deferred to v0.1.x once tasks.md parser is built.
  const { anchors } = await scanAnchors(ctx.cwd);
  const relevant = anchors.filter((a) => a.change_dir === ctx.changeName);
  const hasE2e = relevant.some((a) => /(?:^|\/)(?:e2e|tests?|__tests__|spec)(?:\/|$|\.)/i.test(a.source_file));
  if (!hasE2e) {
    return [
      `enforce_e2e: no anchor found in any file under e2e/ tests/ __tests__/ for change "${ctx.changeName}"`,
    ];
  }
  return [];
}

async function listEvidenceTasks(dir: string, changeName: string): Promise<string[]> {
  if (!(await dirExists(dir))) return [];
  const entries = await readdir(dir);
  const prefix = `${changeName}__`;
  const out: string[] = [];
  for (const e of entries) {
    if (e.startsWith(prefix) && e.endsWith('.json')) {
      const task = e.slice(prefix.length, -'.json'.length);
      const abs = join(dir, e);
      if (await fileExists(abs)) out.push(task);
    }
  }
  return out;
}
