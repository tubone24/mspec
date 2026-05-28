// @mspec-delta 2026-05-28-115937-fix-specviewer-purpose-regression/specs/mspec-archive/spec.md
// Requirements implemented: FR-005
// Change: fix-specviewer-purpose-regression

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SKILL_PATH = join(process.cwd(), '../../.claude/skills/mspec-archive/SKILL.md');

describe('FR-005: mspec-archive SKILL.md — Purpose auto-generation step', () => {
  it('T002-A: SKILL.md contains step 3d Purpose generation procedure', async () => {
    const content = await readFile(SKILL_PATH, 'utf8');
    expect(content).toMatch(/3d\./);
    expect(content).toMatch(/Purpose/);
    expect(content).toMatch(/プレースホルダー|placeholder/i);
  });

  it('T002-B: step 3d specifies skip-and-continue for partial failures', async () => {
    const content = await readFile(SKILL_PATH, 'utf8');
    expect(content).toMatch(/skip.and.continue|スキップ.*継続|continue.*skip/i);
  });

  it('T002-C: step 3d is positioned after step 3c (postmortem hook)', async () => {
    const content = await readFile(SKILL_PATH, 'utf8');
    const pos3c = content.indexOf('3c.');
    const pos3d = content.indexOf('3d.');
    expect(pos3c).toBeGreaterThan(-1);
    expect(pos3d).toBeGreaterThan(pos3c);
  });

  it('T002-D: Purpose already filled case is handled (idempotent skip)', async () => {
    const content = await readFile(SKILL_PATH, 'utf8');
    expect(content).toMatch(/記述済み|already.*filled|filled.*skip|スキップ/i);
  });
});
