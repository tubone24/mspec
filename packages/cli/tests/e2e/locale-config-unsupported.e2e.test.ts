// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-003
// Change: artifact-language-config

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../../src/workflow/config-loader.js';

async function makeConfigFile(content: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'mspec-lc-unsup-'));
  await mkdir(join(dir, '.mspec'), { recursive: true });
  await writeFile(join(dir, '.mspec', 'config.yaml'), content);
  return join(dir, '.mspec', 'config.yaml');
}

describe('FR-003: 未対応 locale のとき loadConfig は throw せず unsupported:true を返す', () => {
  it('locale: xx で loadConfig が resolvedLocale.unsupported === true を返す', async () => {
    const path = await makeConfigFile('version: 1\nlocale: xx\n');
    const result = await loadConfig(path);
    expect(result.resolvedLocale.unsupported).toBe(true);
    expect(result.resolvedLocale.requested).toBe('xx');
    expect(result.resolvedLocale.locale).toBe('ja'); // fallback to default
  });

  it('loadConfig は unsupported locale でも throw しない', async () => {
    const path = await makeConfigFile('version: 1\nlocale: zz\n');
    await expect(loadConfig(path)).resolves.toBeDefined();
  });
});
