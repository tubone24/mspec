# Delta Spec: cli-delta-spec

## ADDED Requirements

### Requirement: FR-011 — Use SHALL as default RFC 2119 keyword in ADDED Requirement stubs

The system MUST emit `SHALL` as the default RFC 2119 keyword in each newly generated ADDED Requirement body stub (e.g. `The system SHALL <behavior>.`), reflecting the project convention that `SHALL` denotes functional requirements, `MUST` denotes constraints and safety requirements, and `SHOULD` denotes recommendations, as defined in the Constitution.

#### Scenario: Default stub uses SHALL keyword
- GIVEN `specs/theme-engine/spec.md` が既存の capability として存在する
- WHEN ユーザーが `mspec delta init --capability theme-engine --change 2026-05-14-093015-apply-css` を実行する
- THEN 生成される ADDED Requirement 本文スタブが `The system SHALL <behavior>.` の形式を持つ
- AND スタブのデフォルトキーワードは `MUST` ではなく `SHALL` である

#### Scenario: New capability also uses SHALL stub
- GIVEN プロジェクトに `specs/search/spec.md` が存在しない（新規 capability）
- WHEN ユーザーが `mspec delta init --capability search --change 2026-05-14-093015-add-search` を実行する
- THEN 生成される FR-001 本文スタブが `The system SHALL <behavior>.` の形式を持つ

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
