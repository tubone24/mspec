<!-- mspec: gaps in FR numbering are intentional. -->

# cli-archive Specification

## Purpose

The `mspec archive <change-name>` command deterministically merges a completed change's Delta Specs into their Source-of-Truth `specs/<capability>/spec.md` files using a parser (no LLM), relocates the change directory from `changes/<name>/` to `changes/archive/<name>/`, and re-validates anchors. It supports dry-run preview, user confirmation, transactional safety (all-or-nothing writes), and preserves `FR-NNN` identifiers as immutable across archives so that code anchors continue to resolve permanently.

## Requirements

### Requirement: FR-001 — Section-keyed deterministic merge
The system MUST partition the Delta Spec into `ADDED`, `MODIFIED`, `REMOVED`, and `RENAMED` sections and apply each Requirement block to the target `specs/<capability>/spec.md` using only a parser, without invoking any LLM.

#### Scenario: Mixed sections are applied in a single run
- GIVEN a Delta Spec containing one `ADDED`, one `MODIFIED`, and one `REMOVED` Requirement block for capability `search`
- WHEN the user runs `mspec archive <change-name> -y`
- THEN the system appends the `ADDED` Requirement, replaces the `MODIFIED` Requirement, deletes the `REMOVED` Requirement in `specs/search/spec.md`, and performs all work with the in-process parser

### Requirement: FR-002 — Parser-based, LLM-free execution
The system MUST NOT call any language model during archive merging; all decisions MUST be derived from Markdown structure (Requirement headings, Scenario headings, and section names).

#### Scenario: Archive succeeds with no network or LLM access
- GIVEN a valid Delta Spec for an existing capability
- WHEN the user runs `mspec archive <change-name> -y` in an environment with no LLM credentials configured
- THEN the merge completes successfully and produces the standard report

### Requirement: FR-003 — ADDED conflict detection
The system MUST fail the archive operation when an `ADDED` Requirement block uses a Requirement name that already exists in the target `specs/<capability>/spec.md`.

#### Scenario: Duplicate ADDED Requirement aborts the merge
- GIVEN `specs/search/spec.md` already contains `### Requirement: FR-005 — Empty query handling`
- AND the Delta Spec declares the same Requirement under `## ADDED Requirements`
- WHEN the user runs `mspec archive <change-name> -y`
- THEN the command exits non-zero, reports the duplicate Requirement, and writes no changes

### Requirement: FR-004 — MODIFIED/REMOVED target existence check
The system MUST fail the archive operation when a `MODIFIED` or `REMOVED` Requirement block references a Requirement name that does not exist in the target spec.

#### Scenario: MODIFIED with missing target aborts the merge
- GIVEN `specs/search/spec.md` does not contain `### Requirement: FR-099 — Legacy sort`
- AND the Delta Spec declares this Requirement under `## MODIFIED Requirements`
- WHEN the user runs `mspec archive <change-name> -y`
- THEN the command exits non-zero, reports the missing target, and writes no changes

### Requirement: FR-005 — Transactional all-or-nothing write
The system MUST either apply every Delta change across all affected capabilities and move the change directory, or apply nothing at all; a single error in any capability MUST roll back the entire archive.

#### Scenario: One capability error aborts merges for all capabilities
- GIVEN a Delta Spec touches capabilities `search` and `theme-engine`
- AND `theme-engine` Delta contains a `REMOVED` block targeting a non-existent Requirement
- WHEN the user runs `mspec archive <change-name> -y`
- THEN `specs/search/spec.md` remains unchanged, `specs/theme-engine/spec.md` remains unchanged, and the change directory is NOT moved to `changes/archive/`

### Requirement: FR-006 — Dry-run preview without writes
The system MUST, when invoked with `--dry-run`, produce the same diff/report that a real archive would print, while making no modifications to `specs/`, no directory move, and no `.mspec/cache/` updates.

#### Scenario: Dry-run shows diff but writes nothing
- GIVEN a valid Delta Spec ready to archive
- WHEN the user runs `mspec archive <change-name> --dry-run`
- THEN the command prints the merge report (added/modified/removed lines)
- AND `specs/<capability>/spec.md` is byte-identical to its pre-run state
- AND `changes/<change-name>/` is still in place (not moved to `changes/archive/`)

### Requirement: FR-007 — Interactive confirmation by default
The system MUST require explicit user confirmation before writing when `-y` is not supplied, and MUST proceed without prompting when `-y` is supplied.

#### Scenario: Missing -y triggers confirmation prompt
- GIVEN a valid Delta Spec ready to archive
- WHEN the user runs `mspec archive <change-name>` without `-y` and answers "no" at the prompt
- THEN no spec files are modified and the change directory is not moved

#### Scenario: -y skips the prompt
- GIVEN a valid Delta Spec ready to archive
- WHEN the user runs `mspec archive <change-name> -y` in a non-interactive shell
- THEN the merge is performed without any prompt

### Requirement: FR-008 — Pre-archive validate gate
The system MUST run `mspec validate` for the change before any merge work and MUST abort if validation fails.

