// @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
// Requirements implemented: FR-012
// Change: checklist-ai-driven-verification

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const IMPLEMENT_SKILL = join(ROOT, '.claude/skills/mspec-implement/SKILL.md');

// FR-012 Scenario: Test suite goes GREEN, corresponding checklist item is auto-checked
describe('FR-012: mspec-implement auto-checks checklist items when task goes GREEN', () => {
  it('Procedure に verify: fr-NNN アノテーション付き項目を - [x] に更新する手順が記述されている', async () => {
    const content = await readFile(IMPLEMENT_SKILL, 'utf8');
    expect(content).toMatch(/verify:\s*fr-/i);
  });

  it('Procedure に - [ ] から - [x] への更新ロジックが記述されている', async () => {
    const content = await readFile(IMPLEMENT_SKILL, 'utf8');
    // Should mention checkbox update from unchecked to checked
    const hasCheckboxUpdate = /\- \[x\]|\[x\]|\- \[ \].*\- \[x\]|checked|チェック/i.test(content);
    expect(hasCheckboxUpdate).toBe(true);
  });

  it('Procedure に task アンカーから FR-NNN を解決する手順が記述されている', async () => {
    const content = await readFile(IMPLEMENT_SKILL, 'utf8');
    // Should mention reading task anchor / Requirements implemented
    const hasAnchorRead =
      /Requirements implemented|anchor.*FR|FR.*anchor|逆引き|resolve/i.test(content);
    expect(hasAnchorRead).toBe(true);
  });
});

// FR-012 Scenario: No matching verify annotation — checklist unchanged
describe('FR-012: checklist unchanged when no matching verify annotation', () => {
  it('Procedure に verify: アノテーションが存在しない場合は checklist.md を変更しない旨が記述されている', async () => {
    const content = await readFile(IMPLEMENT_SKILL, 'utf8');
    // Should mention idempotency / no change when already checked / unchanged
    const hasIdempotent =
      /冪等|idempot|変更しない|unchanged|already.*\[x\]|\[x\].*already/i.test(content);
    expect(hasIdempotent).toBe(true);
  });
});
