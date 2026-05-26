// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-002, FR-003
// Change: mspec-web-ui

import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface PidEntry {
  pid: number;
  port: number;
}

const PID_FILE = join(homedir(), '.mspec', 'ui.pid');

export async function readPid(): Promise<PidEntry | null> {
  try {
    const content = await readFile(PID_FILE, 'utf8');
    const [pidStr, portStr] = content.trim().split(':');
    const pid = parseInt(pidStr ?? '', 10);
    const port = parseInt(portStr ?? '', 10);
    if (isNaN(pid) || isNaN(port)) return null;
    return { pid, port };
  } catch {
    return null;
  }
}

export async function writePid(entry: PidEntry): Promise<void> {
  await mkdir(join(homedir(), '.mspec'), { recursive: true });
  await writeFile(PID_FILE, `${entry.pid}:${entry.port}\n`, 'utf8');
}

export async function clearPid(): Promise<void> {
  try {
    await unlink(PID_FILE);
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

export { PID_FILE };
