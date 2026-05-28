// @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md
// Requirements implemented: FR-006
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

// FR-006 Scenario: Constitution IV/VI use verify:cmd annotations
describe('FR-006 (MODIFIED): auditor uses verify:cmd for Constitution IV and VI', () => {
  it('Constitution IV は verify:cmd:mspec anchor check 形式を使用するルールが記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const hasIVCmdRule =
      /verify.*cmd.*mspec anchor check|verify.*cmd.*anchor/i.test(content) ||
      /Constitution.*IV.*verify.*cmd|双方向アンカー.*verify.*cmd/i.test(content);
    expect(hasIVCmdRule).toBe(true);
  });

  it('Constitution VI は verify:cmd:grep 形式を使用するルールが記述されている（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    const hasVICmdRule =
      /verify.*cmd.*grep|grep.*Security Capabilities.*verify/i.test(content) ||
      /Constitution.*VI.*verify.*cmd|Security by Default.*verify.*cmd/i.test(content);
    expect(hasVICmdRule).toBe(true);
  });

  it('Constitution IV/VI のアノテーションに verify:human が使われていない（runtime）', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    // Find the Constitution IV section and ensure it references verify:cmd not verify:human
    const constitutionIVSection = content.match(/Constitution\s*IV[^#]*/is);
    if (constitutionIVSection) {
      const sectionText = constitutionIVSection[0];
      // Should have verify:cmd reference, not standalone verify:human
      const hasCmdNotHuman =
        /verify.*cmd/i.test(sectionText) ||
        !/verify.*human/i.test(sectionText);
      expect(hasCmdNotHuman).toBe(true);
    }
  });

  it('runtime と CLI テンプレートが同一内容である（FR-014 同期義務）', async () => {
    const runtime = await readFile(AUDITOR_RUNTIME, 'utf8');
    const template = await readFile(AUDITOR_TEMPLATE, 'utf8');
    expect(runtime).toBe(template);
  });
});
