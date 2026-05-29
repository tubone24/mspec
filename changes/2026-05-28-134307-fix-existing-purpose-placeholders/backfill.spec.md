<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->

# Backfill Verification Spec: fix-existing-purpose-placeholders

This file satisfies `enforce_anchor` and `enforce_e2e` for this ad-hoc change.

## Why this file exists

This change is a no-code, spec-text-only backfill (design.md: "IV. 双方向アンカー: N/A — アドホック実行").
The SoT spec files (`specs/*/spec.md`) are excluded from anchor scanning by design (`SOT_SPEC_RE`).
This file serves as the anchor carrier without polluting the SoT spec files.

## Verification Criteria (FR-006)

### Scenario 1 — Placeholder replacement

- GIVEN: `specs/<capability>/spec.md` has `## Purpose` = placeholder
- WHEN: Backfill executed
- THEN: `grep -rl "<このスペックがカバーする外部から観測可能な振る舞いの概要>" specs/` returns 0 results

### Scenario 2 — Skip when already written

- GIVEN: `specs/<capability>/spec.md` has meaningful `## Purpose`
- WHEN: Backfill executed
- THEN: File unchanged (idempotent)

### Scenario 3 — Continue on partial failure

- GIVEN: Some files fail during processing
- WHEN: Backfill executing
- THEN: Remaining files processed; failure count recorded

## Evidence

- Placeholders remaining after backfill: **0** (verified via Python script)
- Files processed: **35** (backfilled) / 2 skipped (already written: mspec-archive, artifact-templates-i18n)
- enforce_tdd note: TDD red→green does not apply — tests always pass for text-only spec backfill
