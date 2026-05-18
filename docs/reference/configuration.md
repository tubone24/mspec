---
doc_type: Reference
---

# Configuration Reference (`.mspec/config.yaml`)

`.mspec/config.yaml` controls locale, the test runner, project meta, and the Claude Code integration. The file is written by `mspec init` and then hand-edited.

## Default file

```yaml
version: 1

# Artifact output language (ISO 639-1 two-letter code, defaults to ja)
locale: ja

# Test runner — used by `mspec test expect-red/expect-green`
test:
  command: ""
  expect_red_on_exit: [1, 2]
  expect_green_on_exit: [0]

# Project-wide metadata
project:
  default_capability: ""
  language: "typescript"

# Integrations
integrations:
  claude:
    enabled: true
    subagents: false
```

## Keys

### `version` (required)
Schema version. Must be `1` for the current CLI. Bumped on backwards-incompatible config changes.

### `locale` (top-level, optional, default `ja`)
ISO 639-1 two-letter code that selects artifact and question-bank templates.

- `ja` → uses `templates/artifacts/proposal.ja.md` etc. (shipped).
- `en` → uses `templates/artifacts/proposal.en.md` etc. (shipped).
- Anything else → `mspec validate` exits 1 with `unsupported locale: <code>`.

To add a new locale, place `templates/artifacts/*.<code>.md` and `templates/questions/*.<code>.yaml` files in either the package or a project-local override directory. `mspec init` is **not** required for new locales — the resolver detects them on the fly.

> **Important**: `locale` is a **top-level** key. `project.locale` is not honored and will be ignored.

### `test.command` (string, optional)
Shell command that `mspec test expect-red/expect-green` will execute. Examples:

```yaml
test:
  command: "npm test --"
```

```yaml
test:
  command: "pnpm vitest run"
```

```yaml
test:
  command: "pytest -x -q"
```

If empty, `mspec test` will exit with a hint to configure it.

### `test.expect_red_on_exit` / `test.expect_green_on_exit` (array of ints)
Exit codes that count as a "fail" (`red`) or "pass" (`green`). Defaults handle Vitest, Jest, pytest, and most Go/Rust test runners. Override only if your runner uses unusual codes.

### `project.default_capability` (string, optional)
When non-empty, `mspec new` will seed the readme with this capability name instead of asking. Useful for monorepos where most changes belong to the same capability.

### `project.language` (string, optional, informational)
Free-text identifier (`typescript`, `python`, `go`, …). Currently consumed by templates and by some skill prompts to set the right code fence syntax.

### `integrations.claude.enabled` (boolean, default `true`)
When `false`, `mspec init` will not write `.claude/commands/`. Useful if you want to run mspec on a project that doesn't have Claude Code.

### `integrations.claude.subagents` (boolean, default `true` via `--no-subagents=false`)
When `false`, mspec skills run inline in the main Claude Code context instead of delegating to subagents. Trades isolation for fewer context switches.

## Workflow file

The companion `.mspec/workflow.yaml` defines the steps themselves. See [`./workflow.md`](./workflow.md) for that schema.

## Validation

```bash
mspec schema validate       # validates workflow.yaml
mspec validate              # validates everything else
```

`mspec validate` checks `config.yaml` indirectly — for example, an unsupported `locale` will cause a non-zero exit with an actionable message.
