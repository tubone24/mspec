# Delta Spec: cli-core

## ADDED Requirements

### Requirement: FR-005 — CLI パッケージバージョン定義

このシステムは SHALL `packages/cli/package.json` の `version` フィールドを `0.1.2` として定義する.

#### Scenario: パッケージバージョンが 0.1.2 であること

- GIVEN `packages/cli/package.json` が存在する
- WHEN `"version"` フィールドを参照する
- THEN その値が `"0.1.2"` であること

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
