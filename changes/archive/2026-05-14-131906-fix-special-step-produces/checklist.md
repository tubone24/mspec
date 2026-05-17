---
doc_type: Checklist
---

# Checklist: fix-special-step-produces

## Delta Spec Coverage

### cli-done-log

- [ ] cli-done-log FR-001: `mspec done <step-id> --change <change-dir>` appends an entry to `done-log.yaml` (or `done-log.json` — see Format Discrepancy note below) with the step-id and an ISO 8601 timestamp.
- [ ] cli-done-log FR-001 (Design vs Delta discrepancy): Delta Spec states entries are **appended** to `changes/<change-dir>/done-log.yaml`; design.md Decision 4 states re-execution **overwrites** the timestamp (idempotent). Reconcile append-vs-overwrite semantics before implementation.
- [ ] cli-done-log FR-001 (Location discrepancy): Delta Spec places the file at `changes/<change-dir>/done-log.yaml`; design.md Decision 1 places it at `.mspec/cache/done-log.json`. File format (YAML vs JSON) and location must be agreed upon and reflected consistently in Delta Spec and design.md.
- [ ] cli-done-log FR-002: `done-log.yaml` stores an array of entries each containing `step` (string) and `at` (ISO 8601 string), symmetric with `skip.yaml`.
- [ ] cli-done-log FR-002 (Schema discrepancy): Delta Spec FR-002 shows flat array `[{ step, at }]`; design.md Decision 1 shows nested-by-change-name object `{ changeName: { stepId: { done_at } } }`. Schema shape must be reconciled.
- [ ] cli-done-log FR-003: `mspec done <step-id>` for a step that has non-empty `produces` is rejected with error message `"mspec done は produces が空のステップにのみ使用できます"` and the done-log is not updated.
- [ ] cli-done-log FR-003: Verify that after rejection the done-log file remains byte-identical to its pre-command state (no partial write).

### cli-state-engine

- [ ] cli-state-engine FR-001: When a step has `produces: []` and its step-id is recorded in the done-log, `evaluateStep` in `state-engine.ts` returns `'done'`.
- [ ] cli-state-engine FR-001 (validate chain — Decision 3): design.md Decision 3 states `mspec done implement` internally invokes `mspec validate` before transitioning to done. This behavior is not codified in any FR. Verify whether FR-001 is intended to cover this or a separate FR is needed.
- [ ] cli-state-engine FR-002: When a step has `produces: []` and its step-id is NOT in the done-log, and the previous step is done or skipped, `evaluateStep` returns `'ready'`.
- [ ] cli-state-engine FR-002: Confirm that `'ready'` is returned (not `'blocked'`) even when done-log does not exist at all (file-not-found path).

### cli-workflow-engine

- [ ] cli-workflow-engine FR-018: `workflow.yaml` does not carry `skippable: true` on `implement`, `archive`, and `self-review` steps after this change is archived.
- [ ] cli-workflow-engine FR-018: Confirm that `research`, `quickstart`, and `checklist` steps retain their `skippable: true` flags after the change.
- [ ] cli-workflow-engine FR-018: Verify that `mspec skip implement` is rejected after `skippable: true` is removed (check `commands/skip.ts:23` guard behavior).

---

## Source-of-Truth Regression

### cli-workflow-engine (SoT)

- [ ] cli-workflow-engine SoT FR-005 (REGRESSION RISK — HIGH): FR-005 states `done` requires all produced files to exist and pass `mspec validate`. Verify that steps with non-empty `produces` (e.g., `proposal`, `design`) are still evaluated by artifact existence + validate, and are NOT incorrectly satisfied by a done-log entry.
- [ ] cli-workflow-engine SoT FR-006 (REGRESSION RISK — HIGH): FR-006 defines `ready`/`blocked` by upstream completion. After this change, upstream `done` can be sourced from done-log (produces-less steps). Verify that `ready` correctly propagates to downstream steps when a produces-less step is done via done-log, and `blocked` propagates correctly when it is not.
- [ ] cli-workflow-engine SoT FR-008 (REGRESSION RISK — MEDIUM): FR-008 sources `skipped` state from `skip-log.json`. After removing `skippable: true` from `implement`, `archive`, and `self-review`, verify that these steps cannot be recorded in `skip-log.json` (i.e., `mspec skip` rejects them) while steps that retain `skippable: true` continue to work normally.
- [ ] cli-workflow-engine SoT FR-011 (REGRESSION RISK — MEDIUM): FR-011 requires `next_action: complete` when all steps are `done` or `skipped`. Verify that done-log-sourced `done` states for produces-less steps are counted correctly when determining `complete`.
- [ ] cli-workflow-engine SoT FR-004 (REGRESSION RISK — LOW): FR-004 requires `state` to be exactly one of `done|ready|blocked|skipped|invalid`. Verify `state-engine.ts` changes do not introduce any new return values or undefined cases.

