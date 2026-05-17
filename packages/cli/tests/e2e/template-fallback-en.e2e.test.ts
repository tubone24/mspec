// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
// Requirements implemented: FR-002
// Change: artifact-language-config

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveTemplate, resetWarningCache } from '../../src/lib/template-resolver.js';

describe('FR-002: ja テンプレート欠落のとき en フォールバック + stderr 警告', () => {
  beforeEach(() => resetWarningCache());

  it('proposal.ja.md が欠落して proposal.en.md がある場合 en フォールバック（fellBack:true）', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-tpl-fb-'));
    await writeFile(join(dir, 'proposal.en.md'), '# Proposal');
    const result = await resolveTemplate('proposal', 'ja', dir);
    expect(result.usedLocale).toBe('en');
    expect(result.fellBack).toBe(true);
  });

  it('同一 (locale, artifact) 組み合わせで warning は1回のみ emit される', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-tpl-dedup-'));
    await writeFile(join(dir, 'proposal.en.md'), '# Proposal');
    const msgs: string[] = [];
    const orig = process.stderr.write.bind(process.stderr);
    process.stderr.write = (c: string | Uint8Array) => { if (typeof c === 'string') msgs.push(c); return true; };
    try {
      await resolveTemplate('proposal', 'ja', dir);
      await resolveTemplate('proposal', 'ja', dir);
    } finally { process.stderr.write = orig; }
    expect(msgs.filter(m => m.includes('missing template')).length).toBe(1);
  });
});
