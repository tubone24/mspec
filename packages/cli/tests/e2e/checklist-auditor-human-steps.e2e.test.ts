// @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md
// Requirements implemented: FR-009
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

// FR-009 Scenario: verify:human items must include child steps
describe('FR-009: auditor requires child steps under verify:human items', () => {
  it('verify:human 付与時に子リスト確認手順を記載するルールが記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const hasChildStepsRule =
      /子リスト|child.*step|確認手順.*子|手順.*箇条書き|インデント.*リスト/i.test(content) ||
      /verify.*human.*手順|手順.*verify.*human/i.test(content) ||
      /最低.*[2２].*項目|[2２].*項目.*以上/i.test(content);
    expect(hasChildStepsRule).toBe(true);
  });

  it('確認手順の最低項目数（2 項目以上）が記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const hasMinStepsRule =
      /最低\s*[2２]\s*項目|minimum.*2.*step|at least.*2/i.test(content) ||
      /[2２]\s*項目.*必須|[2２]\s*つ.*手順/i.test(content);
    expect(hasMinStepsRule).toBe(true);
  });

  it('runtime と CLI テンプレートが同一内容である（FR-014 同期義務）', async () => {
    const runtime = await readFile(AUDITOR_RUNTIME, 'utf8');
    const template = await readFile(AUDITOR_TEMPLATE, 'utf8');
    expect(runtime).toBe(template);
  });
});
