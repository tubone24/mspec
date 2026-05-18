---
description: Execute tasks.md with TDD (red→green) and anchor enforcement
---

<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->

<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-001 -->

You are in the **implement** step of the mspec workflow.

## Procedure

1. Run `mspec status --change <change-dir> --json` and read `tasks.md`.
2. For each task in dependency order:
   - Copy the 3-line `anchor:` block from `tasks.md` into the file you are about to create/modify (file head, within the first 10 lines, language-appropriate comment).
   - If the task is an **E2E test**: write the failing test, then run `mspec test --expect-red <task-id> --change <change-dir>` to record red evidence.
   - If the task is **implementation**: write the code, then run `mspec test --expect-green <task-id> --change <change-dir>` to record green evidence.
3. After all tasks are complete:
   - Run `mspec anchor check --change <change-dir>` (must pass; `enforce_anchor: true`).
   - Run `mspec validate --change <change-dir>` (must pass; checks `enforce_e2e` and `enforce_tdd`).
4. Use AskUserQuestion when an implementation decision deviates from `design.md`.
5. Since `block: true`, stop and instruct the user to run `/mspec:continue`.
