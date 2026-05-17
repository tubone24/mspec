// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/ears-validation-i18n/spec.md
// Requirements implemented: FR-002, FR-003, FR-004
// Change: artifact-language-config

import { describe, it, expect } from 'vitest';
import { parseDeltaSpec } from '../../src/parser/delta-spec.js';

const JAPANESE_BODY_SPEC = `
## ADDED Requirements

### Requirement: FR-001 — 日本語の機能要件

The system SHALL 設定ファイルを読み込む。

#### Scenario: 設定ファイルが存在する場合

GIVEN .mspec/config.yaml が存在する
WHEN mspec new を実行する
THEN 設定値が適用される

`.trim();

const ENGLISH_SPEC = `
## ADDED Requirements

### Requirement: FR-001 — English feature

The system SHALL load the configuration file.

#### Scenario: Config file exists

GIVEN .mspec/config.yaml exists
WHEN mspec new is run
THEN configuration is applied

`.trim();

describe('FR-002/FR-003: 日本語本文の Requirement が parse を通過する', () => {
  it('FR-002: 日本語本文の spec.md が parseDeltaSpec でパースエラーなし', () => {
    const { warnings } = parseDeltaSpec(JAPANESE_BODY_SPEC, 'test-capability');
    expect(warnings).toEqual([]);
  });

  it('FR-003: 既存の英語のみ spec.md も locale:ja 環境下でパースエラーなし', () => {
    const { warnings } = parseDeltaSpec(ENGLISH_SPEC, 'test-capability');
    expect(warnings).toEqual([]);
  });

  it('FR-004: 日本語シナリオ名の H4 アンカーが認識される', () => {
    const { spec } = parseDeltaSpec(JAPANESE_BODY_SPEC, 'test-capability');
    const req = spec.added[0];
    expect(req).toBeDefined();
    expect(req?.scenarios.length).toBeGreaterThan(0);
  });
});
