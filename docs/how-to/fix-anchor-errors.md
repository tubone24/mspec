---
doc_type: How-to
---

# Fix `mspec anchor check` / `mspec anchor list` errors

`mspec anchor check` and `mspec anchor list` scan `@mspec-delta` blocks embedded in code/tests to verify that bidirectional links to Delta Specs are intact. This page organizes the **errors (`✗`), warnings (`warn:`), and tags (`[orphan]`, etc.)** they report by symptom and provides the shortest path to a fix.

For the anchor format itself, see [`docs/reference/anchors.md`](../reference/anchors.md). For a full list of CLI flags, see [`docs/reference/cli.md`](../reference/cli.md).

---

## Reading the output format

### `mspec anchor check`

```
warn: src/foo.ts:12: malformed @mspec-delta path line
✗ src/foo.ts:12 — change_dir "2026-05-14-093015-add-search" not found
✓ src/bar.ts:5 — FR-005,FR-007 (2026-05-14-093015-add-search)

Scanned 12 anchor(s), 1 error(s)
```

- The leading `✓` / `✗` / `warn:` is the per-anchor verdict.
- If the trailing summary's `N error(s)` is non-zero, the exit code is **1** and CI fails.
- `warn:` lines are **not counted in the summary** (no effect on exit code), but they still require fixing. Left unaddressed, they cause anchors to be silently skipped.

### `mspec anchor list`

```
[live]     src/foo.ts:5 → 2026-05-14-093015-add-search/specs/search/spec.md (FR-005)
[archived] src/bar.ts:5 → 2026-04-01-101010-init/specs/core/spec.md (FR-001)
[orphan]   src/baz.ts:5 → 2026-03-01-100000-old/specs/core/spec.md (FR-099)

Total: 3 anchor(s), shown 3
```

| Tag | State | Action |
|---|---|---|
| `live` | `changes/<dir>/` exists in the working directory | Normal — no action needed. |
| `archived` | Moved to `changes/archive/<dir>/` | Normal — points to a past change already merged into the SoT spec. No action needed. |
| `orphan` | Exists in neither location (reference target is gone) | **Action required.** See "Case 4" below. |

Use the `--orphans` flag to filter to orphans only:

```bash
mspec anchor list --orphans
```

---

## Error catalog

### Case 1 — `change_dir "..." not found`

```
✗ src/foo.ts:12 — change_dir "2026-05-14-093015-add-search" not found
```

**What happened:** The change directory written on anchor line 1 exists in neither `changes/` nor `changes/archive/`. Likely a typo, or the change dir was manually deleted or renamed.

**Fix (pick one):**

1. **Correct the typo** — `ls changes/` to find the right dir name, then update anchor line 1 to match.
   ```bash
   ls changes/ changes/archive/ | grep add-search
   ```
2. **Restore if accidentally deleted** — Find the deletion commit with `git log --diff-filter=D -- changes/<dir>` and restore with `git checkout <SHA>^ -- changes/<dir>`.
3. **If the change was intentionally retired, delete the anchor** — Confirm the implementation the anchor pointed to is truly no longer needed, then remove the entire `@mspec-delta` 3-line block.

---

### Case 2 — `delta spec missing: changes/<dir>/specs/<capability>/spec.md`

```
✗ src/foo.ts:12 — delta spec missing: changes/2026-05-14-093015-add-search/specs/checkout/spec.md
```

**What happened:** The change dir exists, but the **capability directory / spec.md** written inside it does not. The `specs/<capability>/` was manually deleted, or the anchor was written before `/mspec:delta` was run.

**Fix:**

1. Compare the `capability` name on anchor line 1 with the actual directory names under `changes/<dir>/specs/`. If there is a spelling mismatch (e.g. `search-engine` vs `search_engine`), update the anchor to match the real path.
2. If the Delta Spec simply hasn't been created yet, run `/mspec:delta` to generate the skeleton and fill in the FR-NNN the anchor references.

---

### Case 3 — `FR ID(s) not in delta spec: FR-007`

```
✗ src/foo.ts:12 — FR ID(s) not in delta spec: FR-007, FR-099
```

**What happened:** The Delta Spec exists, but the FR-IDs written on anchor line 2 (`Requirements implemented:`) **do not appear in the body of that Delta Spec**. Either a FR was removed from the spec and the anchor was not updated, or the numbers in the anchor are wrong.

**Fix:**

1. List the FR-IDs present in the Delta Spec:
   ```bash
   grep -oE 'FR-[0-9]+' changes/<dir>/specs/<capability>/spec.md | sort -u
   ```
2. If the anchor's numbers are a typo, correct the `Requirements implemented:` line.
3. If the FR was genuinely removed from the spec, remove that FR-ID from the anchor (or delete the code itself). Delete the entire 3-line anchor block if it loses all its FR-IDs.

