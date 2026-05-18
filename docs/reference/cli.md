---
doc_type: Reference
---

# CLI Reference

All commands are emitted by `packages/cli/src/index.ts` (commander). Run `mspec --help` for the live list; this page is the canonical reference.

## Global

| Flag | Description |
|---|---|
| `--version` | Print package version (currently `0.1.0-alpha.1`). |
| `--help` | Standard commander help. |

## Project bootstrap

### `mspec init`
Initialize mspec in the current project.

| Flag | Default | Description |
|---|---|---|
| `--tools <tool>` | `claude` | Integration tool. Only `claude` is supported in v0.1. |
| `--no-subagents` | false | Skip placing `.claude/agents/`. |
| `--force` | false | Overwrite existing files. |

Writes `.mspec/`, `memory/constitution.md`, `.claude/{commands,skills,agents}/`, and appends `.mspec/cache/` to `.gitignore`. When run from inside the mspec source repo it also builds and `npm link`s the CLI.

### `mspec new <feature-kebab>`
Create a new change directory.

| Flag | Description |
|---|---|
| `--request <text>` | One-line user request seeded into `readme.md`. |

`<feature-kebab>` must match `/^[a-z][a-z0-9-]*$/`.

## Status & control

### `mspec status`
Show artifact status for a change.

| Flag | Description |
|---|---|
| `--change <name>` | Target change directory. Auto-detected if omitted and exactly one change is active. |
| `--json` | Machine-readable output. |

Returns status per step: `done`, `ready`, `blocked`, `skipped`, `invalid`.

### `mspec continue`
Return the next-step prompt for the LLM.

| Flag | Description |
|---|---|
| `--change <name>` | Target change. |
| `--json` | JSON output for tooling. |

### `mspec skip <step-id>`
Mark a step as skipped (requires `skippable: true` in `workflow.yaml`).

| Flag | Description |
|---|---|
| `--change <name>` | Target change. |
| `--reason <text>` | **Required.** Min 10 chars. |

### `mspec done <step-id>`
Mark a `produces`-less step as done (e.g. `self-review`, `implement`).

## Validation

### `mspec validate`
Validate Markdown structure, anchors, Scenario blocks, and Constitution Check tables.

| Flag | Description |
|---|---|
| `--all` | Validate every change and every spec. |
| `--change <name>` | Target one change. |
| `--strict` | Require constitution checks where applicable. |

## Anchors

### `mspec anchor check`
Verify every `@mspec-delta` anchor in the repo points to an existing Delta Spec FR-ID.

### `mspec anchor extract <change-name>`
Emit an LLM-ready bundle of every code anchor + its referenced Delta Spec. `--json` for tooling.

### `mspec anchor list`
List every anchor. `--orphans` filters to anchors whose change directory no longer exists.

## Delta specs

### `mspec delta init`
Create a Delta Spec skeleton with auto-numbered `FR-NNN` (continues from the highest existing FR-ID in the capability).

| Flag | Description |
|---|---|
| `--capability <name>` | Existing or new capability folder under `specs/`. |
| `--change <name>` | Target change. |

## TDD evidence

### `mspec test expect-red <task-id>`
Run the configured test command, expect non-zero exit, record evidence in `.mspec/cache/red-evidence/`.

### `mspec test expect-green <task-id>`
Run the configured test command, expect zero exit, record evidence in `.mspec/cache/green-evidence/`.

> **Note**: subcommand form (`test expect-red`), *not* `test --expect-red`. The configured command lives at `.mspec/config.yaml: test.command`.

## Archive

### `mspec archive <change-name>`
Deterministically merge the Delta Spec into `specs/<capability>/spec.md` and move the change to `changes/archive/`.

| Flag | Description |
|---|---|
| `-y, --yes` | Skip the interactive confirmation. |
| `--dry-run` | Show the merge diff without applying. |

The merge respects ADDED / MODIFIED / REMOVED / RENAMED Requirements per the OpenSpec convention.

## Constitution

### `mspec constitution init`
Write `memory/constitution.md` from template.

### `mspec constitution show`
Print the current constitution.

## Schema

### `mspec schema show`
Display `.mspec/workflow.yaml`.

### `mspec schema validate`
Validate `.mspec/workflow.yaml` against the meta-schema.

## SoT spec utilities

### `mspec spec lint [glob]`
Detect implementation-detail leakage (shell commands, library names, code verbs) in SoT specs. Default glob: `specs/*/spec.md`.

| Flag | Description |
|---|---|
| `--json` | JSON output for CI. |
| `--allow <ruleId>` | Disable a specific rule (repeatable). |

### `mspec spec list-capabilities`
List capability names under `specs/` (alphabetical).

### `mspec spec list-requirements [glob]`
List every `### Requirement:` heading grouped by capability.

### `mspec spec grep <fr-id>`
Search a `FR-NNN` block across SoT and Delta specs. `--json` for tooling.

## Questions

### `mspec questions`
List question templates for a phase.

| Flag | Description |
|---|---|
| `--phase <step-id>` | e.g. `proposal`, `design`, `research`, `tasks`. |
| `--json` | JSON output. |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | Validation failure, unmet precondition, or CLI error. |

`mspec test` honors `expect_red_on_exit` and `expect_green_on_exit` from config to decide whether a test run is a "pass" for its expectation.
