---
description: Run the proposal step (ask questions, write proposal.md)
---

You are in the **proposal** step of the mspec workflow.

## Procedure

1. Run `mspec status --change <change-dir> --json` to load context.
2. Read `requires` artifacts (readme.md).
3. Run `mspec questions --phase proposal --json` to load the question bank.
4. Use AskUserQuestion (1 question per call, multi-select preferred) to clarify scope, NFR, completion criteria, and terminology.
5. Write `proposal.md` using the template at `<cli-pkg>/templates/artifacts/proposal.md`.
6. Fill the `## Constitution Check` table at the bottom (Phase 0 only).
7. Run `mspec validate --change <change-dir>`.
8. Since `block: true`, stop and instruct the user to run `/mspec-continue`.
