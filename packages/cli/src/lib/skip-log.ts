import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ProjectPaths } from '../workflow/paths.js';
import { fileExists } from './change-discovery.js';

export interface SkipEntry {
  reason: string;
  skipped_at: string;
}

export type SkipLog = Record<string, Record<string, SkipEntry>>;

function skipLogPath(paths: ProjectPaths): string {
  return join(paths.cacheDir, 'skip-log.json');
}

export async function loadSkipLog(paths: ProjectPaths): Promise<SkipLog> {
  const p = skipLogPath(paths);
  if (!(await fileExists(p))) return {};
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw) as SkipLog;
  } catch {
    return {};
  }
}

export async function recordSkip(
  paths: ProjectPaths,
  changeName: string,
  stepId: string,
  reason: string,
): Promise<void> {
  const log = await loadSkipLog(paths);
  log[changeName] = log[changeName] ?? {};
  log[changeName][stepId] = { reason, skipped_at: new Date().toISOString() };
  const p = skipLogPath(paths);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(log, null, 2) + '\n', 'utf8');
}

export function isSkipped(log: SkipLog, changeName: string, stepId: string): boolean {
  return Boolean(log[changeName]?.[stepId]);
}

export function skippedSteps(log: SkipLog, changeName: string): string[] {
  return Object.keys(log[changeName] ?? {});
}
