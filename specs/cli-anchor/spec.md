<!-- mspec: gaps in FR numbering are intentional. -->

# cli-anchor Specification

## Purpose

The `mspec anchor` capability defines the 3-line `@mspec-delta` anchor block format that links implementation and E2E test files back to their Delta Specs, and provides three sub-commands — `mspec anchor check` (integrity verification), `mspec anchor extract` (LLM-ready JSON emission with spec excerpts), and `mspec anchor list` (enumeration with orphan detection) — so that anchors remain a deterministic, machine-checkable bridge between code and specifications both before and after a change is archived.

## Requirements

### Requirement: FR-001 — Three-line `@mspec-delta` anchor block format
The system MUST recognize an anchor only as a strictly 3-line block whose lines, after comment-prefix stripping, match (1) `@mspec-delta <change-dir>/specs/<capability>/spec.md`, (2) `Requirements implemented: <FR-ID>[, <FR-ID>...]`, and (3) `Change: <feature-kebab>`, in that order and on consecutive lines.

#### Scenario: Canonical 3-line block is accepted
- GIVEN a TypeScript source file whose JSDoc block at the top contains three consecutive lines `@mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md`, `Requirements implemented: FR-005, FR-007`, and `Change: apply-css`
- WHEN the user runs `mspec anchor list`
- THEN the system reports exactly one anchor for that file with `change_dir = 2026-05-14-093015-apply-css`, `capability = theme-engine`, `requirements = [FR-005, FR-007]`, and `change = apply-css`

### Requirement: FR-002 — Strict `change_dir` token format
The system MUST require `<change-dir>` in line 1 to match `YYYY-MM-DD-HHMMSS-<feature-kebab>` exactly, where `HHMMSS` is six digits and is mandatory, and MUST reject any anchor whose `<change-dir>` token omits the time component or otherwise violates this shape.

#### Scenario: Anchor without HHMMSS is rejected as malformed
- GIVEN a source file whose 3-line block uses `@mspec-delta 2026-05-14-apply-css/specs/theme-engine/spec.md` (no `HHMMSS`)
- WHEN the user runs `mspec anchor list`
- THEN the system does not count this as a valid anchor and reports the line as a malformed `@mspec-delta` candidate

### Requirement: FR-003 — Comment-prefix stripping across languages
The system MUST strip leading comment markers (`//`, `#`, `*`, leading whitespace, and `/**` / `*/` block delimiters) per line before matching the three anchor lines, so that the same 3-line block is recognized when written as TypeScript/JavaScript JSDoc, Python triple-quoted docstrings, Rust `//` comments, or Go `//` comments.

#### Scenario: TypeScript JSDoc anchor is recognized
- GIVEN a TypeScript file whose first lines are `/**`, ` * @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md`, ` * Requirements implemented: FR-005`, ` * Change: apply-css`, ` */`
- WHEN the user runs `mspec anchor list`
- THEN one valid anchor is reported with `requirements = [FR-005]`

#### Scenario: Python docstring anchor is recognized
- GIVEN a Python module whose first lines are `"""`, `@mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md`, `Requirements implemented: FR-005`, `Change: apply-css`, `"""`
- WHEN the user runs `mspec anchor list`
- THEN one valid anchor is reported

#### Scenario: Rust or Go line-comment anchor is recognized
- GIVEN a Rust or Go file whose first three non-empty lines are `// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md`, `// Requirements implemented: FR-005`, `// Change: apply-css`
- WHEN the user runs `mspec anchor list`
- THEN one valid anchor is reported

### Requirement: FR-004 — Scan only the first 30 lines of each file
The system MUST limit anchor scanning to the first 30 lines of each candidate source or test file and MUST NOT recognize an anchor block that begins on line 31 or later.

#### Scenario: Anchor below line 30 is ignored
- GIVEN a source file where the 3-line `@mspec-delta` block begins on line 35
- WHEN the user runs `mspec anchor list`
- THEN no anchor is reported for that file

### Requirement: FR-005 — Incomplete anchor block is a hard failure
The system MUST treat any case where one or two of the three required lines appear but the full 3-line block is not present on consecutive lines as an incomplete anchor, and `mspec anchor check` MUST exit non-zero reporting the offending file and line.

#### Scenario: Missing `Change:` line fails check
- GIVEN a source file whose top contains `@mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md` and `Requirements implemented: FR-005` but no `Change:` line
- WHEN the user runs `mspec anchor check`
- THEN the command exits non-zero and reports the file and line of the partial anchor as an incomplete anchor

#### Scenario: Non-consecutive lines fail check
- GIVEN a source file where the three required lines exist within the first 30 lines but are separated by an unrelated comment line
- WHEN the user runs `mspec anchor check`
- THEN the command exits non-zero and reports the block as incomplete

### Requirement: FR-006 — `change_dir` existence verification
The `mspec anchor check` command MUST verify that the anchor's `<change-dir>` exists either at `changes/<change-dir>/` or at `changes/archive/<change-dir>/`, and MUST fail when the directory cannot be located in either path.

#### Scenario: Missing change-dir fails check
- GIVEN an anchor referencing `2026-05-14-093015-apply-css`
- AND neither `changes/2026-05-14-093015-apply-css/` nor `changes/archive/2026-05-14-093015-apply-css/` exists
- WHEN the user runs `mspec anchor check`
- THEN the command exits non-zero and reports the missing change directory

### Requirement: FR-007 — Capability Delta Spec existence verification
The `mspec anchor check` command MUST verify that the anchor's `<capability>/spec.md` file (i.e., `specs/<capability>/spec.md` under the resolved change directory) exists, and MUST fail when the Delta Spec file is missing.

