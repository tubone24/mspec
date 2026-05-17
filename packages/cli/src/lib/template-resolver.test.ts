// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: artifact-language-config

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveTemplate, resetWarningCache } from './template-resolver.js';

async function makeTplDir(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'mspec-tpl-test-'));
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(dir, name), content);
  }
  return dir;
}

describe('resolveTemplate', () => {
  beforeEach(() => resetWarningCache());

  it('FR-001: <name>.<locale>.md が存在する場合それを返す（fellBack:false）', async () => {
    const dir = await makeTplDir({ 'proposal.ja.md': '# 提案書' });
    const result = await resolveTemplate('proposal', 'ja', dir);
    expect(result.content).toBe('# 提案書');
    expect(result.usedLocale).toBe('ja');
    expect(result.fellBack).toBe(false);
  });

  it('FR-002: <name>.<locale>.md が欠落して <name>.en.md がある場合 en フォールバック（fellBack:true）', async () => {
    const dir = await makeTplDir({ 'proposal.en.md': '# Proposal' });
    const result = await resolveTemplate('proposal', 'ja', dir);
    expect(result.usedLocale).toBe('en');
    expect(result.fellBack).toBe(true);
  });

  it('FR-002: 重複する (locale, artifact) 組み合わせで警告は1回のみ', async () => {
    const dir = await makeTplDir({ 'proposal.en.md': '# Proposal' });
    const stderrMessages: string[] = [];
    const origWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk: string | Uint8Array) => {
      if (typeof chunk === 'string') stderrMessages.push(chunk);
      return true;
    };
    try {
      await resolveTemplate('proposal', 'ja', dir);
      await resolveTemplate('proposal', 'ja', dir); // same pair
    } finally {
      process.stderr.write = origWrite;
    }
    const warnings = stderrMessages.filter((m) => m.includes('missing template'));
    expect(warnings.length).toBe(1); // only once
  });

  it('legacy fallback: <name>.md が存在する場合それを返す（Phase A 互換）', async () => {
    const dir = await makeTplDir({ 'proposal.md': '# Legacy Proposal' });
    const result = await resolveTemplate('proposal', 'ja', dir);
    expect(result.content).toBe('# Legacy Proposal');
    expect(result.fellBack).toBe(true);
  });

  it('全ファイル欠落時は TemplateNotFoundError を投げる', async () => {
    const dir = await makeTplDir({});
    await expect(resolveTemplate('proposal', 'ja', dir)).rejects.toThrow('TemplateNotFoundError');
  });
});
