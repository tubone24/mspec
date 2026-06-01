// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-004
// Change: mspec-web-ui
// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
// Requirements implemented: FR-008
// Change: web-ui-smart-launch

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { parse as parseYaml } from 'yaml';

export const DEFAULT_PORT = 3847;
export const DEFAULT_PORT_CANDIDATES = [3847, 3848, 3849, 3850, 3851];

export async function resolvePort(configFile?: string): Promise<number> {
  if (!configFile) return DEFAULT_PORT;
  try {
    const raw = await readFile(configFile, 'utf8');
    const config = parseYaml(raw) as Record<string, unknown> | undefined;
    const ui = config?.['ui'] as Record<string, unknown> | undefined;
    const port = ui?.['port'];
    if (typeof port === 'number' && port > 0) return port;
  } catch {
    // Config missing or invalid — use default
  }
  return DEFAULT_PORT;
}

/** Returns the configured ui.port if set, otherwise DEFAULT_PORT */
export async function resolveConfigPort(configFile?: string): Promise<number | undefined> {
  if (!configFile) return undefined;
  try {
    const raw = await readFile(configFile, 'utf8');
    const config = parseYaml(raw) as Record<string, unknown> | undefined;
    const ui = config?.['ui'] as Record<string, unknown> | undefined;
    const port = ui?.['port'];
    if (typeof port === 'number' && port > 0) return port;
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Probes each candidate port on 127.0.0.1 and returns the first free one.
 * Throws if all candidates are exhausted.
 */
export async function resolvePortFromList(candidates: number[]): Promise<number> {
  for (const port of candidates) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(
    `No free port found in candidates: [${candidates.join(', ')}]. ` +
    'Stop any conflicting processes or configure a different port range.',
  );
}

/** Checks whether a TCP port is free by binding to 127.0.0.1. */
export function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, '127.0.0.1');
  });
}
