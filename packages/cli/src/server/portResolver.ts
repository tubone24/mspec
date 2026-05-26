// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-004
// Change: mspec-web-ui

import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';

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

export const DEFAULT_PORT = 3847;
