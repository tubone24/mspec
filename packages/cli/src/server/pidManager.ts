// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-002, FR-003
// Change: mspec-web-ui
// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
// Requirements implemented: FR-011
// Change: web-ui-smart-launch

import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface PidEntry {
  pid: number;
  port: number;
  projectRoot: string;
  token: string;
}

export function pidFilePath(root: string): string {
  return join(root, '.mspec', 'ui.pid');
}

export async function readPid(root: string): Promise<PidEntry | null> {
  try {
    const content = await readFile(pidFilePath(root), 'utf8');
    const data = JSON.parse(content) as unknown;
    if (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as Record<string, unknown>)['pid'] === 'number' &&
      typeof (data as Record<string, unknown>)['port'] === 'number' &&
      typeof (data as Record<string, unknown>)['projectRoot'] === 'string' &&
      typeof (data as Record<string, unknown>)['token'] === 'string'
    ) {
      return data as PidEntry;
    }
    return null;
  } catch {
    return null;
  }
}

export async function writePid(root: string, entry: PidEntry): Promise<void> {
  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(pidFilePath(root), JSON.stringify(entry), 'utf8');
}

export async function clearPid(root: string): Promise<void> {
  try {
    await unlink(pidFilePath(root));
  } catch {
    // File already gone — idempotent
  }
}

export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
