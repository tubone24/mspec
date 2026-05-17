// @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
// Requirements implemented: FR-015
// Change: step-checkbox-update

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const SKILLS_DIR = join(ROOT, '.claude/skills');

// FR-015 Scenario: "Proposal step marks its artifact as done"
describe('FR-015: mspec-proposal updates readme.md Artifacts checkbox', () => {
  it('Procedure に readme.md の proposal.md 行を - [x] に更新する指示が含まれる', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-proposal/SKILL.md'), 'utf8');
    const hasArtifactsUpdate =
      /readme\.md.*Artifacts|\- \[ \] proposal\.md.*\- \[x\]|\- \[x\] proposal\.md|Artifacts.*proposal/i.test(
        content,
      );
    expect(hasArtifactsUpdate).toBe(true);
  });

  it('Procedure に mspec validate 失敗時のロールバック指示が含まれる', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-proposal/SKILL.md'), 'utf8');
    const hasRollback = /ロールバック|rollback|\- \[x\].*\- \[ \]|validate.*失敗/i.test(content);
    expect(hasRollback).toBe(true);
  });
});

// FR-015 Scenario: "Delta step marks its specs artifact as done"
describe('FR-015: mspec-delta updates readme.md Artifacts checkbox', () => {
  it('Procedure に readme.md の specs/*/spec.md 行を - [x] に更新する指示が含まれる', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-delta/SKILL.md'), 'utf8');
    const hasArtifactsUpdate =
      /readme\.md.*Artifacts|specs\/\*\/spec\.md.*\[x\]|\[x\].*specs\/\*\/spec\.md|Artifacts.*specs/i.test(
        content,
      );
    expect(hasArtifactsUpdate).toBe(true);
  });

  it('Procedure に mspec validate 失敗時のロールバック指示が含まれる', async () => {
    const content = await readFile(join(SKILLS_DIR, 'mspec-delta/SKILL.md'), 'utf8');
    const hasRollback = /ロールバック|rollback|\- \[x\].*\- \[ \]|validate.*失敗/i.test(content);
    expect(hasRollback).toBe(true);
  });
});

// FR-015 coverage for remaining skills (T103)
describe('FR-015: remaining step skills update readme.md Artifacts checkbox', () => {
  const skills = [
    { name: 'mspec-research', artifact: 'research.md' },
    { name: 'mspec-design', artifact: 'design.md' },
    { name: 'mspec-quickstart', artifact: 'quickstart.md' },
    { name: 'mspec-checklist', artifact: 'checklist.md' },
    { name: 'mspec-tasks', artifact: 'tasks.md' },
  ];

  for (const { name, artifact } of skills) {
    it(`${name} に Artifacts 更新指示が含まれる`, async () => {
      const content = await readFile(join(SKILLS_DIR, `${name}/SKILL.md`), 'utf8');
      const hasArtifactsUpdate =
        /readme\.md.*Artifacts|Artifacts.*readme\.md|\- \[x\].*\.md|\[x\] \w.*\.md/i.test(content);
      expect(hasArtifactsUpdate).toBe(true);
    });
  }
});
