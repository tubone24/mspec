// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: artifact-language-config

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from './config-loader.js';

async function makeConfig(content: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'mspec-cfg-'));
  const path = join(dir, 'config.yaml');
  await writeFile(path, content);
  // Need a minimal templates dir for scanSupportedLocales
  await mkdir(join(dir, 'templates', 'artifacts'), { recursive: true });
  await writeFile(join(dir, 'templates', 'artifacts', 'readme.ja.md'), '# ja');
  await writeFile(join(dir, 'templates', 'artifacts', 'readme.en.md'), '# en');
  return path;
}

describe('loadConfig — locale extension', () => {
  it('FR-001: locale: ja が設定されている場合 resolvedLocale が ja になる', async () => {
    const path = await makeConfig('version: 1\nlocale: ja\n');
    const result = await loadConfig(path);
    expect(result.resolvedLocale.locale).toBe('ja');
    expect(result.resolvedLocale.unsupported).toBe(false);
  });

  it('FR-002: locale 未設定の場合 resolvedLocale が ja (デフォルト) になる', async () => {
    const path = await makeConfig('version: 1\n');
    const result = await loadConfig(path);
    expect(result.resolvedLocale.locale).toBe('ja');
    expect(result.resolvedLocale.unsupported).toBe(false);
  });

  it('FR-003: 未対応 locale でも throw せず unsupported:true を返す', async () => {
    const path = await makeConfig('version: 1\nlocale: xx\n');
    await expect(loadConfig(path)).resolves.toBeDefined();
    const result = await loadConfig(path);
    expect(result.resolvedLocale.unsupported).toBe(true);
    expect(result.resolvedLocale.requested).toBe('xx');
  });

  it('既存フィールド (version, test, project, integrations) が壊れない', async () => {
    const path = await makeConfig(
      'version: 1\ntest:\n  command: npm test\nproject:\n  language: typescript\n',
    );
    const result = await loadConfig(path);
    expect(result.test?.command).toBe('npm test');
    expect(result.project?.language).toBe('typescript');
  });
});
