// @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
// Requirements implemented: FR-014
// Change: checklist-ai-driven-verification

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const AUDITOR_RUNTIME = join(ROOT, '.claude/agents/mspec-checklist-auditor.md');
const AUDITOR_TEMPLATE = join(ROOT, 'packages/cli/templates/claude/agents/mspec-checklist-auditor.md');
const IMPLEMENT_RUNTIME = join(ROOT, '.claude/skills/mspec-implement/SKILL.md');
const IMPLEMENT_TEMPLATE = join(ROOT, 'packages/cli/templates/claude/skills/mspec-implement/SKILL.md');

// FR-014 Scenario: Template and runtime skill contain identical verify procedure
describe('FR-014: mspec-checklist-auditor runtime/template sync', () => {
  it('runtime ファイルに verify: アノテーション手順が含まれている', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    // Must contain the verify annotation procedure before sync can be meaningful
    expect(content).toMatch(/verify:\s*fr-/i);
  });

  it('runtime と template の内容が完全に一致している', async () => {
    const runtime = await readFile(AUDITOR_RUNTIME, 'utf8');
    const template = await readFile(AUDITOR_TEMPLATE, 'utf8');
    expect(runtime).toEqual(template);
  });
});

describe('FR-014: mspec-implement SKILL.md runtime/template sync', () => {
  it('runtime ファイルに auto-check / unchecked-report 手順が含まれている', async () => {
    const content = await readFile(IMPLEMENT_RUNTIME, 'utf8');
    // Must contain the verify auto-check procedure before sync can be meaningful
    expect(content).toMatch(/verify:\s*fr-/i);
  });

  it('runtime と template の内容が完全に一致している', async () => {
    const runtime = await readFile(IMPLEMENT_RUNTIME, 'utf8');
    const template = await readFile(IMPLEMENT_TEMPLATE, 'utf8');
    expect(runtime).toEqual(template);
  });
});

// FR-014 (step-checkbox-update): 7 step skills runtime/template sync
const STEP_SKILLS = ['mspec-proposal', 'mspec-delta', 'mspec-research', 'mspec-design', 'mspec-quickstart', 'mspec-checklist', 'mspec-tasks'];

for (const skill of STEP_SKILLS) {
  describe(`FR-014: ${skill} SKILL.md runtime/template sync`, () => {
    it('runtime と template の内容が完全に一致している', async () => {
      const runtime = await readFile(join(ROOT, `.claude/skills/${skill}/SKILL.md`), 'utf8');
      const template = await readFile(join(ROOT, `packages/cli/templates/claude/skills/${skill}/SKILL.md`), 'utf8');
      expect(runtime).toEqual(template);
    });
  });
}