### cli-archive (SoT)

- [ ] cli-archive SoT FR-001/FR-005 (REGRESSION RISK — MEDIUM): If `done-log` ends up at `changes/<change-dir>/done-log.yaml` (per Delta Spec FR-001), verify the archive directory move (`changes/<name>/` → `changes/archive/<name>/`) carries the done-log file correctly. Note: design.md Decision 1 claims it lives in `.mspec/cache/` to stay outside the archive merge target — this claim is only valid if the Delta Spec location is corrected to `.mspec/cache/`.
- [ ] cli-archive SoT FR-009 (REGRESSION RISK — LOW): Verify that `mspec archive` move preserves the done-log file (wherever it lives) with identical content and does not corrupt it.

### cli-anchor (SoT)

- [ ] cli-anchor SoT FR-001/FR-008 (REGRESSION RISK — LOW): New files `done-log.ts` and `done.ts` added by this change must carry `@mspec-delta` anchor blocks referencing the relevant FR-IDs. Verify anchor check does not report them as orphans or incomplete anchors.
- [ ] cli-anchor SoT FR-016 (REGRESSION RISK — LOW): If done-log is placed at `changes/<change-dir>/done-log.yaml`, verify this file is not accidentally scanned by the anchor scanner (it is not a `.ts`/`.js` file, so likely safe — confirm no wildcard scanner extension).

### cli-state-engine (SoT — new capability, no prior SoT requirements)

- [ ] cli-state-engine SoT: The SoT spec file exists but has no Requirements yet. Confirm this is the first archive for this capability and that FR-001/FR-002 will be correctly bootstrapped by `mspec archive`.

### cli-done-log (SoT — new capability, no prior SoT requirements)

- [ ] cli-done-log SoT: The SoT spec file exists but has no Requirements yet. Confirm this is the first archive for this capability and that FR-001/FR-002/FR-003 will be correctly bootstrapped by `mspec archive`.

---

## Constitution

- [ ] Constitution I (ステップ独立性): Verify that `done-log.ts` is a self-contained module with no cross-step coupling, and that `computeStatus` changes are additive-only (new `doneLog` parameter has a safe default so existing callers remain backward-compatible without modification).
- [ ] Constitution II (決定論的マージ): Verify done-log is NOT treated as a Delta Spec merge target (i.e., it does not appear under `changes/<change-dir>/specs/` and is not processed by `mspec archive`'s parser). If done-log is placed at `changes/<change-dir>/done-log.yaml` per Delta FR-001, confirm it is explicitly excluded from archive merge logic.
- [ ] Constitution III (質問駆動の要件確定): Verify that all Open Choices identified during research were resolved in research/design phases and that no design-time decisions remain unrecorded. In particular, the format/location contradiction between FR-001/FR-002 and design.md Decision 1 must be traceable to a recorded decision.
- [ ] Constitution IV (双方向アンカー): Design marks this principle as "—" (no impact). Verify this is correct by confirming: (a) `done-log.ts`, `done.ts`, `state-engine.ts` (modified), `status.ts` (modified), `continue.ts` (modified), and `state-engine.test.ts` each carry a valid `@mspec-delta` anchor block referencing the appropriate FR-IDs; (b) `mspec done implement`'s optional `mspec validate` call (Decision 3) does not affect the existing `enforce_anchor` evaluation path in unexpected ways.
- [ ] Constitution V (強制ステップと拡張ステップの分離): Verify that removing `skippable: true` from `implement`, `archive`, and `self-review` makes the mandatory/optional boundary more explicit without touching the `removable` flag or workflow type schema (`workflow.ts:18`). Confirm `research`, `quickstart`, and `checklist` retain `skippable: true`.
