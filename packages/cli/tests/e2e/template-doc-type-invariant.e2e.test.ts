// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
// Requirements implemented: FR-004
// Change: artifact-language-config

// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-015
// Change: revise-artifact-taxonomy

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

  it('AI-Internal 識別子も ja/en テンプレート間で locale-invariant', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-tpl-dt-ai-'));
    await writeFile(
      join(dir, 'tasks.ja.md'),
      '---\ndoc_type: AI-Internal\n---\n\n# タスク\n',
    );
    await writeFile(
      join(dir, 'tasks.en.md'),
      '---\ndoc_type: AI-Internal\n---\n\n# Tasks\n',
    );

    const ja = await resolveTemplate('tasks', 'ja', dir);
    const en = await resolveTemplate('tasks', 'en', dir);

    // AI-Internal も英語識別子のまま両ロケールで一致（誤って `AI-内部` などへ翻訳されない）
    expect(ja.content).toContain('doc_type: AI-Internal');
    expect(en.content).toContain('doc_type: AI-Internal');
  });
});
