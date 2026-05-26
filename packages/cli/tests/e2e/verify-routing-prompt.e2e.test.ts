// @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: risk-tier-field

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const TEMPLATES_DIR = join(import.meta.dirname, '../../templates/claude');
const ARTIFACTS_DIR = join(import.meta.dirname, '../../templates/artifacts');

// ── verify-routing FR-001: delta-init テンプレートにプレースホルダー ──────

describe('verify-routing FR-001: delta init でプレースホルダーが生成される', () => {
  it('delta-spec.ja.md に risk_tier コメントプレースホルダーが含まれる', async () => {
    const content = await readFile(join(ARTIFACTS_DIR, 'delta-spec.ja.md'), 'utf8');
    expect(content).toContain('<!-- risk_tier:');
  });

  it('delta-spec.ja.md に blast_radius コメントプレースホルダーが含まれる', async () => {
    const content = await readFile(join(ARTIFACTS_DIR, 'delta-spec.ja.md'), 'utf8');
    expect(content).toContain('<!-- blast_radius:');
  });
});

// ── verify-routing FR-002: mspec-tasks/SKILL.md の risk_tier 分岐ルール ──

describe('verify-routing FR-002: mspec-tasks/SKILL.md に risk_tier 分岐ルールがある', () => {
  it('SKILL.md に critical → verify: human ルールが記述されている', async () => {
    const content = await readFile(join(TEMPLATES_DIR, 'skills/mspec-tasks/SKILL.md'), 'utf8');
    expect(content).toContain('critical');
    expect(content).toContain('verify: human');
  });

  it('SKILL.md に trivial → アノテーションなしのルールが記述されている', async () => {
    const content = await readFile(join(TEMPLATES_DIR, 'skills/mspec-tasks/SKILL.md'), 'utf8');
    expect(content).toContain('trivial');
  });
});

// ── verify-routing FR-003: mspec-checklist-auditor.md のルール ───────────

describe('verify-routing FR-003: mspec-checklist-auditor.md に trivial スキップルールがある', () => {
  it('mspec-checklist-auditor.md に trivial FR はスキップするルールが記述されている', async () => {
    const content = await readFile(
      join(TEMPLATES_DIR, 'agents/mspec-checklist-auditor.md'),
      'utf8',
    );
    expect(content).toContain('trivial');
  });

  it('mspec-checklist-auditor.md に critical → verify: human ルールが記述されている', async () => {
    const content = await readFile(
      join(TEMPLATES_DIR, 'agents/mspec-checklist-auditor.md'),
      'utf8',
    );
    expect(content).toContain('critical');
    expect(content).toContain('verify: human');
  });
});

// ── verify-routing FR-004: mspec-implement/SKILL.md の critical 警告 ──────

describe('verify-routing FR-004: mspec-implement/SKILL.md に critical 未達警告ルールがある', () => {
  it('mspec-implement/SKILL.md に critical FR の verify: human 未達警告ルールが記述されている', async () => {
    const content = await readFile(
      join(TEMPLATES_DIR, 'skills/mspec-implement/SKILL.md'),
      'utf8',
    );
    expect(content).toContain('critical');
  });
});
