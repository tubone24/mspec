---
doc_type: Tutorial
---

# Your Second Change: `MODIFIED` and the Source of Truth

This tutorial picks up where [`./getting-started.md`](./getting-started.md) leaves off. After the first change, `specs/task-list/spec.md` exists as the **Source of Truth (SoT)** with `FR-001`–`FR-003`. We now ship a *second* change — `task-complete` — and meet the parts of mspec that only become visible once you already have a SoT:

- The `## MODIFIED` section of a Delta Spec (here: FR-003 grows a completion flag).
- The `## REMOVED` section, and how mspec preserves **FR-ID gaps** so old IDs are never reused.
- How `@mspec-delta` anchors from the *first* change keep validating after archive.

> The change we ship in this tutorial:
>
> - Project: same `mytodo` from the first tutorial
> - Feature: toggle a task between active and completed, and filter the list
> - Capability: `task-list` (same as before)
> - Feature kebab: `task-complete`
>
> Expected merge result: **ADDED 2 / MODIFIED 1 / REMOVED 0**.

## 1. Read the SoT before you propose anything

The SoT is the single most important thing to know about before writing a new Delta Spec. Skim it first:

```bash
mspec spec list-requirements
```

Expected output:

```
## task-list
  FR-001  A user can add a task by text
  FR-002  Tasks render in insertion order
  FR-003  Tasks survive a page reload
```

To zoom into a specific requirement:

```bash
mspec spec grep FR-003
```

> **Why this matters:** every FR-ID in your new `## MODIFIED` section must already exist in the SoT. If `archive` finds `MODIFIED: FR-003` and FR-003 isn't in `specs/task-list/spec.md`, the whole merge aborts transactionally with `MODIFIED: FR-003 not found in source spec` (see `packages/cli/src/lib/archive-merger.ts:62`). Listing the SoT up-front saves you that pain. Full command reference: [`../reference/cli.md`](../reference/cli.md) `## SoT spec utilities`.

## 2. Start the change

```bash
mspec new task-complete
```

You get `changes/2026-05-19-103045-task-complete/`. In Claude Code:

```text
/mspec:new
```

In `readme.md`, expect:

```markdown
- Request: Let users mark tasks as completed, filter the view, and keep completion state across reloads.
- Mode: full
- Capabilities: task-list
```

Continue with `/mspec:continue`.

## 3. Proposal — name the FRs you'll touch

```text
/mspec:proposal
```

The thing to watch for in `proposal.md` is the **`## Impact on existing requirements`** line that Claude will draft after seeing the SoT. For `task-complete`:

```markdown
## Goals
- Toggle a task between active and completed (new behavior)
- Filter the list to show all / active / completed (new behavior)
- Persist the completed state alongside the text (extends existing FR-003)

## Non-Goals
- No undo history beyond the current toggle
- No keyboard shortcuts (deferred)

## Impact on existing requirements
- FR-003 — persistence shape changes (string → { text, done }). Will appear in `## MODIFIED`.
- FR-001, FR-002 — unaffected.
```

**What to review:**
- Every existing FR that this change will touch is **named explicitly** under impact, with the planned section (`MODIFIED` / `REMOVED`). This is what prevents accidental silent regressions later.
- Capabilities are still **just `task-list`** — if you suddenly need a second capability, that's a sign to split the change.

`/mspec:continue`.

## 4. Delta Spec — the first time you see `## MODIFIED`

```text
/mspec:delta
```

`changes/<dir>/specs/task-list/spec.md` is regenerated, now with non-empty `ADDED` and `MODIFIED` sections:

```markdown
## ADDED

### Requirement: FR-004 — Toggle a task between active and completed
The system SHALL allow toggling a task's `done` flag from false to true and back.

#### Scenario: Toggle a task to completed
- GIVEN a task "Buy milk" exists with done=false
- WHEN the user clicks the checkbox next to it
- THEN the task is rendered with strikethrough and done=true

### Requirement: FR-005 — Filter the list by completion state
The system SHALL expose three filter views: All, Active, Completed.

#### Scenario: Show only active tasks
- GIVEN two tasks exist, one active and one completed
- WHEN the user selects the "Active" filter
- THEN only the active task is visible

## MODIFIED

### Requirement: FR-003 — Tasks survive a page reload (extended)
The system SHALL persist each task's `{ text, done }` shape to localStorage and SHALL restore both fields on page load.

#### Scenario: Completed state restores after reload
- GIVEN "Buy milk" has been added and marked completed
- WHEN the user reloads the page
- THEN "Buy milk" is still in the list and is still rendered as completed
```

