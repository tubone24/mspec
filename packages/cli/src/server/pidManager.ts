// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-002, FR-003
// Change: mspec-web-ui

import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface PidEntry {
  pid: number;
  port: number;
}

export function pidFilePath(root: string): string {
  return join(root, '.mspec', 'ui.pid');
}

export async function readPid(root: string): Promise<PidEntry | null> {
  try {
    const content = await readFile(pidFilePath(root), 'utf8');
    const [pidStr, portStr] = content.trim().split(':');
    const pid = parseInt(pidStr ?? '', 10);
    const port = parseInt(portStr ?? '', 10);
    if (isNaN(pid) || isNaN(port)) return null;
    return { pid, port };
  } catch {
    return null;
  }
}

export async function writePid(root: string, entry: PidEntry): Promise<void> {
  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(pidFilePath(root), `${entry.pid}:${entry.port}\n`, 'utf8');
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
