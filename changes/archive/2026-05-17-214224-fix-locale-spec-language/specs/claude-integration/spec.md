# Delta Spec: claude-integration

## ADDED Requirements

### Requirement: FR-021 — スキルの EARS パターン例示のロケール対応
`mspec-delta` スキルおよび EARS 形式を例示する全スキルは SHALL `mspec status --json` が返す `"locale"` フィールドを読み取り、そのロケールに対応した EARS パターン例示（`locale: ja` の場合は `このシステムは SHALL <振る舞い>.`、`locale: en` の場合は `The system SHALL <response>.`）を LLM への指示に使用する。

#### Scenario: locale=ja 設定時に日本語 EARS 形式で Requirements が生成される
- GIVEN `config.yaml` に `locale: ja` が設定されており、`mspec status --json` が `"locale": "ja"` を返す
- WHEN `mspec:delta` スキルを実行して Requirements を生成する
- THEN 生成された `specs/<capability>/spec.md` の Requirement 本文が `このシステムは SHALL <振る舞い>.` 形式であり、`The system SHALL` の文字列が含まれない

#### Scenario: locale=en 設定時は英語 EARS 形式を維持する
- GIVEN `config.yaml` に `locale: en` が設定されており、`mspec status --json` が `"locale": "en"` を返す
- WHEN `mspec:delta` スキルを実行して Requirements を生成する
- THEN 生成された Requirement 本文が `The system SHALL <response>.` 形式である

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