#### Scenario: Missing capability Delta Spec fails check
- GIVEN an anchor referencing `specs/theme-engine/spec.md` inside an existing change directory
- AND the file `specs/theme-engine/spec.md` does not exist under that change directory
- WHEN the user runs `mspec anchor check`
- THEN the command exits non-zero and reports the missing Delta Spec path

### Requirement: FR-008 — FR-ID resolution against the Delta Spec
The `mspec anchor check` command MUST verify that every `<FR-ID>` listed in the anchor's second line resolves to a `### Requirement: <FR-ID> — ...` heading inside the resolved Delta Spec, and MUST fail when any one of the listed FR-IDs cannot be found.

#### Scenario: Unknown FR-ID fails check
- GIVEN an anchor with `Requirements implemented: FR-005, FR-099`
- AND the resolved Delta Spec contains `FR-005` but not `FR-099`
- WHEN the user runs `mspec anchor check`
- THEN the command exits non-zero and reports `FR-099` as unresolved against the Delta Spec

### Requirement: FR-009 — `Change:` field equals the change-dir feature suffix
The `mspec anchor check` command MUST verify that the anchor's `Change:` field is exactly equal to the `<feature-kebab>` portion of `<change-dir>` (i.e., the substring after `YYYY-MM-DD-HHMMSS-`), and MUST fail when they disagree.

#### Scenario: Change field mismatch fails check
- GIVEN an anchor with `change-dir = 2026-05-14-093015-apply-css` and `Change: add-search`
- WHEN the user runs `mspec anchor check`
- THEN the command exits non-zero and reports the mismatch between the `Change:` field and the change-dir suffix

### Requirement: FR-010 — Anchors resolve through archive without rewrite
The `mspec anchor check`, `mspec anchor extract`, and `mspec anchor list` commands MUST resolve anchors by searching both `changes/<change-dir>/` and `changes/archive/<change-dir>/`, so that an anchor written before archive continues to resolve unchanged after the change directory has been moved into `changes/archive/`.

#### Scenario: Anchor still resolves after archive
- GIVEN a source file with a valid anchor referencing `2026-05-14-093015-apply-css`
- AND the change directory has been moved from `changes/2026-05-14-093015-apply-css/` to `changes/archive/2026-05-14-093015-apply-css/`
- WHEN the user runs `mspec anchor check`
- THEN the command exits zero and reports the anchor as resolved against the archived path

### Requirement: FR-011 — `is_archived` flag in extract / list output
The `mspec anchor extract` and `mspec anchor list` commands MUST expose, for each anchor, an `is_archived` boolean that is `true` when the resolved change directory was found under `changes/archive/` and `false` when it was found under `changes/`.

#### Scenario: Archived anchor is flagged in extract output
- GIVEN a source file whose anchor resolves to `changes/archive/2026-05-14-093015-apply-css/specs/theme-engine/spec.md`
- WHEN the user runs `mspec anchor extract <change-name> --json`
- THEN the emitted JSON entry for that anchor includes `"is_archived": true` and a `delta_spec_path` rooted under `changes/archive/`

### Requirement: FR-012 — `anchor extract --json` LLM-ready schema with spec excerpts
The `mspec anchor extract <change-name> --json` command MUST emit a JSON array in which each element contains `change_dir`, `capability`, `delta_spec_path`, `requirements` (array of FR-IDs), `change`, `source_file`, `source_line`, `exists`, `is_archived`, and `spec_excerpts` — where `spec_excerpts` is an object keyed by FR-ID whose value is the corresponding `### Requirement:` block (including its `#### Scenario:` subsections) lifted verbatim from the Delta Spec.

#### Scenario: Extract emits spec_excerpts keyed by FR-ID
- GIVEN a source file with an anchor for `FR-005, FR-007` resolving to a Delta Spec that contains both Requirement blocks
- WHEN the user runs `mspec anchor extract <change-name> --json`
- THEN the JSON entry for that anchor includes `"requirements": ["FR-005", "FR-007"]`
- AND `spec_excerpts.FR-005` contains the verbatim `### Requirement: FR-005 — ...` block with all of its `#### Scenario:` subsections
- AND `spec_excerpts.FR-007` contains the verbatim `### Requirement: FR-007 — ...` block

### Requirement: FR-013 — `anchor list` enumerates and `--orphans` filters
The `mspec anchor list` command MUST, with no flags, enumerate every anchor block discovered in the project's source and test files; with `--orphans`, the command MUST emit only those anchors whose `change_dir`, `capability/spec.md`, or any listed `FR-ID` cannot be resolved.

#### Scenario: Default list returns all anchors
- GIVEN the project contains three valid anchors across three files
- WHEN the user runs `mspec anchor list`
- THEN the command exits zero and lists all three anchors

#### Scenario: `--orphans` filters to unresolved anchors only
- GIVEN the project contains two anchors whose targets resolve and one anchor whose `change_dir` no longer exists in either `changes/` or `changes/archive/`
- WHEN the user runs `mspec anchor list --orphans`
- THEN the command lists only the third anchor and omits the two resolved ones

### Requirement: FR-014 — Multiple anchor blocks per file
The system MUST allow a single source or test file to contain more than one 3-line `@mspec-delta` anchor block (e.g., to declare implementation of Requirements from multiple Delta Specs), and `mspec anchor list` / `mspec anchor extract` MUST emit one JSON entry per block found within the first 30 lines.

#### Scenario: Two anchor blocks in one file produce two entries
- GIVEN a source file whose first 30 lines contain two distinct 3-line `@mspec-delta` blocks referencing different change directories
- WHEN the user runs `mspec anchor extract <change-name> --json`
- THEN the JSON output contains two entries for that file
- AND each entry carries its own `change_dir`, `capability`, `requirements`, and `source_line` corresponding to its block
