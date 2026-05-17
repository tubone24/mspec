<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# artifact-taxonomy Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Declare doc_type in YAML frontmatter of all artifact templates

The system SHALL include a `doc_type:` field in the YAML frontmatter of every artifact template file (e.g. `proposal.md`, `research.md`, `design.md`, `quickstart.md`, `checklist.md`, `tasks.md`, `glossary.md`), whose value MUST be one of `Reference`, `Explanation`, `How-to`, or `Tutorial` as defined by the Diátaxis framework, so that human reviewers can immediately identify the purpose of each artifact.

#### Scenario: proposal.md template contains doc_type frontmatter
- GIVEN mspec の artifact テンプレートディレクトリに `proposal.md` テンプレートが存在する
- WHEN テンプレートの先頭を確認する
- THEN `---` で囲まれた YAML フロントマターが存在し、`doc_type: Explanation` フィールドを含む
- AND `doc_type` の値は `Reference`, `Explanation`, `How-to`, `Tutorial` のいずれかである

#### Scenario: research.md template is classified as Reference
- GIVEN mspec の artifact テンプレートに `research.md` テンプレートが存在する
- WHEN フロントマターを確認する
- THEN `doc_type: Reference` フィールドが存在する

### Requirement: FR-002 — doc_type value is constrained to the four Diátaxis types

The system MUST treat only `Reference`, `Explanation`, `How-to`, and `Tutorial` as valid values for the `doc_type:` field in any mspec artifact; no custom or compound type (e.g. `AI-Internal`, `Mixed`) SHALL be used.

#### Scenario: Valid doc_type values are exactly the four Diátaxis types
- GIVEN mspec プロジェクトのいずれかの成果物を作成する条件
- WHEN 成果物の YAML フロントマターを読む
- THEN `doc_type` の値は `Reference`, `Explanation`, `How-to`, `Tutorial` のいずれかである
- AND それ以外の値（例: `AI-Internal`, `Mixed`）は一切使用されない

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

