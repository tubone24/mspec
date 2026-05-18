# Delta Spec: artifact-templates-i18n

## ADDED Requirements

### Requirement: FR-005 — 全成果物テンプレートの ja/en バリアント完備
このシステムは SHALL `readme`・`glossary`・`proposal`・`research`・`design`・`architecture-overview`・`quickstart`・`checklist`・`tasks` の各成果物テンプレートに対して `.ja.md` および `.en.md` バリアントを提供し、`locale: ja` または `locale: en` 設定時に "missing template" フォールバック警告が発生しないことを保証する。

#### Scenario: locale=ja で mspec new を実行しても警告が出ない
- GIVEN `config.yaml` に `locale: ja` が設定されており、全成果物の `.ja.md` テンプレートが存在する
- WHEN `mspec new <feature>` を実行する
- THEN stderr に "missing template" を含む行が一切出力されない

#### Scenario: locale=en でも警告が出ない
- GIVEN `config.yaml` に `locale: en` が設定されており、全成果物の `.en.md` テンプレートが存在する
- WHEN `mspec new <feature>` を実行する
- THEN stderr に "missing template" を含む行が一切出力されない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