#### Scenario: Validate failure prevents archive
- GIVEN the Delta Spec for the change is structurally invalid (e.g., a `#### Scenario:` is at the wrong heading level)
- WHEN the user runs `mspec archive <change-name> -y`
- THEN the command runs `mspec validate` first, fails it, exits non-zero, and writes nothing

### Requirement: FR-009 — Move change directory to archive
The system MUST relocate `changes/<change-name>/` to `changes/archive/<change-name>/` after a successful merge, preserving the change directory name verbatim (filesystem-level move) so existing anchors continue to resolve.

#### Scenario: Successful archive moves the change directory
- GIVEN a successful merge of all capability Delta Specs
- WHEN the archive step proceeds past the write phase
- THEN `changes/<change-name>/` no longer exists at the original path
- AND `changes/archive/<change-name>/` exists with the same directory name and contents

### Requirement: FR-010 — Post-archive anchor re-check
The system MUST run `mspec anchor check` after the directory move to confirm that anchors continue to resolve, and MUST surface any anchor failure in its exit status.

#### Scenario: Anchors are re-verified after move
- GIVEN code files contain `@mspec-delta <change-name>/specs/<capability>/spec.md` anchors
- WHEN `mspec archive <change-name> -y` completes the directory move
- THEN `mspec anchor check` is invoked automatically against `changes/archive/<change-name>/`
- AND the anchors resolve because the change-dir name is preserved

### Requirement: FR-011 — FR-NNN immutability and gap tolerance
The system MUST preserve every `FR-NNN` identifier exactly as written in the Delta Spec when merging into the target spec, MUST leave `REMOVED` identifiers as gaps (no renumbering), and MUST tolerate non-contiguous `FR-NNN` sequences in the resulting `specs/<capability>/spec.md`.

#### Scenario: REMOVED FR is left as a gap, ADDED FR keeps its number
- GIVEN `specs/search/spec.md` contains `FR-001`, `FR-002`, `FR-003`
- AND the Delta Spec REMOVES `FR-002` and ADDS `FR-004`
- WHEN the user runs `mspec archive <change-name> -y`
- THEN the resulting `specs/search/spec.md` contains `FR-001`, `FR-003`, `FR-004`
- AND no Requirement is renumbered
- AND validation accepts the spec despite the missing `FR-002`

### Requirement: FR-012 — New capability bootstrap on archive
The system MUST, when the Delta Spec targets a capability whose `specs/<capability>/spec.md` does not yet exist, create the Source-of-Truth file (with the standard `<!-- mspec: gaps in FR numbering are intentional. -->` header and `Purpose` / `Requirements` sections) and apply all `ADDED` Requirements into it as part of the same transactional archive.

#### Scenario: First-time archive creates the SoT spec file
- GIVEN no file exists at `specs/theme-engine/spec.md`
- AND the Delta Spec declares Requirements only under `## ADDED Requirements`
- WHEN the user runs `mspec archive <change-name> -y`
- THEN `specs/theme-engine/spec.md` is created with the standard header and the ADDED Requirements
- AND the change directory is moved to `changes/archive/<change-name>/`

### Requirement: FR-013 — archive 成功後に決定論的なマージサマリを出力する
システムは `mspec archive` が成功した後、影響を受けた capability ごとに「追加 / 変更 / 削除 / リネーム」された Requirement 件数を 1 行でまとめたサマリ報告を出力 MUST。これによりオペレータがマージ結果を Source-of-Truth スペック本体を覗かずに監査できる。

#### Scenario: サマリ行に capability ごとの件数が並ぶ
- GIVEN Delta Spec が capability `cli-anchor` に対し Requirement 2 件を追加・1 件を変更し、capability `cli-archive` に対し Requirement 1 件を追加する change ディレクトリが存在する
- WHEN ユーザーが `mspec archive <change-name> -y` を実行する
- THEN コマンドは同一報告内に `cli-anchor: +2 ~1 -0 ⇄0` と `cli-archive: +1 ~0 -0 ⇄0` の両方を含むサマリを表示する

#### Scenario: 再実行でサマリがバイト一致する
- GIVEN archive 前の状態スナップショットに対し、同一の archive 操作を再実行する
- WHEN ユーザーが (実行間にワーキングツリーをリセットして) `mspec archive <change-name> -y` を 2 回実行する
- THEN 2 回の実行は同一のサマリ出力をバイト一致で出力する

### Requirement: FR-014 — `--dry-run` ではサマリを抑制する
システムは `--dry-run` 実行時にはマージサマリ行を出力せず、その代わりにプランニング出力であることを明示するプレビューヘッダで置き換える MUST。これによりオペレータが dry-run 結果を完了済み archive と見間違わない。

#### Scenario: dry-run 出力はラベル付きで成功サマリを持たない
- GIVEN archive 可能な状態の change ディレクトリ
- WHEN ユーザーが `mspec archive <change-name> --dry-run` を実行する
- THEN 出力は `dry-run` を含むプレビューヘッダで始まり、FR-013 で規定されたマージサマリ行を含まない

