---
description: Break the change into tasks.md with anchor blocks
---

<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->

<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-001 -->

You are in the **tasks** step of the mspec workflow.

## Procedure

1. Run `mspec status --change <change-dir> --json` and read `design.md` and `checklist.md`.
2. Write `tasks.md` using the template, broken into Phase 1 Setup / Phase 2 Foundational / Phase 3 User Story / Phase 4 Polish.
3. For every implementation task and every E2E test task, attach a 3-line `anchor:` block:
   ```
   @mspec-delta <change-dir>/specs/<capability>/spec.md
   Requirements implemented: FR-NNN[, FR-NNN, ...]
   Change: <feature-kebab>
   ```
4. Tests-first: every Scenario in the Delta Spec must have an E2E task before its implementation task.
5. Append the `## Constitution Check` Phase 0 table.
6. Run `mspec validate --change <change-dir>`.
7. Since `block: true`, stop and instruct the user to run `/mspec:continue`.
