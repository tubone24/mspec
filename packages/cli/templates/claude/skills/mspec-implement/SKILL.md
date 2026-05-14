---
name: mspec-implement
description: implement step of mspec workflow — write code/tests with TDD red→green and anchors
when_to_use: User runs /mspec-implement, or workflow auto-continues to implement
---

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Read `tasks.md`.
3. For each task in dependency order:
   - Copy its 3-line `anchor:` block to the head of the target file (within the first 10 lines, language-appropriate comment).
   - If it is an **E2E test** task: write the failing test, then run `mspec test --expect-red <task-id> --change <change-dir>` to record red evidence.
   - If it is an **implementation** task: implement the code, then run `mspec test --expect-green <task-id> --change <change-dir>` to record green evidence.
4. Use AskUserQuestion if any decision deviates from `design.md`.
5. After all tasks:
   - Run `mspec anchor check --change <change-dir>` (must pass; `enforce_anchor: true`).
   - Run `mspec validate --change <change-dir>` (checks `enforce_e2e` and `enforce_tdd`).
6. `block: true` — stop and ask the user to run `/mspec-continue`.
