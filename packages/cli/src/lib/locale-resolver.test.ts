// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: artifact-language-config

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveLocale, scanSupportedLocales, DEFAULT_LOCALE } from './locale-resolver.js';

async function makeTplDir(locales: string[]): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'mspec-locale-test-'));
  for (const locale of locales) {
    await writeFile(join(dir, `proposal.${locale}.md`), `# proposal ${locale}`);
  }
  return dir;
}

describe('resolveLocale', () => {
  it('FR-001: locale:ja が設定されている場合 ja を返す', async () => {
    const supported = new Set(['ja', 'en']);
    const result = resolveLocale({ locale: 'ja' }, supported);
    expect(result.locale).toBe('ja');
    expect(result.unsupported).toBe(false);
  });

  it('FR-002: locale 未設定の場合 ja (DEFAULT_LOCALE) を返す', () => {
    const supported = new Set(['ja', 'en']);
    const result = resolveLocale({}, supported);
    expect(result.locale).toBe(DEFAULT_LOCALE);
    expect(result.unsupported).toBe(false);
    expect(result.requested).toBeUndefined();
  });

  it('FR-003: 未対応 locale が指定されても throw しない（unsupported:true を返す）', () => {
    const supported = new Set(['ja', 'en']);
    const result = resolveLocale({ locale: 'xx' }, supported);
    expect(result.unsupported).toBe(true);
    expect(result.requested).toBe('xx');
    expect(result.locale).toBe(DEFAULT_LOCALE);
  });

  it('FR-004: 新規 locale が supported に含まれれば resolved される', () => {
    const supported = new Set(['ja', 'en', 'zh']);
    const result = resolveLocale({ locale: 'zh' }, supported);
    expect(result.locale).toBe('zh');
    expect(result.unsupported).toBe(false);
  });
});

describe('scanSupportedLocales', () => {
  it('FR-004: テンプレートディレクトリの *.{locale}.md から supported locales を ISO 639-1 lex ソートで返す', async () => {
    const dir = await makeTplDir(['ja', 'en', 'zh']);
    const result = await scanSupportedLocales(dir);
    expect([...result]).toEqual(['en', 'ja', 'zh']); // lex sort
  });

  it('テンプレートがない場合は空 Set を返す', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-empty-'));
    const result = await scanSupportedLocales(dir);
    expect(result.size).toBe(0);
  });

  it('同じ locale の複数ファイルは重複しない', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-dup-'));
    await writeFile(join(dir, 'proposal.ja.md'), '# p');
    await writeFile(join(dir, 'design.ja.md'), '# d');
    const result = await scanSupportedLocales(dir);
    expect([...result]).toEqual(['ja']);
  });
});
