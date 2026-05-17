// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
// Requirements implemented: FR-001
// Change: artifact-language-config

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveTemplate, resetWarningCache } from '../../src/lib/template-resolver.js';

describe('FR-001: locale:ja のとき proposal.ja.md テンプレートが選択される', () => {
  beforeEach(() => resetWarningCache());

  it('proposal.ja.md が存在する場合 fellBack:false で ja コンテンツを返す', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-tpl-ja-'));
    await writeFile(join(dir, 'proposal.ja.md'), '# 提案書');
    await writeFile(join(dir, 'proposal.en.md'), '# Proposal');
    const result = await resolveTemplate('proposal', 'ja', dir);
    expect(result.content).toBe('# 提案書');
    expect(result.usedLocale).toBe('ja');
    expect(result.fellBack).toBe(false);
  });

  it('locale:en のとき proposal.en.md が選択される', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-tpl-en-'));
    await writeFile(join(dir, 'proposal.ja.md'), '# 提案書');
    await writeFile(join(dir, 'proposal.en.md'), '# Proposal');
    const result = await resolveTemplate('proposal', 'en', dir);
    expect(result.content).toBe('# Proposal');
    expect(result.usedLocale).toBe('en');
    expect(result.fellBack).toBe(false);
  });
});
