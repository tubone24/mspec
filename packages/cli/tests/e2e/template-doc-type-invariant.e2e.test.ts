// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
// Requirements implemented: FR-004
// Change: artifact-language-config

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveTemplate, resetWarningCache } from '../../src/lib/template-resolver.js';

describe('FR-004: doc_type frontmatter が ja/en テンプレート間で locale-invariant', () => {
  beforeEach(() => resetWarningCache());

  it('ja テンプレートと en テンプレートで doc_type が同一識別子を持つ', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-tpl-dt-'));
    await writeFile(join(dir, 'design.ja.md'), '---\ndoc_type: Reference\n---\n\n# 設計書\n');
    await writeFile(join(dir, 'design.en.md'), '---\ndoc_type: Reference\n---\n\n# Design\n');

    const ja = await resolveTemplate('design', 'ja', dir);
    const en = await resolveTemplate('design', 'en', dir);

    // doc_type は英語識別子 'Reference' のまま両ロケールで一致
    expect(ja.content).toContain('doc_type: Reference');
    expect(en.content).toContain('doc_type: Reference');
  });
});
