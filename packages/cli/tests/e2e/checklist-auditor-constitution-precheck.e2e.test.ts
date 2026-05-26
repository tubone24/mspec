// @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md
// Requirements implemented: FR-006
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

// FR-006 Scenario: Constitution IV anchor check auto-verification
describe('FR-006: auditor performs inline pre-check for Constitution IV', () => {
  it('Constraints 節に mspec anchor check の実行指示が記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    expect(content).toMatch(/mspec anchor check/i);
  });

  it('Constitution IV（双方向アンカー）のインライン検証ルールが記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const hasIVRule =
      /Constitution\s*IV|双方向アンカー/i.test(content) &&
      /anchor check/i.test(content);
    expect(hasIVRule).toBe(true);
  });

  it('Constraints 節に Security Capabilities セクションの grep 確認指示が記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    expect(content).toMatch(/Security Capabilities/i);
  });

  it('Constitution VI（Security by Default）のインライン検証ルールが記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const hasVIRule =
      /Constitution\s*VI|Security by Default/i.test(content) &&
      /Security Capabilities/i.test(content);
    expect(hasVIRule).toBe(true);
  });

  it('runtime と CLI テンプレートが同一内容である（FR-014 同期義務）', async () => {
    const runtime = await readFile(AUDITOR_RUNTIME, 'utf8');
    const template = await readFile(AUDITOR_TEMPLATE, 'utf8');
    expect(runtime).toBe(template);
  });
});
