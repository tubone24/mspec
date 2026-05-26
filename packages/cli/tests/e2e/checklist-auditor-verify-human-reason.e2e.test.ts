// @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md
// Requirements implemented: FR-007
// Change: reduce-verify-human-in-checklist

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

// FR-007 Scenario: verify: human fallback minimization with reason annotation
describe('FR-007: auditor minimizes verify: human and requires reason when used', () => {
  it('verify: human を付与する際に理由を括弧書きで明記する義務が記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    // Should mention that reason/理由 is required when using verify: human
    const hasReasonRule =
      /理由.*括弧|括弧.*理由|reason.*verify.*human|verify.*human.*reason/i.test(content) ||
      /機械検証不可|自動検証.*不可/i.test(content);
    expect(hasReasonRule).toBe(true);
  });

  it('verify: human の使用を最後の手段とする優先順位ルールが記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const hasPriorityRule =
      /最後の手段|last resort|優先順位/i.test(content) &&
      /verify.*human/i.test(content);
    expect(hasPriorityRule).toBe(true);
  });

  it('runtime と CLI テンプレートが同一内容である（FR-014 同期義務）', async () => {
    const runtime = await readFile(AUDITOR_RUNTIME, 'utf8');
    const template = await readFile(AUDITOR_TEMPLATE, 'utf8');
    expect(runtime).toBe(template);
  });
});
