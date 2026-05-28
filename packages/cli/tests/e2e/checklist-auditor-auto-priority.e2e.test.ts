// @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md
// Requirements implemented: FR-008
// Change: checklist-reduce-verify-human

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const AUDITOR_RUNTIME = join(ROOT, '.claude/agents/mspec-checklist-auditor.md');
const AUDITOR_TEMPLATE = join(
  ROOT,
  'packages/cli/templates/claude/agents/mspec-checklist-auditor.md'
);

// FR-008 Scenario: Category-agnostic verify:auto priority
describe('FR-008: auditor applies verify:auto priority across all categories', () => {
  it('verify:cmd 形式が Constraints 節の優先順位リストに記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    expect(content).toMatch(/verify:\s*cmd/i);
  });

  it('CLI コマンドで検証可能な項目は verify:human を付与しないルールが記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const hasNoCmdHumanRule =
      /verify.*cmd.*command/i.test(content) ||
      /CLI.*コマンド.*verify|コマンド.*自動/i.test(content) ||
      /mspec validate.*verify|mspec anchor check.*verify|mspec spec lint.*verify/i.test(content);
    expect(hasNoCmdHumanRule).toBe(true);
  });

  it('SoT Regression 項目への verify:auto 適用が記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const hasSoTAutoRule =
      /Source-of-Truth.*verify|SoT.*auto|影響なし.*verify/i.test(content) ||
      /Regression.*verify.*fr|Regression.*cmd/i.test(content);
    expect(hasSoTAutoRule).toBe(true);
  });

  it('runtime と CLI テンプレートが同一内容である（FR-014 同期義務）', async () => {
    const runtime = await readFile(AUDITOR_RUNTIME, 'utf8');
    const template = await readFile(AUDITOR_TEMPLATE, 'utf8');
    expect(runtime).toBe(template);
  });
});
