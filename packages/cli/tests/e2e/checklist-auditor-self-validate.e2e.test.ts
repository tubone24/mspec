// @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
// Requirements implemented: FR-011
// Change: step-checkbox-update

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const AUDITOR_RUNTIME = join(ROOT, '.claude/agents/mspec-checklist-auditor.md');

// FR-011 Scenario: "Auditor self-validates that no item is left unannotated"
describe('FR-011: mspec-checklist-auditor self-validates all items have verify: annotation', () => {
  it('Constraints 節に全項目書き込み後の自己検証ステップの記述がある', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    // Should describe a self-validation step after writing all items
    const hasSelfValidate =
      /自己検証|self.?validat|re.?scan|再スキャン|書き終え|全項目.*後/i.test(content);
    expect(hasSelfValidate).toBe(true);
  });

  it('アノテーションなし行を検出したら verify: human を付与する fallback ルールが記述されている', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    // Should mention fallback annotation for unannotated items
    const hasFallback =
      /verify:\s*human.*付与|付与.*verify:\s*human|アノテーションなし.*human|fallback.*human/i.test(
        content,
      );
    expect(hasFallback).toBe(true);
  });

  it('完了宣言の前に自己検証を実行するという順序が記述されている', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    // Should mention completing validation before declaring done
    const hasCompletionOrder =
      /完了.*宣言|宣言.*前|before.*complet|complet.*declar|declare.*after/i.test(content);
    expect(hasCompletionOrder).toBe(true);
  });
});
