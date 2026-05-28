// @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md
// Requirements implemented: FR-006, FR-007, FR-008
// Change: human-friendly-artifacts

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const TEMPLATES = join(ROOT, 'packages/cli/templates/artifacts');
const AUDITOR = join(ROOT, 'packages/cli/templates/claude/agents/mspec-checklist-auditor.md');

// FR-006: Human-facing templates use natural language prose at section starts
describe('FR-006: 人間向けアーティファクトテンプレートは自然語・会話的文体を採用する', () => {
  it('checklist.ja.md の各 H2 セクション直下に自然語説明文が存在する', async () => {
    const content = await readFile(join(TEMPLATES, 'checklist.ja.md'), 'utf8');
    const sections = content.split(/^## /m).slice(1);
    for (const section of sections) {
      const lines = section.split('\n').slice(1).filter(l => l.trim());
      const firstContent = lines[0];
      expect(firstContent).toBeTruthy();
      expect(firstContent.startsWith('<!--')).toBe(false);
      expect(firstContent.startsWith('- [')).toBe(false);
    }
  });

  it('design.ja.md の ## Summary 直下にリード文が存在する（コメントでない）', async () => {
    const content = await readFile(join(TEMPLATES, 'design.ja.md'), 'utf8');
    const lines = content.split('\n');
    const summaryIdx = lines.findIndex(l => l.trim() === '## Summary');
    expect(summaryIdx).toBeGreaterThan(-1);
    const nonEmpty = lines.slice(summaryIdx + 1).find(l => l.trim().length > 0);
    expect(nonEmpty).toBeTruthy();
    expect(nonEmpty!.trim().startsWith('<!--')).toBe(false);
    expect(nonEmpty).toMatch(/ドキュメント|document/i);
  });

  it('proposal.ja.md の ## Why セクション直下に一文の説明が存在する', async () => {
    const content = await readFile(join(TEMPLATES, 'proposal.ja.md'), 'utf8');
    const whyMatch = content.match(/## Why\n\n(.+)/);
    expect(whyMatch).toBeTruthy();
    const prose = whyMatch![1].trim();
    expect(prose.startsWith('<!--')).toBe(false);
    expect(prose.startsWith('<')).toBe(false);
  });
});

// FR-007: checklist.md uses category-based groupings with human-friendly headings
describe('FR-007: checklist.md テンプレートはカテゴリ別グループ構造と視覚的階層を持つ', () => {
  it('checklist.ja.md の見出しが 機能確認 / リグレッションリスク / デプロイ前確認 になっている', async () => {
    const content = await readFile(join(TEMPLATES, 'checklist.ja.md'), 'utf8');
    expect(content).toContain('## 機能確認');
    expect(content).toContain('## リグレッションリスク');
    expect(content).toContain('## デプロイ前確認');
    expect(content).not.toContain('## Delta Spec Coverage');
    expect(content).not.toContain('## Constitution');
  });

  it('checklist.en.md の見出しが Functional Verification / Regression Risk / Pre-deploy Checklist になっている', async () => {
    const content = await readFile(join(TEMPLATES, 'checklist.en.md'), 'utf8');
    expect(content).toContain('## Functional Verification');
    expect(content).toContain('## Regression Risk');
    expect(content).toContain('## Pre-deploy Checklist');
    expect(content).not.toContain('## Source-of-Truth Regression Risk');
  });

  it('mspec-checklist-auditor.md のセクション名が新見出しと一致している', async () => {
    const content = await readFile(AUDITOR, 'utf8');
    expect(content).toContain('機能確認');
    expect(content).toContain('リグレッションリスク');
    expect(content).toContain('デプロイ前確認');
    expect(content).not.toContain('`## Delta Spec Coverage`');
    expect(content).not.toContain('`## Constitution` (`');
  });
});

// FR-008: design.md template has lead text placeholder under ## Summary
describe('FR-008: design.md テンプレートは ## Summary 直下にリード文プレースホルダを持つ', () => {
  it('design.en.md の ## Summary 直下にリード文が存在する（コメントでない）', async () => {
    const content = await readFile(join(TEMPLATES, 'design.en.md'), 'utf8');
    const lines = content.split('\n');
    const summaryIdx = lines.findIndex(l => l.trim() === '## Summary');
    expect(summaryIdx).toBeGreaterThan(-1);
    const nonEmpty = lines.slice(summaryIdx + 1).find(l => l.trim().length > 0);
    expect(nonEmpty).toBeTruthy();
    expect(nonEmpty!.trim().startsWith('<!--')).toBe(false);
    expect(nonEmpty).toMatch(/document|design/i);
  });
});