**Things that are different from the first change:**

| Property | First change (`task-add`) | This change (`task-complete`) |
| --- | --- | --- |
| `## ADDED` | FR-001, FR-002, FR-003 | FR-004, FR-005 |
| `## MODIFIED` | — | FR-003 |
| FR-NNN starting number | 001 | 004 (continues from the SoT — IDs are never reused) |

**What to review:**
- Every FR in `## MODIFIED` exists verbatim in the SoT (`mspec spec grep FR-003` from §1). If you renumber by accident, the archive merge will abort.
- The full restated requirement text under `## MODIFIED` is the **complete new wording** — it *replaces* the SoT version on archive. Do not write a "diff against the old text"; write what the requirement should say after this change.
- New FR IDs (FR-004, FR-005) continue from the SoT's max + 1. `mspec delta init` handles this automatically — if you see numbering go back to FR-001, something's wrong.

**If stuck:**
- ID continuation logic: [`../reference/cli.md`](../reference/cli.md) `### mspec delta init`.
- Why MODIFIED requires full restatement rather than a diff: [`../explanation/why-mspec.md`](../explanation/why-mspec.md) `## What mspec deliberately does *not* do` (the merger is parser-only and has no diff/3-way logic).

## 5. Research, design, quickstart, checklist, self-review — same shape

These five steps work the same as in the first tutorial. The only thing worth flagging is `checklist.md`'s **`## Source-of-Truth Regression`** section:

| Section | First change | This change |
| --- | --- | --- |
| `## Source-of-Truth Regression` | "no regression risk (greenfield)" | **Lists FR-001, FR-002, and the old shape of FR-003** with explicit tests to confirm they still hold |

This is exactly what the section exists for: when there's a real SoT to break, the checklist now *has work to do*.

## 6. Tasks — anchoring across two change dirs

```text
/mspec:tasks
```

The interesting wrinkle is the anchor block for the task that touches the existing `src/store.ts`. The store file is going to gain a new `@mspec-delta` block pointing at the **new** change dir — the old block from the first change stays put.

```markdown
- [ ] T-002: Extend `TaskStore` to persist { text, done } (MODIFIES FR-003)
  <!-- mspec-anchor
  spec: changes/2026-05-19-103045-task-complete/specs/task-list/spec.md
  requirements: FR-003
  change: task-complete
  -->

- [ ] T-003: Add toggle button + filter tabs to UI (ADDS FR-004, FR-005)
  <!-- mspec-anchor
  spec: changes/2026-05-19-103045-task-complete/specs/task-list/spec.md
  requirements: FR-004, FR-005
  change: task-complete
  -->
```

**What to review:**
- The MODIFIED-FR task (T-002) lists the **new** change dir, not the archived one. That's how `mspec anchor check` knows this change actually delivered the modification.

## 7. Implement — multiple anchors per file are fine

`src/store.ts` ends up with **two** anchor blocks — one from each change. Both stay legal:

```ts
/**
 * @mspec-delta 2026-05-19-090145-task-add/specs/task-list/spec.md
 * Requirements implemented: FR-001, FR-002, FR-003
 * Change: task-add
 */

/**
 * @mspec-delta 2026-05-19-103045-task-complete/specs/task-list/spec.md
 * Requirements implemented: FR-003
 * Change: task-complete
 */
export class TaskStore { /* ... */ }
```

Both anchor blocks must live within the first **30 lines** of the file ([`../reference/anchors.md`](../reference/anchors.md) `## Placement rules`). If `src/store.ts` already had imports pushing the new block past line 30, move the anchors above the imports.

**Why this works after archive:** the first anchor points to a change dir that is now `changes/archive/2026-05-19-090145-task-add/`. `findChange()` checks both `changes/<dir>/` and `changes/archive/<dir>/`, so the archived path resolves automatically with no path rewrite needed (`packages/cli/src/lib/change-discovery.ts:11`).

