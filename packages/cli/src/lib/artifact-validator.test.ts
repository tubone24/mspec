import { describe, it, expect } from 'vitest';
import { validateArtifact, SKIPPED_PLACEHOLDER_MARKER } from './artifact-validator.js';

describe('validateArtifact', () => {
  it('returns no issues for a well-formed delta spec', () => {
    const contents = `# Delta Spec: theme-engine

## ADDED Requirements

### Requirement: FR-005 — Stylesheet applied on init
The system MUST apply the stylesheet.

#### Scenario: Apply on first load
- GIVEN nothing
- WHEN engine boots
- THEN stylesheet is applied
`;
    const issues = validateArtifact({
      filePath: '/foo/changes/2026-05-14-093015-x/specs/theme-engine/spec.md',
      contents,
      produces: 'specs/*/spec.md',
      constitutionRequired: false,
    });
    expect(issues).toEqual([]);
  });

  it('flags an H3 that does not match Requirement: FR-NNN — Title', () => {
    const contents = `# Delta Spec: cap

## ADDED Requirements

### Random heading
`;
    const issues = validateArtifact({
      filePath: '/foo/changes/x/specs/cap/spec.md',
      contents,
      produces: 'specs/*/spec.md',
      constitutionRequired: false,
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toMatch(/delta-spec/);
  });

  it('accepts a skipped placeholder unconditionally', () => {
    const contents = `${SKIPPED_PLACEHOLDER_MARKER}\n# Skipped: research\n\nReason: typo only`;
    const issues = validateArtifact({
      filePath: '/foo/research.md',
      contents,
      produces: 'research.md',
      constitutionRequired: true, // Even if required, placeholder is exempt
    });
    expect(issues).toEqual([]);
  });

  it('flags missing Constitution Check when constitutionRequired is true', () => {
    const contents = `# Design\n\nbody content with no constitution check`;
    const issues = validateArtifact({
      filePath: '/foo/design.md',
      contents,
      produces: 'design.md',
      constitutionRequired: true,
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/Constitution Check/);
  });

  it('does NOT flag Constitution Check when constitutionRequired is false', () => {
    const contents = `# Quickstart\n\ncontent`;
    const issues = validateArtifact({
      filePath: '/foo/quickstart.md',
      contents,
      produces: 'quickstart.md',
      constitutionRequired: false,
    });
    expect(issues).toEqual([]);
  });

  it('accepts a markdown that does have a Constitution Check heading', () => {
    const contents = `# Design

## Summary

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. Library-First | ✅ | ✅ | ok |
`;
    const issues = validateArtifact({
      filePath: '/foo/design.md',
      contents,
      produces: 'design.md',
      constitutionRequired: true,
    });
    expect(issues).toEqual([]);
  });
});
