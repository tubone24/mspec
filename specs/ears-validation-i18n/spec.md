<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# ears-validation-i18n Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — EARS キーワードの英語保持
EARS keywords (`SHALL`, `MUST`, `SHOULD`, `MAY`, `WHEN`, `WHILE`, `IF`, `WHERE`, `THEN`, `GIVEN`) SHALL remain in English regardless of the active locale.

#### Scenario: ja ロケールでも EARS キーワードは英語のまま生成される
- GIVEN active locale が `ja`、`templates/artifacts/delta-spec.ja.md` が用意されている
- WHEN `mspec delta init --capability sample` を実行する
- THEN 生成された spec.md に `SHALL`, `WHEN`, `GIVEN`, `THEN` 等の英語キーワードが含まれ、それらの日本語訳語（例: `しなければならない`）はテンプレ由来としては出現しない

### Requirement: FR-002 — 日本語本文の許容
While the active locale is non-English, `mspec validate` SHALL accept Requirement bodies and Scenario bullet contents written in the active locale as long as EARS keywords appear in English at the documented positions.

#### Scenario: 日本語本文の Requirement が validate を通過する
- GIVEN spec.md に `### Requirement: FR-001 — 言語設定の読込` と本文 `The system SHALL config.yaml の locale を読み込む。` を含み、Scenario 内 GIVEN/WHEN/THEN 行も日本語本文である
- WHEN `mspec validate --change <change-dir>` を実行する
- THEN exit code が 0 で、当該 Requirement に対するエラーが出力されない

### Requirement: FR-003 — 既存英語 spec の後方互換
The system SHALL accept fully English Requirement and Scenario contents regardless of the active locale, preserving validation compatibility with previously authored specs.

#### Scenario: ja ロケール下で既存の英語 spec を検証する
- GIVEN active locale が `ja` で、本文が全て英語の既存 `specs/<capability>/spec.md` が存在する
- WHEN `mspec validate --change <change-dir>` を実行する
- THEN 当該 spec はそのまま validate を通過し、ロケール不一致を理由としたエラーは出ない

### Requirement: FR-004 — Scenario H4 アンカーの言語非依存性
The system MUST recognize `#### Scenario:` as the Scenario anchor heading regardless of the active locale, ensuring the H4 syntax remains stable across languages.

#### Scenario: ja ロケールでも Scenario アンカーは英語識別子
- GIVEN ja テンプレートから生成された spec.md 内に `#### Scenario: <日本語シナリオ名>` と書かれている
- WHEN `mspec validate` がアンカー検出を実行する
- THEN `Scenario` 識別子が H4 として認識され、ネストされた GIVEN/WHEN/THEN 行が当該 Requirement に紐付く

