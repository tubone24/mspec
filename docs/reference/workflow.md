---
doc_type: Reference
---

# Workflow Reference (`.mspec/workflow.yaml`)

The workflow file declares the ordered list of steps, their gating behavior, and the enforcement flags the CLI applies per step. The default lives at `packages/cli/templates/workflow.default.yaml` and is copied by `mspec init`.

## Top-level shape

```yaml
version: 1
name: mspec-default
description: <free text>
steps: [ <Step>, ... ]
modes:
  typo:    { skip: [...], force: [...] }
  minor:   { skip: [...], force: [...] }
  bugfix:  { skip: [...], force: [...] }
```

## Step schema

| Key | Type | Notes |
|---|---|---|
| `id` | string | Unique step identifier (e.g. `proposal`). |
| `command` | string | Slash command the user types in Claude Code (e.g. `/mspec:proposal`). |
| `skill` | string | Name of the matching skill in `.claude/skills/`. |
| `requires` | array of strings | Artifact filenames (or globs) that must exist before this step can start. |
| `produces` | array of strings | Artifact filenames this step writes. Use `[]` for steps that don't produce a file. |
| `block` | boolean | If `true`, the workflow halts after this step until the user runs `/mspec:continue`. If `false`, auto-continue. |
| `removable` | boolean | If `true`, the user may delete the produced artifact and re-run the step. |
| `skippable` | boolean | If `true`, `mspec skip <step-id>` is allowed (with a non-empty reason). |
| `subagent` | boolean | If `true`, the step's skill delegates the heavy work to a Claude Code subagent. |
| `ask_questions` | boolean | If `true`, the skill is allowed to invoke `AskUserQuestion`. |
| `constitution_check` | boolean | If `true`, the artifact must contain a Phase 0 / Phase 1 Constitution Check table. |
| `enforce_fr_ids` | boolean | (delta) Require unique `FR-NNN` and `#### Scenario:` blocks per Requirement. |
| `enforce_anchor` | boolean | (implement) Every FR-ID in the Delta Spec must be anchored from code or test. |
| `enforce_e2e` | boolean | (implement) Every Scenario must have a corresponding E2E task in `tasks.md`. |
| `enforce_tdd` | boolean | (implement) `mspec test expect-red` must run before `expect-green` per task. |

## The 11 standard steps

| # | id | block | subagent | Key enforcement |
|---|---|---|---|---|
| 1 | `new` | true | — | — |
| 2 | `proposal` | true | — | `constitution_check` |
| 3 | `delta` | false | — | `enforce_fr_ids` |
| 4 | `research` | true | yes | `constitution_check`, `skippable` |
| 5 | `design` | true | — | `constitution_check` |
| 6 | `quickstart` | false | — | `skippable` |
| 7 | `checklist` | false | yes | `skippable` |
| 8 | `self-review` | true | yes | `constitution_check`, `skippable` |
| 9 | `tasks` | true | — | `constitution_check` |
| 10 | `implement` | true | — | `enforce_anchor`, `enforce_e2e`, `enforce_tdd` |
| 11 | `archive` | false | — | (deterministic CLI merge) |

## Modes (lightweight changes)

```yaml
modes:
  typo:    { skip: [proposal, quickstart], force: [] }
  minor:   { skip: [proposal, quickstart], force: [] }
  bugfix:  { skip: [proposal, quickstart], force: [research] }
```

`skip` lists steps that will be auto-skipped; `force` lists steps that must run even if they are otherwise `skippable`. See [`../how-to/lightweight-changes.md`](../how-to/lightweight-changes.md).

## Validation

```bash
mspec schema validate
```

The CLI rejects unknown keys, missing required keys, and circular `requires` dependencies.

## Customization

See [`../how-to/customize-workflow.md`](../how-to/customize-workflow.md) for the common edits — disabling subagents, toggling block gates, adding a custom step.