---

### Case 4 — `Change "..." does not match change_dir suffix`

```
✗ src/foo.ts:12 — Change "add-search-engine" does not match change_dir suffix
```

**What happened:** Anchor line 1 has `change_dir` set to `2026-05-14-093015-add-search`, but line 3's `Change:` says `add-search-engine` — the **suffix doesn't match**. This commonly happens when an anchor is copy-pasted from a different change.

**Fix:** Update line 3 to match the kebab-case suffix of line 1 (the part after the timestamp). Example:

```diff
- Change: add-search-engine
+ Change: add-search
```

---

### Case 5 — `[orphan]` appears in `anchor list`

```
  [orphan] src/baz.ts:5 → 2026-03-01-100000-old/specs/core/spec.md (FR-099)
```

**What happened:** The change_dir exists in neither `changes/` nor `changes/archive/`. This is the same situation as Case 1, but **viewed from the inventory side**.

**Fix:**

1. Extract orphans first to get a clear picture:
   ```bash
   mspec anchor list --orphans
   ```
2. For each orphan, do one of the following:
   - **Rewrite to the correct change_dir** (confirm the right name with `ls changes/ changes/archive/`)
   - **Restore from archive** (if the archive directory was accidentally deleted)
   - **Delete the anchor** (if the spec it referenced has been fully retired — also check whether the corresponding code is still needed)

`anchor list` itself has no exit code, but in the `implement` step with `enforce_anchor: true` (the default), any state that includes orphans will be re-detected as **Case 7** below.

---

### Case 6 — `warn:` warnings (malformed / truncated / incomplete)

```
warn: src/foo.ts:12: malformed @mspec-delta path line
warn: src/foo.ts:30: anchor block truncated (need 3 lines)
warn: src/foo.ts:12: incomplete anchor block (Requirements/Change line missing or malformed)
```

**What happened:** The parser detected something that looks like an anchor, but the format is broken and the 3-line block cannot be read. Because these **don't appear in the summary**, they are treated as non-existent by `enforce_anchor`.

**Typical causes and fixes:**

| Warning | Typical cause | Fix |
|---|---|---|
| `malformed @mspec-delta path line` | Malformed path (wrong timestamp digit count, missing `spec.md`, non-hyphen characters in capability name) | Reformat line 1 as `@mspec-delta YYYY-MM-DD-HHMMSS-<feature>/specs/<capability>/spec.md` |
| `anchor block truncated (need 3 lines)` | Only line 1 written near end of file, or missing newline after line 3 | Add the missing lines 2 and 3 |
| `incomplete anchor block (Requirements/Change line missing or malformed)` | Misspelled `Requirements implemented:` or `Change:`, missing colon, or wrong FR-ID format (e.g. `FR_005`) | Correct to `Requirements implemented: FR-005, FR-007` / `Change: add-search` |

> Anchors must appear **within the first 30 lines** of a file (`SCAN_LINES_MAX` in `packages/cli/src/parser/anchor.ts`). If a long license header pushes the anchor past line 30, it is **silently ignored** — no warning is emitted. If an anchor isn't being detected, check its line number first.

---

### Case 7 — `enforce_anchor: no @mspec-delta anchor blocks found ...`

```
enforce_anchor: no @mspec-delta anchor blocks found in code/tests referencing change "2026-05-14-093015-add-search"
```

**What happened:** The `/mspec:implement` step (with `enforce_anchor: true` by default) could not find **a single anchor pointing to the current change dir** anywhere in the code or tests.

**Fix:**

1. Confirm that the code written for this change actually contains an `@mspec-delta` 3-line block.
2. If you believe it was added, a malformed block falling into Case 6 warnings is the likely culprit. Run `mspec anchor check` and resolve all `warn:` lines.
3. If it still isn't detected, verify the anchor falls within the first 30 lines of the file (see the note above).

---

## One-liner self-diagnosis

```bash
# 1) List all ✗ and warn: lines
mspec anchor check 2>&1 | grep -E '^(✗|warn:)'

# 2) Extract orphans only
mspec anchor list --orphans

# 3) Scan anchors for a specific change only
mspec anchor check --change 2026-05-14-093015-add-search
```

In CI, the exit code from `mspec anchor check` is sufficient on its own — it returns 1 as soon as a single `✗` is found.

---

## Related

- [`docs/reference/anchors.md`](../reference/anchors.md) — Canonical anchor format specification
- [`docs/reference/cli.md`](../reference/cli.md) — Full flag reference for the `anchor` subcommand
- [`docs/reference/workflow.md`](../reference/workflow.md) — Behavior of `enforce_anchor` / `enforce_e2e` / `enforce_tdd`
