// @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/claude-integration/spec.md
// Requirements implemented: FR-010
// Change: diataxis-artifact-structure

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '../../../../.claude/skills');

// FR-010 Scenario 1: mspec-delta skill prompt references EARS format and keyword semantics
describe('FR-010: mspec-delta SKILL.md references EARS format and RFC 2119 semantics', () => {
  it('Procedure 節に SHALL / MUST / SHOULD の使い分けの記述がある', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-delta/SKILL.md'), 'utf8');
    expect(content).toMatch(/SHALL/);
    expect(content).toMatch(/MUST/);
    expect(content).toMatch(/SHOULD/);
  });

  it('Procedure 節に Scenario の必須化の記述がある', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-delta/SKILL.md'), 'utf8');
    expect(content).toMatch(/Scenario/);
    expect(content).toMatch(/GIVEN|WHEN|THEN/);
  });

  it('Procedure 節に EARS の言及がある', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-delta/SKILL.md'), 'utf8');
    expect(content).toMatch(/EARS/i);
  });
});

// FR-010 Scenario 2: mspec-proposal skill prompt acknowledges EARS+Scenario convention
describe('FR-010: mspec-proposal SKILL.md acknowledges EARS+Scenario convention', () => {
  it('Procedure 節に EARS または delta ステップとの関連の注記がある', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-proposal/SKILL.md'), 'utf8');
    // Should mention EARS, delta step, or SHALL/MUST/SHOULD distinction
    const hasEarsNote = /EARS|SHALL|MUST.*SHOULD|delta.*EARS|EARS.*delta/i.test(content);
    expect(hasEarsNote).toBe(true);
  });
});

// FR-010 Scenario 3: mspec-design skill prompt references EARS requirement conventions
describe('FR-010: mspec-design SKILL.md references EARS/Scenario alignment', () => {
  it('Procedure 節に Scenario との対応付け指示がある', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-design/SKILL.md'), 'utf8');
    const hasScenarioRef = /Scenario|GIVEN|acceptance|受け入れ/i.test(content);
    expect(hasScenarioRef).toBe(true);
  });
});
