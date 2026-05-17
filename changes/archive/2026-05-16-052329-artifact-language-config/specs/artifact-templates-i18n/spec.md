# Delta Spec: artifact-templates-i18n

## ADDED Requirements

### Requirement: FR-001 — ロケール別テンプレート解決
When generating any artifact for a change directory, the system SHALL resolve template content matching the active locale before writing the file.

#### Scenario: active locale が ja でテンプレートを取得する
- GIVEN active locale が `ja`、対象テンプレートが `proposal`
- WHEN `mspec new` から内部のテンプレートリゾルバが呼び出される
- THEN `templates/artifacts/proposal.ja.md` （または相当する ja 用リソース）が選択される

### Requirement: FR-002 — 翻訳欠落時のフォールバック
If a localized template for the active locale is missing for a given artifact, then the system SHALL fall back to the `en` template and emit a warning identifying the missing locale and artifact name.

#### Scenario: ja テンプレートが欠落している
- GIVEN active locale が `ja`、対象テンプレートの ja リソースが存在しない
- WHEN テンプレートリゾルバが解決を試みる
- THEN `en` テンプレートが採用され、stderr に `missing template: <artifact> for locale 'ja', falling back to 'en'` を含む警告が出力される

### Requirement: FR-003 — 全成果物への一貫適用
The system SHALL apply the active locale uniformly to section headings and placeholders across every artifact template, including `readme`, `proposal`, `delta-spec`, `research`, `design`, `architecture-overview`, `quickstart`, `checklist`, `tasks`, and `glossary`.

#### Scenario: 全テンプレートが日本語化されている
- GIVEN active locale が `ja` で全ステップ用 ja テンプレートが用意されている
- WHEN proposal → delta → research → design → quickstart → checklist → tasks の各ステップを順に実行する
- THEN 生成された各成果物のセクション見出しとプレースホルダが全て日本語であり、テンプレ由来の英語見出しが grep でゼロ件である

### Requirement: FR-004 — フロントマターの保護
The system MUST preserve YAML frontmatter structural keys (e.g., `doc_type`) verbatim across all locales, translating only human-readable values when applicable.

#### Scenario: doc_type フロントマターは翻訳対象外
- GIVEN ja テンプレートと en テンプレートの両方が同じ artifact 用に存在する
- WHEN それぞれを読み込んで frontmatter を比較する
- THEN `doc_type` 等の構造的キー名は両ロケールで一致しており、値も同一の英字識別子のままである

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
