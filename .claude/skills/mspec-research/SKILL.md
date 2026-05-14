---
name: mspec-research
description: research step of mspec workflow — investigate via subagent and produce research.md
when_to_use: User runs /mspec-research, or workflow auto-continues to research
---

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Run `mspec continue --change <change-dir> --json` to fetch the ready-made `subagent_prompt`.
3. Read `requires` artifacts (`proposal.md`, `specs/*/spec.md`).
4. Invoke the `mspec-researcher` subagent via the Task tool with `subagent_prompt`. It will perform web search and codebase analysis.
5. Receive the `research.md` body (Decisions / Web References / Codebase Findings / Open Choices) and write it to disk.
6. For any `Open Choices`, ask the user via AskUserQuestion (1 question per call) and update the file.
7. Append the `## Constitution Check` (Phase 0 only).
8. Run `mspec validate --change <change-dir>`.
9. `block: true` — stop and ask the user to run `/mspec-continue`.
