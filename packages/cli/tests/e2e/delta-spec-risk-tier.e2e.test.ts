// @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
// Change: risk-tier-field
// @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
// Requirements implemented: FR-003, FR-005
// Change: risk-tier-field

import { describe, it, expect } from 'vitest';
import { parseDeltaSpec } from '../../src/parser/delta-spec.js';
import { validateChecklistConsistency } from '../../src/lib/artifact-validator.js';

const SPEC_WITH_CRITICAL = `# Delta Spec: test

## ADDED Requirements

### Requirement: FR-001 — Test FR

<!-- risk_tier: critical -->
<!-- blast_radius: external -->

このシステムは SHALL テストする.

#### Scenario: テスト
- GIVEN テスト前提
- WHEN テスト操作
- THEN テスト結果
`;

const SPEC_WITH_TRIVIAL = `# Delta Spec: test

## ADDED Requirements

### Requirement: FR-001 — Trivial FR

<!-- risk_tier: trivial -->

このシステムは SHALL テストする.

#### Scenario: テスト
- GIVEN テスト前提
- WHEN テスト操作
- THEN テスト結果
`;

const SPEC_NO_RISK_TIER = `# Delta Spec: test

## ADDED Requirements

### Requirement: FR-001 — Legacy FR

このシステムは SHALL テストする.

#### Scenario: テスト
- GIVEN テスト前提
- WHEN テスト操作
- THEN テスト結果
`;

// ── delta-spec FR-001: risk_tier フィールドのパース ──────────────────────

describe('FR-001: risk_tier フィールドのパース', () => {
  it('risk_tier: critical を含む FR を正常にパースする', () => {
    const { spec, errors } = parseDeltaSpec(SPEC_WITH_CRITICAL);
    expect(errors).toHaveLength(0);
    expect(spec.added[0].risk_tier).toBe('critical');
  });
});

// ── delta-spec FR-002: blast_radius フィールドのパース ───────────────────

describe('FR-002: blast_radius フィールドのパース', () => {
  it('blast_radius: external を含む FR を正常にパースする', () => {
    const { spec, errors } = parseDeltaSpec(SPEC_WITH_CRITICAL);
    expect(errors).toHaveLength(0);
    expect(spec.added[0].blast_radius).toBe('external');
  });
});

// ── delta-spec FR-003: risk_tier デフォルト ──────────────────────────────

describe('FR-003: risk_tier 未記載 FR は standard デフォルト', () => {
  it('risk_tier 未記載 FR を standard として返す', () => {
    const { spec, errors } = parseDeltaSpec(SPEC_NO_RISK_TIER);
    expect(errors).toHaveLength(0);
    expect(spec.added[0].risk_tier).toBe('standard');
  });
});

// ── delta-spec FR-004: 無効 risk_tier 値のエラー ────────────────────────

describe('FR-004: 無効 risk_tier 値で errors が非空', () => {
  it('risk_tier: unknown で errors が非空になる', () => {
    const specWithInvalidRiskTier = SPEC_NO_RISK_TIER.replace(
      '### Requirement: FR-001 — Legacy FR',
      '### Requirement: FR-001 — Legacy FR\n\n<!-- risk_tier: unknown -->',
    );
    const { errors } = parseDeltaSpec(specWithInvalidRiskTier);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('invalid risk_tier'))).toBe(true);
    expect(errors.some((e) => e.includes('unknown'))).toBe(true);
  });
});

// ── delta-spec FR-005: 無効 blast_radius 値のエラー ─────────────────────

describe('FR-005: 無効 blast_radius 値で errors が非空', () => {
  it('blast_radius: global で errors が非空になる', () => {
    const specWithInvalidBlast = SPEC_NO_RISK_TIER.replace(
      '### Requirement: FR-001 — Legacy FR',
      '### Requirement: FR-001 — Legacy FR\n\n<!-- blast_radius: global -->',
    );
    const { errors } = parseDeltaSpec(specWithInvalidBlast);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('invalid blast_radius'))).toBe(true);
    expect(errors.some((e) => e.includes('global'))).toBe(true);
  });
});

// ── verify-routing FR-003: trivial FR の checklist 整合 warning ──────────

describe('verify-routing FR-003: trivial FR が checklist に出現したら warning', () => {
  it('trivial FR が checklist.md に存在した場合 warning を出す', () => {
    const checklistWithTrivial = `# Checklist: test

## Delta Spec Coverage

- [ ] FR-001: trivial test <!-- verify: fr-001 -->
`;
    const warnings = validateChecklistConsistency(
      checklistWithTrivial,
      SPEC_WITH_TRIVIAL,
    );
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes('trivial'))).toBe(true);
    expect(warnings.some((w) => w.includes('FR-001'))).toBe(true);
  });
});

// ── verify-routing FR-005: risk_tier 未記載 FR の後方互換 ────────────────

describe('verify-routing FR-005: risk_tier 未記載 FR の後方互換動作', () => {
  it('risk_tier なし FR が standard として解釈され従来動作を維持する', () => {
    const { spec, errors, warnings } = parseDeltaSpec(SPEC_NO_RISK_TIER);
    expect(errors).toHaveLength(0);
    expect(spec.added[0].risk_tier).toBe('standard');
    // blast_radius は undefined（省略可能）
    expect(spec.added[0].blast_radius).toBeUndefined();
  });
});
