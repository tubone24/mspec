---
name: mspec-tasks
description: tasks step of mspec workflow — produce tasks.md with anchor blocks
when_to_use: User runs /mspec-tasks, or workflow auto-continues to tasks
---

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Read `design.md` and `checklist.md`.
3. Write `tasks.md` from the template: Phase 1 Setup / Phase 2 Foundational / Phase 3 User Story / Phase 4 Polish.
4. For each implementation and E2E task, attach the 3-line `anchor:` block:
   ```
   @mspec-delta <change-dir>/specs/<capability>/spec.md
   Requirements implemented: FR-NNN[, FR-NNN, ...]
   Change: <feature-kebab>
   ```
5. Tests-first: every Scenario in the Delta Spec needs an E2E task **before** its implementation task. Implementation tasks list the same FR-IDs as the E2E that exercises them.
6. Append the `## Constitution Check` table (Phase 0 only).
7. Run `mspec validate --change <change-dir>`.
8. `block: true` — stop and ask the user to run `/mspec-continue`.
