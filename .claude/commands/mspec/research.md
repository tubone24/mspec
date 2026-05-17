---
description: Run the research step via mspec-researcher subagent
---<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->


You are in the **research** step of the mspec workflow.

## Procedure

1. Run `mspec status --change <change-dir> --json` and `mspec continue --change <change-dir> --json` — the latter returns a ready-made `subagent_prompt`.
2. Read `requires` artifacts (`proposal.md`, `specs/*/spec.md`).
3. Invoke the `mspec-researcher` subagent via the Task tool, passing `subagent_prompt`.
4. The subagent returns the body of `research.md` (Decisions table, Web References, Codebase Findings, Open Choices).
5. Use AskUserQuestion to resolve any remaining Open Choices (1 question per call).
6. Append the `## Constitution Check` Phase 0 table to `research.md`.
7. Run `mspec validate --change <change-dir>`.
8. Since `block: true`, stop and instruct the user to run `/mspec:continue`.
