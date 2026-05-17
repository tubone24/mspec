// @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
// Requirements implemented: FR-016
// Change: step-checkbox-update

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const IMPLEMENT_RUNTIME = join(ROOT, '.claude/skills/mspec-implement/SKILL.md');

// FR-016 Scenario: "Task goes GREEN, tasks.md checkbox is checked"
describe('FR-016: mspec-implement updates tasks.md checkbox when task reaches GREEN', () => {
  it('Procedure に tasks.md の TNNN チェックボックス更新指示が含まれる', async () => {
    const content = await readFile(IMPLEMENT_RUNTIME, 'utf8');
    // Should mention updating tasks.md checkbox using TNNN pattern
    const hasTnnnUpdate =
      /tasks\.md.*TNNN|TNNN.*tasks\.md|\- \[ \] TNNN.*\- \[x\] TNNN|\- \[x\] TNNN/i.test(
        content,
      );
    expect(hasTnnnUpdate).toBe(true);
  });

  it('Procedure に expect-green 成功後の tasks.md 更新の記述がある', async () => {
    const content = await readFile(IMPLEMENT_RUNTIME, 'utf8');
    // The update should be associated with --expect-green success
    const hasGreenContext = /expect-green.*tasks|tasks.*expect-green/i.test(content);
    expect(hasGreenContext).toBe(true);
  });
});

// FR-016 Scenario: "Partial task completion does not mark checkbox"
describe('FR-016: tasks.md checkbox is NOT updated when tests are still failing', () => {
  it('Procedure にテスト GREEN の場合のみ更新するという条件分岐または冪等の記述がある', async () => {
    const content = await readFile(IMPLEMENT_RUNTIME, 'utf8');
    // Should mention idempotency or conditional update
    const hasConditional =
      /冪等|idempotent|GREEN.*のみ|全テスト.*GREEN|GREEN.*全テスト|skip.*already|already.*\[x\]/i.test(
        content,
      );
    expect(hasConditional).toBe(true);
  });
});
