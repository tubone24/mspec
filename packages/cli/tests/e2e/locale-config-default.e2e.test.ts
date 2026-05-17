// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-002
// Change: artifact-language-config

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../../src/workflow/config-loader.js';

async function makeConfigFile(content: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'mspec-lc-default-'));
  await mkdir(join(dir, '.mspec'), { recursive: true });
  await writeFile(join(dir, '.mspec', 'config.yaml'), content);
  return join(dir, '.mspec', 'config.yaml');
}

describe('FR-002: locale キー未指定のとき既定 ja が適用される', () => {
  it('locale キーがない場合 resolvedLocale.locale === ja', async () => {
    const path = await makeConfigFile('version: 1\n');
    const result = await loadConfig(path);
    expect(result.resolvedLocale.locale).toBe('ja');
    expect(result.resolvedLocale.unsupported).toBe(false);
  });

  it('locale キーがない場合 unsupported は false', async () => {
    const path = await makeConfigFile('version: 1\nproject:\n  language: typescript\n');
    const result = await loadConfig(path);
    expect(result.resolvedLocale.unsupported).toBe(false);
    expect(result.resolvedLocale.requested).toBeUndefined();
  });
});
