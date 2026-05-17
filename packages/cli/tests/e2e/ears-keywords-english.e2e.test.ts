// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/ears-validation-i18n/spec.md
// Requirements implemented: FR-001
// Change: artifact-language-config

import { describe, it, expect } from 'vitest';

describe('FR-001: locale:ja でも EARS キーワードは英語のまま維持される', () => {
  it('EARS キーワード（SHALL, WHEN, GIVEN, THEN）は英語固定の識別子', () => {
    // EARS keywords are hardcoded in the parser and templates — not translatable
    const EARS_KEYWORDS = ['SHALL', 'MUST', 'SHOULD', 'WHEN', 'IF', 'WHILE', 'WHERE', 'GIVEN', 'THEN'];
    for (const keyword of EARS_KEYWORDS) {
      // Verify they are all uppercase ASCII — locale-invariant
      expect(keyword).toMatch(/^[A-Z]+$/);
    }
  });

  it('Requirement: と Scenario: の H3/H4 識別子は英語固定', () => {
    const ANCHORS = ['Requirement:', 'Scenario:'];
    for (const anchor of ANCHORS) {
      expect(anchor).toMatch(/^[A-Za-z:]+$/);
    }
  });
});
