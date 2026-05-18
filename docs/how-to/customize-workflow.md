---
doc_type: How-to
---

# Customize the workflow

The workflow lives at `.mspec/workflow.yaml`. Each step is a YAML object with a stable schema; the CLI validates it via `mspec schema validate`.

## Disable a subagent invocation

By default, `research`, `checklist`, and `self-review` delegate to a Claude Code subagent (more focused context, slower). To run them inline instead:

```yaml
steps:
  - id: research
    subagent: false        # was: true
```

You can also globally disable subagents at init time:

```bash
mspec init --no-subagents  # skips placing .claude/agents/
```

Or toggle later in `.mspec/config.yaml`:

```yaml
integrations:
  claude:
    subagents: false
```

## Make a step blocking / auto-continue

Every step has a `block` flag. Setting it to `false` causes the workflow engine to auto-advance after the step completes.

```yaml
- id: design
  block: false           # was: true — design.md auto-continues to quickstart
```

Use sparingly — blocking gates are how mspec prevents the LLM from writing 11 artifacts in one uninterrupted run.

## Toggle enforcement flags

| Flag | Default step | Effect |
|---|---|---|
| `enforce_fr_ids` | `delta` | Requires every Delta Spec heading to use `### Requirement: FR-NNN — <title>` with unique FR-NNN. |
| `enforce_anchor` | `implement` | Rejects implementation/E2E files lacking a valid `@mspec-delta` block. |
| `enforce_e2e` | `implement` | Requires every Scenario in the Delta Spec to have a matching E2E task in `tasks.md`. |
| `enforce_tdd` | `implement` | Forces `mspec test expect-red` before `mspec test expect-green` for each task. |
| `constitution_check` | `proposal`, `design`, `tasks`, `self-review` | Inserts Phase 0/1 Constitution Check tables and validates them. |

## Add a custom step

```yaml
steps:
  # ...
  - id: security-review
    command: /mspec:security-review
    skill: mspec-security-review
    requires: [design.md]
    produces: [security-review.md]
    block: true
    removable: true
    skippable: true
```

You will also need to create:
- `.claude/commands/mspec/security-review.md` (slash command)
- `.claude/skills/mspec-security-review/SKILL.md` (step skill)

Re-run `mspec schema validate` to confirm the new step parses.

## Use lightweight modes

See [`./lightweight-changes.md`](./lightweight-changes.md). The `modes:` block at the bottom of `workflow.yaml` controls which steps are skipped / forced per mode.