The TDD loop is identical to the first tutorial:

```bash
mspec test expect-red  T-002
# ... implement ...
mspec test expect-green T-002
```

**What to review:**
- `mspec anchor check` reports **0 errors** and **0 orphans** — both old (`task-add`) and new (`task-complete`) anchors should resolve.
- Every FR-ID in the *new* Delta Spec (FR-003 in MODIFIED, FR-004 and FR-005 in ADDED) is anchored from at least one file.
- FR-001 and FR-002 still have their anchors from the first change in `src/store.ts` — you didn't accidentally delete them while editing.

**If stuck:**
- If you see `[orphan]` after archive, walk through Case 5 in [`../how-to/fix-anchor-errors.md`](../how-to/fix-anchor-errors.md) (`## Error catalog` → `### Case 5 — [orphan] appears in anchor list`).

## 8. Archive — merging MODIFIED into the SoT

```text
/mspec:archive
```

The dry-run output:

```
ADDED:    FR-004, FR-005     (appended to specs/task-list/spec.md)
MODIFIED: FR-003             (replaces existing block in specs/task-list/spec.md)
REMOVED:  (none)
```

After approval, `specs/task-list/spec.md` contains FR-001, FR-002, **the updated FR-003**, FR-004, FR-005, in that order. The pre-update FR-003 wording is gone — the merge is a **replace, not a diff** ([`../reference/cli.md`](../reference/cli.md) `### mspec archive <change-name>`).

`mspec spec list-requirements` now prints:

```
## task-list
  FR-001  A user can add a task by text
  FR-002  Tasks render in insertion order
  FR-003  Tasks survive a page reload (extended)
  FR-004  Toggle a task between active and completed
  FR-005  Filter the list by completion state
```

## 9. Sidebar — when (and how) `## REMOVED` is used

The example above doesn't remove anything. But once a requirement is genuinely retired (the feature is killed, or two FRs collapse into one), use `## REMOVED`:

```markdown
## REMOVED

### Requirement: FR-002 — Tasks render in insertion order
Superseded by FR-007 ("Tasks render with active first then completed, both in insertion order") in this change.
```

When archived, mspec **does not delete the FR-ID** — it preserves a *gap* by leaving a marker comment in `specs/<capability>/spec.md`:

```markdown
<!-- mspec: gaps FR-002. Removed in changes/archive/2026-05-19-103045-task-complete -->
```

The next change cannot reuse FR-002 — a fresh ADDED requirement will skip to FR-008 (one past the SoT max, gaps included). This is by design: an FR-ID once published is a stable identifier, and silently rebinding it would let `@mspec-delta` anchors in old code accidentally point at a *different* requirement.

> Source: `packages/cli/src/lib/archive-merger.ts:278`. Test: `archive-merger.test.ts:115` confirms that removing FR-001 and then adding FR-004 leaves FR-001 permanently retired.

## 10. What you have after two changes

```text
mytodo/
├── specs/
│   └── task-list/
│       └── spec.md           ← FR-001..FR-005 (FR-003 is the updated version)
├── src/
│   └── store.ts              ← two @mspec-delta blocks, both still validate
├── e2e/
│   ├── task-add.e2e.ts       ← from the first change
│   └── task-complete.e2e.ts  ← from this change
└── changes/
    └── archive/
        ├── 2026-05-19-090145-task-add/
        └── 2026-05-19-103045-task-complete/
```

The SoT (`specs/task-list/spec.md`) is now the canonical statement of *what `mytodo` does today*. The two archived change dirs are the audit trail of *how it got here*.

## What's next

- **Walk back through the basics if anything was unclear** — [`./getting-started.md`](./getting-started.md)
- **Run a tiny change (typo / minor / bugfix) without the heavy steps** — [`../how-to/lightweight-changes.md`](../how-to/lightweight-changes.md)
- **Toggle enforcement flags or add a custom step** — [`../how-to/customize-workflow.md`](../how-to/customize-workflow.md)
- **Anchor errors after a multi-change history** — [`../how-to/fix-anchor-errors.md`](../how-to/fix-anchor-errors.md)
- **The merge contract (why parser-only)** — [`../explanation/why-mspec.md`](../explanation/why-mspec.md) `## What mspec deliberately does *not* do`
