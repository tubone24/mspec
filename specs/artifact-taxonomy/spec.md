<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# artifact-taxonomy Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Declare doc_type in YAML frontmatter of all artifact templates

The system SHALL include a `doc_type:` field in the YAML frontmatter of every artifact template file (e.g. `proposal.md`, `research.md`, `design.md`, `design-rationale.md`, `quickstart.md`, `checklist.md`, `tasks.md`, `glossary.md`, `readme.md`), whose value MUST be one of `Reference`, `Explanation`, `How-to`, `Tutorial`, or `AI-Internal` — the four Diátaxis types extended with a fifth `AI-Internal` type for artifacts whose primary consumer is the AI agent rather than a human reviewer.

#### Scenario: design-rationale.md template contains doc_type frontmatter
- GIVEN mspec の artifact テンプレートディレクトリに `design-rationale.md` テンプレートが存在する
- WHEN テンプレートの先頭を確認する
- THEN `---` で囲まれた YAML フロントマターが存在し、`doc_type: Explanation` フィールドを含む

#### Scenario: tasks.md template declares AI-Internal
- GIVEN mspec の artifact テンプレートディレクトリに `tasks.md` テンプレートが存在する
- WHEN テンプレートの YAML frontmatter を確認する
- THEN `doc_type: AI-Internal` フィールドが存在する
- AND `doc_type` の値は 5 種（`Reference`, `Explanation`, `How-to`, `Tutorial`, `AI-Internal`）のいずれかである

### Requirement: FR-002 — doc_type value is constrained to the five permitted types

The system MUST treat exactly the set defined by FR-001 — `Reference`, `Explanation`, `How-to`, `Tutorial`, and `AI-Internal` — as valid values for the `doc_type:` field in any mspec artifact; no custom or compound type (e.g. `Mixed`, `Tutorial-Reference`, `Reference+AI`) SHALL be used.

> 注: 本 Requirement のタイトル文字列は歴史的に「four Diátaxis types」と命名されているが、本 change による改訂後の許容値は `AI-Internal` を含む 5 種である。タイトル改名は後続の change で RENAMED として扱う。

#### Scenario: Valid doc_type values are the five types defined in FR-001
- GIVEN mspec プロジェクトのいずれかの成果物を作成する条件
- WHEN 成果物の YAML フロントマターを読む
- THEN `doc_type` の値は `Reference`, `Explanation`, `How-to`, `Tutorial`, `AI-Internal` のいずれかである
- AND それ以外の値（例: `Mixed`, `Tutorial-Reference`）は一切使用されない

#### Scenario: Invalid doc_type values are rejected by validate
- GIVEN テンプレートまたは change 内成果物の YAML frontmatter に `doc_type: Mixed` が設定されている
- WHEN `mspec validate` を実行する
- THEN validate は doc_type 値の不正をエラーとして報告する
- AND 終了コード非ゼロで終了する

### Requirement: FR-003 — glossary.md is a mandatory artifact in every change directory

The system SHALL produce a `glossary.md` file as part of every change directory created by `mspec new`, acting as the single source of truth for terms used across all other artifacts in that change; other artifact templates SHOULD reference `glossary.md` for term definitions rather than redefining them inline.

#### Scenario: glossary.md is present in a newly created change directory
- GIVEN ユーザーが `mspec new` を実行して新しいチェンジディレクトリを作成する
- WHEN チェンジディレクトリの内容を確認する
- THEN `glossary.md` が存在し、最低でも `## Terms` セクションを含む構造を持つ
- AND `glossary.md` の YAML フロントマターに `doc_type: Reference` が記載されている

#### Scenario: research.md refers to glossary.md for term definitions
- GIVEN チェンジディレクトリに `research.md` と `glossary.md` が存在する
- WHEN `research.md` のテンプレートを確認する
- THEN 用語の参照先として `glossary.md` へのリンクまたは言及がテンプレートに含まれる

### Requirement: FR-004 — `tasks.md` テンプレートの doc_type は `AI-Internal` である

`tasks.md` がテンプレートとして提供される場合、このシステムは SHALL その YAML frontmatter で `doc_type: AI-Internal` を宣言する。`tasks.md` の粒度は AI による機械的消費を前提としており、人間読者が直接通読するのに適さないため、Reference / Explanation / How-to / Tutorial のいずれにも当てはまらない。

#### Scenario: tasks.md template は AI-Internal として分類される
- GIVEN mspec の artifact テンプレートディレクトリに `tasks.md` テンプレートが存在する
- WHEN テンプレートの YAML frontmatter を確認する
- THEN `doc_type: AI-Internal` が宣言されている
- AND `doc_type` の値はそれ以外（Reference, Explanation, How-to, Tutorial）でない

### Requirement: FR-005 — `readme.md` テンプレートの doc_type は `Tutorial` で、末尾に「まとめ」セクションの雛型を含む

`mspec new <feature>` で change ディレクトリを生成するとき、このシステムは SHALL `readme.md` テンプレートの YAML frontmatter に `doc_type: Tutorial` を宣言し、テンプレート末尾に `## Summary (Lessons / Next Steps)` という空のセクション雛型を含めなければならない。初期状態ではプレースホルダコメント（例: `<!-- archive ステップで AI が生成 -->`）で埋め、archive ステップでの追記対象として明示する。

#### Scenario: 新規 change の readme は Tutorial 型で雛型まとめセクションを持つ
- GIVEN ユーザーが `mspec new <feature>` を実行する
- WHEN 生成された `changes/<id>/readme.md` を確認する
- THEN YAML frontmatter に `doc_type: Tutorial` が宣言されている
- AND ファイル末尾に `## Summary (Lessons / Next Steps)` セクションが存在する
- AND 初期状態では `<!-- archive ステップで AI が生成 -->` のコメントのみを含む

### Requirement: FR-006 — `design.md` (Reference) と `design-rationale.md` (Explanation) の両方をテンプレートとして提供する

このシステムは SHALL artifact テンプレートディレクトリに `design.md` テンプレート（`doc_type: Reference`）と `design-rationale.md` テンプレート（`doc_type: Explanation`）の両方を保持し、`design` ステップで両ファイルが change ディレクトリにコピー生成される構成としなければならない。`design.md` は構造・データモデル・契約を、`design-rationale.md` は採用理由・代替案・トレードオフを担い、相互参照は手書きを許容する（自動相互リンク生成は Non-Goal）。

#### Scenario: design ステップ完了時に 2 ファイルが揃う
- GIVEN ユーザーが `/mspec:continue` で design ステップを実行する条件が整っている
- WHEN design ステップが完了する
- THEN `changes/<id>/design.md` と `changes/<id>/design-rationale.md` の両方が存在する
- AND `design.md` の YAML frontmatter は `doc_type: Reference` を宣言する
- AND `design-rationale.md` の YAML frontmatter は `doc_type: Explanation` を宣言する


