<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# language-config Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — locale フィールドの読み込み
The system SHALL read the top-level `locale` field from `config.yaml` and use the resolved value as the active locale for all artifact and question-bank rendering.

#### Scenario: config.yaml に locale: ja が設定されている
- GIVEN リポジトリ直下に `config.yaml` があり、トップレベルに `locale: ja` が含まれている
- WHEN `mspec new sample-feature` を実行する
- THEN 生成された `readme.md` 内のセクション見出し・プレースホルダが日本語ロケールのテンプレートから採られている

### Requirement: FR-002 — 未指定時の既定ロケール
While `locale` is unset in `config.yaml`, the system SHALL apply `ja` as the default locale and emit an informational message indicating that the default was used.

#### Scenario: locale キーが config.yaml に存在しない
- GIVEN `config.yaml` に `locale` キーが存在しない
- WHEN `mspec new sample-feature` を実行する
- THEN 既定ロケール `ja` が適用され、stderr に「default locale 'ja' applied」を含む通知が出力される

### Requirement: FR-003 — 未対応 locale の拒否
If `locale` is set to a locale code that has no matching template and question-bank resources, then `mspec validate` SHALL exit with a non-zero status and report the unsupported locale together with the list of supported locales.

#### Scenario: 未対応の locale が指定される
- GIVEN `config.yaml` の `locale` が `xx` （未対応コード）に設定されている
- WHEN `mspec validate --change <change-dir>` を実行する
- THEN exit code が 0 以外で、出力に `unsupported locale: xx` と `supported: ja, en` の両方が含まれる

### Requirement: FR-004 — 言語追加の拡張ポイント
Where a user provides additional locale resources keyed by ISO 639-1 codes under the standard resource directory, the system SHALL recognize those locales as valid candidates without any source code changes.

#### Scenario: サードパーティが zh ロケールを追加する
- GIVEN ユーザーが `templates/artifacts/*.zh.md` と `templates/questions/*.zh.yaml` を配置している
- WHEN `config.yaml` で `locale: zh` を指定して `mspec new` を実行する
- THEN ソースコード改修なしで `zh` ロケール用テンプレートが解決され、成果物が中国語見出しで生成される

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


