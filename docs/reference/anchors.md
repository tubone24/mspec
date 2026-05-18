---
doc_type: Reference
---

# Anchor Reference (`@mspec-delta`)

Anchors are the bi-directional link between spec and code. They are the single mechanism that lets `mspec anchor check` answer:

> *"For every FR-ID in the Delta Spec, is there code that implements it? For every line of code that claims to implement FR-NNN, does that FR-NNN actually exist?"*

## Format

A 3-line HTML/JS/YAML comment block placed in implementation or test files:

```ts
/**
 * @mspec-delta 2026-05-14-093015-add-search/specs/search-engine/spec.md
 * Requirements implemented: FR-005, FR-007
 * Change: add-search
 */
export function searchDocs() { /* ... */ }
```

| Line | Pattern | Notes |
|---|---|---|
| 1 | `@mspec-delta <change-dir>/specs/<capability>/spec.md` | Path is relative to the project root. Change dir matches `YYYY-MM-DD-HHMMSS-<feature>`. |
| 2 | `Requirements implemented: FR-NNN[, FR-NNN]*` | Comma-separated, no trailing punctuation. |
| 3 | `Change: <feature-kebab>` | Must equal the trailing component of the change dir. |

Comment syntax adapts to the host language: `//` / `/* */` in JS/TS, `#` in YAML/Python/shell, `<!-- -->` in Markdown.

## Placement rules

- The block must appear within the first **30 lines** of the file.
- For test files (E2E), the anchor goes at the top of the file or describe block.
- Multiple anchors per file are allowed (e.g. when one file satisfies FR-IDs from two changes).

## CLI checks

| Command | What it does |
|---|---|
| `mspec anchor check` | Walks every anchor in `src/`, `tests/`, `e2e/`, etc. and reports any that point to a nonexistent spec file or FR-ID. |
| `mspec anchor extract <change>` | Emits a single JSON bundle of `{code_path, anchored_fr_ids, delta_spec_excerpt}` — designed to be pasted into an LLM context for review. |
| `mspec anchor list [--orphans]` | Inventory. `--orphans` filters to anchors whose change dir no longer exists (e.g. removed after a bad merge). |

`mspec validate` invokes `anchor check` internally, so most users will encounter the check at validation time rather than as a standalone run.

> **エラーや `[orphan]` が出たときの直し方** は [`docs/how-to/fix-anchor-errors.md`](../how-to/fix-anchor-errors.md) を参照してください。`✗` の各エラー、`warn:` の各警告、`anchor list` のタグ別対応を症状別にまとめています。

## Enforcement in the `implement` step

When `workflow.yaml` sets `enforce_anchor: true` on the `implement` step (the default), the workflow engine refuses to mark the step as `done` if any FR-ID from the Delta Spec lacks at least one anchor pointing back to it.

The complementary check, `enforce_e2e: true`, requires every `#### Scenario:` block in the Delta Spec to have a corresponding E2E task in `tasks.md`.

Together, those two flags create the round-trip guarantee:

```
Delta Spec FR-NNN  ←──── anchor ──── implementation code
       │
       └── Scenario ──── E2E task ─── E2E test ──── (test passes green)
```

## Why we picked this format over alternatives

| Option | Rejected because |
|---|---|
| File path comments (`// see spec/foo.md`) | Not machine-checkable — anything can drift unnoticed. |
| Git trailers (`Spec: FR-005`) | Only visible in commits, not in the working tree. |
| External traceability DB | Adds infra, splits the SoT, conflicts on rebases. |

The 3-line comment is **plain text**, **lives next to the code**, and is **trivially greppable**. Every grep tool and every LLM context window can see it; the CLI just adds the structural check.
