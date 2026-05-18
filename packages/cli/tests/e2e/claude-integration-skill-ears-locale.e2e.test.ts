// @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/claude-integration/spec.md
// Requirements implemented: FR-021
// Change: fix-locale-spec-language

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '../../../../.claude/skills');

// FR-021: mspec-delta SKILL.md contains locale-aware EARS patterns
describe('FR-021: mspec-delta SKILL.md に locale 対応 EARS パターン例示が含まれる', () => {
  it('locale=ja 用の日本語 EARS パターン（このシステムは SHALL）が含まれる', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-delta/SKILL.md'), 'utf8');
    expect(content).toContain('このシステムは SHALL');
  });

  it('locale=en 用の英語 EARS パターン（The system SHALL）が含まれる', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-delta/SKILL.md'), 'utf8');
    expect(content).toContain('The system SHALL');
  });

  it('locale 分岐の指示が含まれる（locale=ja の場合 / locale=en の場合）', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-delta/SKILL.md'), 'utf8');
    expect(content).toMatch(/locale.*ja|ja.*locale/i);
    expect(content).toMatch(/locale.*en|en.*locale/i);
  });
});
