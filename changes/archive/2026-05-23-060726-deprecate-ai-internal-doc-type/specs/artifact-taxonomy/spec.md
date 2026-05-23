# Delta Spec: artifact-taxonomy

## ADDED Requirements

### Requirement: FR-007 — `tasks.md` テンプレートの doc_type は `Reference` である

`tasks.md` がテンプレートとして提供される場合、このシステムは SHALL その YAML frontmatter で `doc_type: Reference` を宣言する。`tasks.md` は番号付きタスクリストとアンカーブロックを提供する参照用成果物であり、Diátaxis フレームワークの `Reference` 象限に分類される。

#### Scenario: tasks.md テンプレートは Reference として分類される
- GIVEN mspec の artifact テンプレートディレクトリに `tasks.md` テンプレートが存在する
- WHEN テンプレートの YAML frontmatter を確認する
- THEN `doc_type: Reference` が宣言されている
- AND `doc_type` の値は `AI-Internal` ではない

## MODIFIED Requirements

### Requirement: FR-001 — Declare doc_type in YAML frontmatter of all artifact templates

The system SHALL include a `doc_type:` field in the YAML frontmatter of every artifact template file (e.g. `proposal.md`, `research.md`, `design.md`, `design-rationale.md`, `quickstart.md`, `checklist.md`, `tasks.md`, `glossary.md`, `readme.md`), whose value MUST be one of `Reference`, `Explanation`, `How-to`, or `Tutorial` — the four Diátaxis types. The previously permitted fifth type `AI-Internal` is abolished and MUST NOT be used in any artifact.

#### Scenario: design-rationale.md template contains doc_type frontmatter
- GIVEN mspec の artifact テンプレートディレクトリに `design-rationale.md` テンプレートが存在する
- WHEN テンプレートの先頭を確認する
- THEN `---` で囲まれた YAML フロントマターが存在し、`doc_type: Explanation` フィールドを含む

#### Scenario: tasks.md template declares Reference not AI-Internal
- GIVEN mspec の artifact テンプレートディレクトリに `tasks.md` テンプレートが存在する
- WHEN テンプレートの YAML frontmatter を確認する
- THEN `doc_type: Reference` フィールドが存在する
- AND `doc_type` の値は 4 種（`Reference`, `Explanation`, `How-to`, `Tutorial`）のいずれかである
- AND `AI-Internal` は使用されていない

### Requirement: FR-002 — doc_type value is constrained to the four permitted Diátaxis types

The system MUST treat exactly the four Diátaxis types — `Reference`, `Explanation`, `How-to`, and `Tutorial` — as valid values for the `doc_type:` field in any mspec artifact; no custom or compound type (e.g. `Mixed`, `Tutorial-Reference`, `Reference+AI`, `AI-Internal`) SHALL be used.

#### Scenario: Valid doc_type values are the four Diátaxis types
- GIVEN mspec プロジェクトのいずれかの成果物を作成する条件
- WHEN 成果物の YAML フロントマターを読む
- THEN `doc_type` の値は `Reference`, `Explanation`, `How-to`, `Tutorial` のいずれかである
- AND それ以外の値（例: `Mixed`, `Tutorial-Reference`, `AI-Internal`）は一切使用されない

#### Scenario: AI-Internal doc_type is rejected by validate
- GIVEN テンプレートまたは change 内成果物の YAML frontmatter に `doc_type: AI-Internal` が設定されている
- WHEN `mspec validate` を実行する
- THEN validate は doc_type 値の不正をエラーとして報告する
- AND 終了コード非ゼロで終了する

## REMOVED Requirements

### Requirement: FR-004 — `tasks.md` テンプレートの doc_type は `AI-Internal` である

`AI-Internal` doc_type 廃止に伴い削除。代替は FR-007 を参照。

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
