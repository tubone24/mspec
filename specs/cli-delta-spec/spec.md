<!-- mspec: gaps in FR numbering are intentional. -->

# cli-delta-spec Specification

## Purpose

`mspec delta init` capability は、進行中のチェンジに対する Delta Spec の雛形を、対象 capability の既存 Source-of-Truth spec を参照しながら決定論的に生成する責務を負う。既存 capability の場合は最大 FR-ID + 1 から、新規 capability の場合は FR-001 から自動採番された Requirement 枠と、ADDED / MODIFIED / REMOVED / RENAMED の 4 セクション構造を備えた `changes/<change-dir>/specs/<capability>/spec.md` を生成し、LLM スキルは採番済みの雛形にタイトルと振る舞いを埋めるだけで Delta Spec を完成できる状態を提供する。

## Requirements

### Requirement: FR-001 — Auto-number next FR-ID from existing capability spec

The system MUST scan the existing `specs/<capability>/spec.md` for every `### Requirement: FR-NNN` header, extract the numeric portion of each `FR-NNN`, and seed the generated Delta Spec template starting at the maximum observed value plus one when `mspec delta init --capability <name>` is invoked for an existing capability.

#### Scenario: Continue numbering from the highest existing FR-ID
- GIVEN `specs/theme-engine/spec.md` が `FR-001` から `FR-004` までの Requirement を含んでいる
- WHEN ユーザーが `mspec delta init --capability theme-engine --change 2026-05-14-093015-apply-css` を実行する
- THEN `changes/2026-05-14-093015-apply-css/specs/theme-engine/spec.md` の ADDED セクション内に `### Requirement: FR-005 — <Short Title placeholder>` のヘッダを持つ雛形が生成される
- AND コマンドは終了コード 0 で完了する

#### Scenario: Numbering ignores gaps in existing FR-IDs
- GIVEN `specs/theme-engine/spec.md` が `FR-001`, `FR-002`, `FR-005` の Requirement を含む (FR-003/FR-004 は欠番)
- WHEN ユーザーが `mspec delta init --capability theme-engine --change 2026-05-14-093015-apply-css` を実行する
- THEN 生成された雛形の最初の ADDED Requirement ヘッダは `### Requirement: FR-006 — <Short Title placeholder>` である

### Requirement: FR-002 — Treat missing capability spec as a new capability and seed from FR-001

The system MUST, when `specs/<capability>/spec.md` does not exist, classify the target as a NEW capability, generate the Delta Spec template starting at `FR-001`, and additionally create an empty `specs/<capability>/spec.md` with `## Purpose` and `## Requirements` sections so that the future `mspec archive` merge has a valid target.

#### Scenario: Bootstrap Delta Spec and Source-of-Truth for new capability
- GIVEN プロジェクトに `specs/search/spec.md` が存在しない
- WHEN ユーザーが `mspec delta init --capability search --change 2026-05-14-093015-add-search` を実行する
- THEN `changes/2026-05-14-093015-add-search/specs/search/spec.md` の ADDED セクションに `### Requirement: FR-001 — <Short Title placeholder>` の雛形が生成される
- AND `specs/search/spec.md` が `## Purpose` と `## Requirements` の節を含む空の Source-of-Truth として新規作成される

### Requirement: FR-003 — Emit classification note in CLI output

The system MUST emit a log line indicating whether the target capability was treated as EXISTING or NEW so that misclassification (e.g. a typo in `--capability`) is visible to the user.

#### Scenario: New capability classification is logged
- GIVEN `specs/serch/spec.md` (typo) が存在せず、ユーザーは誤って `--capability serch` を指定している
- WHEN ユーザーが `mspec delta init --capability serch --change 2026-05-14-093015-add-search` を実行する
- THEN 標準出力に `note: treating as NEW capability` を含むメッセージが表示される
- AND ユーザーは誤分類に気付いて中断できる

#### Scenario: Existing capability classification is logged
- GIVEN `specs/theme-engine/spec.md` に既存 Requirement が含まれている
- WHEN ユーザーが `mspec delta init --capability theme-engine --change 2026-05-14-093015-apply-css` を実行する
- THEN 標準出力に既存 capability として扱った旨のメッセージが表示される

### Requirement: FR-004 — Emit Delta Spec template with ADDED / MODIFIED / REMOVED / RENAMED sections

The system MUST write the Delta Spec template containing the four section headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, and `## RENAMED Requirements`, in that order, so that the parser used by `mspec archive` can locate each diff section regardless of which sections the LLM actually fills in.

#### Scenario: All four delta sections are emitted
- GIVEN いずれかの capability について `mspec delta init` を実行する条件が整っている
- WHEN ユーザーが `mspec delta init --capability theme-engine --change 2026-05-14-093015-apply-css` を実行する
- THEN 生成された `changes/2026-05-14-093015-apply-css/specs/theme-engine/spec.md` には `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, `## RENAMED Requirements` の 4 つの H2 見出しが順に含まれる

### Requirement: FR-005 — Use H3 for Requirement headers in the template

The system MUST emit each Requirement header in the generated Delta Spec template as a level-3 Markdown heading following the exact pattern `### Requirement: FR-NNN — <Short Title>`, where `FR-NNN` is zero-padded to three digits and the em dash `—` separates the ID from the title placeholder.

