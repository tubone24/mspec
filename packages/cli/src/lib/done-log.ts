// @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
// Requirements implemented: FR-001, FR-002
// Change: fix-special-step-produces

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ProjectPaths } from '../workflow/paths.js';
import { fileExists } from './change-discovery.js';

export interface DoneEntry {
  done_at: string;
}

export type DoneLog = Record<string, Record<string, DoneEntry>>;

function doneLogPath(paths: ProjectPaths): string {
  return join(paths.cacheDir, 'done-log.json');
}

export async function loadDoneLog(paths: ProjectPaths): Promise<DoneLog> {
  const p = doneLogPath(paths);
  if (!(await fileExists(p))) return {};
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw) as DoneLog;
  } catch {
    return {};
  }
}

export async function recordDone(
  paths: ProjectPaths,
  changeName: string,
  stepId: string,
): Promise<void> {
  const log = await loadDoneLog(paths);
  log[changeName] = log[changeName] ?? {};
  log[changeName][stepId] = { done_at: new Date().toISOString() };
  const p = doneLogPath(paths);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(log, null, 2) + '\n', 'utf8');
}

export function isDone(log: DoneLog, changeName: string, stepId: string): boolean {
  return Boolean(log[changeName]?.[stepId]);
}
