// @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
// Requirements implemented: FR-011
// Change: checklist-ai-driven-verification

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const AUDITOR_RUNTIME = join(ROOT, '.claude/agents/mspec-checklist-auditor.md');

// FR-011 Scenario: AI-verifiable item receives FR reference annotation
describe('FR-011: mspec-checklist-auditor annotates E2E-verifiable items with fr-NNN', () => {
  it('Constraints 節に <!-- verify: fr-NNN --> 付与ルールが記述されている', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    expect(content).toMatch(/verify:\s*fr-/i);
  });

  it('E2E Scenario 対応項目を fr-NNN でアノテーションする判定ルールが記述されている', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    // Should mention E2E / Scenario → fr-NNN annotation mapping
    const hasRule = /E2E|Scenario.*fr-|fr-.*Scenario/i.test(content);
    expect(hasRule).toBe(true);
  });
});

// FR-011 Scenario: Human-review item receives human annotation
describe('FR-011: mspec-checklist-auditor annotates non-E2E items with human', () => {
  it('Constraints 節に <!-- verify: human --> 付与ルールが記述されている', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    expect(content).toMatch(/verify:\s*human/i);
  });

  it('1 項目に付与する verify: アノテーションは 1 つという一意性ルールが記述されている', async () => {
    const content = await readFile(AUDITOR_RUNTIME, 'utf8');
    // Should mention "1 つ" or "one" or "一意" or "unique" near "verify:"
    const hasUniquenessRule =
      /1\s*つ|one\s*annotation|一意|unique|exactly\s*one/i.test(content) ||
      /verify:.*1|1.*verify:/i.test(content);
    expect(hasUniquenessRule).toBe(true);
  });
});
