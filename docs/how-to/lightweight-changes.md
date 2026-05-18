---
doc_type: How-to
---

# Run lightweight changes (typo / minor / bugfix)

The 11-step pipeline is overkill for typo fixes or one-line bug patches. Use **modes** to skip the analysis-heavy steps without losing the spec/anchor guarantees.

## When to pick which mode

| Mode | Skips | Forces | Typical use case |
|---|---|---|---|
| `typo` | `proposal`, `quickstart` | — | Pure text/comment edits, no behavior change. |
| `minor` | `proposal`, `quickstart` | — | Small UX or wording change with no logic impact. |
| `bugfix` | `proposal`, `quickstart` | `research` | A bug that needs a quick root-cause analysis but no full proposal. |

See `packages/cli/templates/workflow.default.yaml:125-134` for the source of truth.

## Trigger it

### Path A — let the AI infer

Just run `/mspec:new` with a short description. The `mspec-new` skill will:

1. Guess a mode from your wording.
2. Confirm with **one** `AskUserQuestion` ("I think this is a `typo` change — is that right?").
3. On approval, append `> Mode: typo` to `readme.md` right after `## Request`.

### Path B — declare explicitly

```bash
mspec new fix-cli-typo --mode typo
```

…or after the fact, hand-edit `readme.md` to start with:

```markdown
## Request
Fix a typo in the README.

> Mode: typo
```

## Verify the skip took effect

```bash
mspec status --change 2026-05-18-093015-fix-cli-typo --json | jq '.steps'
```

The skipped steps should appear with `status: "skipped"` and a `reason`.

## When NOT to use a mode

- The change adds new behavior → run the full flow (modes won't write a proposal for you).
- The change touches a new capability → you still need `delta` to introduce FR-IDs.