#### Scenario: Requirement header uses H3 with FR-NNN form
- GIVEN ADDED Requirement の雛形を含む Delta Spec が生成される条件
- WHEN ユーザーが `mspec delta init --capability theme-engine --change 2026-05-14-093015-apply-css` を実行する
- THEN 生成ファイルの ADDED セクションには `### Requirement: FR-005 — <Short Title>` の形式の H3 見出しが含まれる
- AND 同見出しは `##` でも `####` でもなく、H3 (`###`) として記述される

### Requirement: FR-006 — Use H4 for Scenario headers in the template

The system MUST emit every Scenario heading in the generated Delta Spec template as a level-4 Markdown heading using the exact prefix `#### Scenario:`, because `mspec validate` rejects Scenarios that are not at H4.

#### Scenario: Scenario header uses H4
- GIVEN ADDED Requirement の雛形が 1 つ生成される条件
- WHEN ユーザーが `mspec delta init --capability theme-engine --change 2026-05-14-093015-apply-css` を実行する
- THEN 生成ファイル内の各 Requirement 配下に `#### Scenario: <Scenario Name>` の H4 見出しが少なくとも 1 つ含まれる
- AND いかなる Scenario 見出しも H3 (`###`) としては記述されない

### Requirement: FR-007 — Emit BDD body with RFC 2119 keyword stub

The system MUST include, for each ADDED Requirement template, a body sentence using an RFC 2119 keyword (`MUST` / `SHALL` / `SHOULD` / `MAY`) and a Scenario body composed of `GIVEN` / `WHEN` / `THEN` bullet lines so that the LLM only has to substitute placeholders, not invent the structure.

#### Scenario: Template body includes RFC 2119 keyword and GIVEN/WHEN/THEN
- GIVEN ADDED Requirement の雛形が生成される条件
- WHEN ユーザーが `mspec delta init --capability theme-engine --change 2026-05-14-093015-apply-css` を実行する
- THEN 雛形の Requirement 本文には `MUST` / `SHALL` / `SHOULD` / `MAY` のいずれかのキーワードが含まれる
- AND Scenario 本文は `- GIVEN ...`, `- WHEN ...`, `- THEN ...` の 3 行を含むブロックである

### Requirement: FR-008 — Fail when duplicate FR-IDs would be produced within a capability

The system MUST treat any FR-ID collision within the same capability as a hard error, refusing to generate a Delta Spec whose numbering would duplicate an FR-ID already present in `specs/<capability>/spec.md` or already appearing in another Delta Spec under any in-progress change for the same capability.

#### Scenario: Existing FR-ID collision is rejected
- GIVEN `specs/theme-engine/spec.md` に既に `FR-005` が存在し、進行中の別チェンジが `FR-005` を ADDED として宣言した Delta Spec を持っている
- WHEN ユーザーが新しいチェンジで `mspec delta init --capability theme-engine` を実行し、ツールが `FR-005` を採番しようとする
- THEN コマンドは非ゼロの終了コードで中断する
- AND エラーメッセージは衝突した FR-ID と既存の出所 (本 spec または他チェンジの Delta Spec) を明示する

### Requirement: FR-009 — Place generated Delta Spec under the change directory

The system MUST write the generated Delta Spec template to `changes/<change-dir>/specs/<capability>/spec.md`, creating intermediate directories as needed, where `<change-dir>` is the change directory passed via `--change <name>` (or inferred from the current active change when omitted).

#### Scenario: Delta Spec is written under the change directory
- GIVEN `changes/2026-05-14-093015-apply-css/` が `mspec new` で作成済み
- AND `changes/2026-05-14-093015-apply-css/specs/theme-engine/` ディレクトリは存在しない
- WHEN ユーザーが `mspec delta init --capability theme-engine --change 2026-05-14-093015-apply-css` を実行する
- THEN `changes/2026-05-14-093015-apply-css/specs/theme-engine/spec.md` が新規作成される
- AND 必要な中間ディレクトリ (`specs/theme-engine/`) もあわせて作成される

### Requirement: FR-010 — Honour `enforce_fr_ids: true` by validating sequence and uniqueness

The system MUST, when the active `workflow.yaml` declares `enforce_fr_ids: true` for the delta step, ensure that `mspec validate` rejects a Delta Spec whose FR-IDs are not strictly sequential continuation of the Source-of-Truth (gaps caused by REMOVED requirements are allowed, but duplicates and out-of-order ADDED IDs are not) and whose FR-IDs collide with any FR-ID in the same capability.

#### Scenario: Out-of-order ADDED FR-ID fails validation
- GIVEN `specs/theme-engine/spec.md` の最大 FR-ID は `FR-004` である
- AND 進行中の Delta Spec の ADDED セクションが `FR-007` を宣言している (連番違反)
- AND `workflow.yaml` の delta ステップは `enforce_fr_ids: true` を指定している
- WHEN ユーザーが `mspec validate --change 2026-05-14-093015-apply-css` を実行する
- THEN コマンドは非ゼロの終了コードで終了する
- AND エラーメッセージは ADDED の期待 FR-ID が `FR-005` であることを示す

#### Scenario: Duplicate FR-ID within the Delta Spec fails validation
- GIVEN 進行中の Delta Spec の ADDED セクションが `FR-005` を 2 回宣言している
- AND `workflow.yaml` の delta ステップは `enforce_fr_ids: true` を指定している
- WHEN ユーザーが `mspec validate --change 2026-05-14-093015-apply-css` を実行する
- THEN コマンドは非ゼロの終了コードで終了する
- AND エラーメッセージは重複した FR-ID `FR-005` を明示する

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

