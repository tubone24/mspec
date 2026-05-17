// @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
// Requirements implemented: FR-013
// Change: checklist-ai-driven-verification

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const IMPLEMENT_SKILL = join(ROOT, '.claude/skills/mspec-implement/SKILL.md');

// FR-013 Scenario: Unchecked human items reported at end of implement
describe('FR-013: mspec-implement reports unchecked human items at end of step', () => {
  it('全タスク完了後のステップに verify: human 未チェック項目の提示とブロック手順が記述されている', async () => {
    const content = await readFile(IMPLEMENT_SKILL, 'utf8');
    // Should mention: verify: human unchecked items, present list, block
    expect(content).toMatch(/verify:\s*human/i);
  });

  it('人間レビュー要求とブロックの記述がある', async () => {
    const content = await readFile(IMPLEMENT_SKILL, 'utf8');
    const hasHumanBlock =
      /human.*block|block.*human|人間.*block|block.*人間|人間レビュー|human\s*review/i.test(content);
    expect(hasHumanBlock).toBe(true);
  });
});

// FR-013 Scenario: Unchecked fr-annotated items trigger gap warning
describe('FR-013: mspec-implement warns about unchecked fr-annotated items (gap)', () => {
  it('verify: fr-NNN 未チェック項目があった場合のギャップ警告手順が記述されている', async () => {
    const content = await readFile(IMPLEMENT_SKILL, 'utf8');
    // Should mention gap warning for fr-annotated unchecked items
    const hasGapWarning =
      /gap|警告|warn|ギャップ/i.test(content);
    expect(hasGapWarning).toBe(true);
  });

  it('FR 番号の報告とブロックの記述がある', async () => {
    const content = await readFile(IMPLEMENT_SKILL, 'utf8');
    // Should mention reporting FR numbers and blocking
    const hasFrReport =
      /FR-.*block|block.*FR-|FR.*番号|番号.*FR|fr-NNN.*block|block.*fr-NNN/i.test(content);
    expect(hasFrReport).toBe(true);
  });
});

// FR-013 Scenario: All items checked — implementation declared complete
describe('FR-013: mspec-implement declares completion when all items checked', () => {
  it('全項目チェック済みの場合に実装完了を宣言する手順が記述されている', async () => {
    const content = await readFile(IMPLEMENT_SKILL, 'utf8');
    // Should mention declaring complete / 実装完了 when all items are checked
    const hasCompletionDeclaration =
      /実装完了|complete|completion|全.*チェック|all.*checked|checked.*all/i.test(content);
    expect(hasCompletionDeclaration).toBe(true);
  });
});
