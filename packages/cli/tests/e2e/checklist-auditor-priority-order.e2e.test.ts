// @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md
// Requirements implemented: FR-007
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

// FR-007 Scenario: Expanded priority order includes verify:cmd before verify:human
describe('FR-007 (MODIFIED): auditor priority order places verify:cmd before verify:human', () => {
  it('verify:cmd が verify:human より前の優先順位として定義されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const cmdIndex = content.search(/verify.*cmd/i);
    const humanFallbackIndex = content.search(/最後の手段|last resort/i);
    expect(cmdIndex).toBeGreaterThan(-1);
    expect(humanFallbackIndex).toBeGreaterThan(-1);
    // verify:cmd must appear before the "last resort" mention
    expect(cmdIndex).toBeLessThan(humanFallbackIndex);
  });

  it('優先順位リストが 4 段階以上（fr-NNN, cmd, Constitution IV, VI, human）を含む（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const hasFrNNN = /verify.*fr-/i.test(content);
    const hasCmd = /verify.*cmd/i.test(content);
    const hasConstitution = /Constitution\s*IV|Constitution\s*VI/i.test(content);
    const hasHumanFallback = /最後の手段|last resort/i.test(content);
    expect(hasFrNNN && hasCmd && hasConstitution && hasHumanFallback).toBe(true);
  });

  it('runtime と CLI テンプレートが同一内容である（FR-014 同期義務）', async () => {
    const runtime = await readFile(AUDITOR_RUNTIME, 'utf8');
    const template = await readFile(AUDITOR_TEMPLATE, 'utf8');
    expect(runtime).toBe(template);
  });
});
