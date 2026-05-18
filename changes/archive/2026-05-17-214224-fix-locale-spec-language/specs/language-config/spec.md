# Delta Spec: language-config

## ADDED Requirements

### Requirement: FR-005 — status --json へのアクティブロケール公開
`mspec status --json` を実行したとき、このシステムは SHALL 解決済みアクティブロケールを `"locale"` フィールドとして JSON 出力に含める。

#### Scenario: locale: ja 設定時に status が locale を返す
- GIVEN `config.yaml` に `locale: ja` が設定されたリポジトリで、アクティブな change が存在する
- WHEN `mspec status --change <dir> --json` を実行する
- THEN 出力 JSON の最上位に `"locale": "ja"` が含まれる

#### Scenario: locale 未設定時はデフォルト値が返る
- GIVEN `config.yaml` に `locale` キーが存在しない
- WHEN `mspec status --change <dir> --json` を実行する
- THEN 出力 JSON に `"locale": "ja"` が含まれる（デフォルトロケール適用）

### Requirement: FR-006 — continue --json へのアクティブロケール公開
`mspec continue --json` を実行したとき、このシステムは SHALL 解決済みアクティブロケールを `"locale"` フィールドとして JSON 出力に含める。

#### Scenario: continue --json も locale を返す
- GIVEN `config.yaml` に `locale: ja` が設定されたリポジトリで、アクティブな change が存在する
- WHEN `mspec continue --change <dir> --json` を実行する
- THEN 出力 JSON の最上位に `"locale": "ja"` が含まれる

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
