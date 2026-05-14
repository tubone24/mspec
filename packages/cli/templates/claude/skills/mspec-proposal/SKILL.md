---
name: mspec-proposal
description: proposal step of mspec workflow — clarify intent and write proposal.md
when_to_use: User runs /mspec-proposal, or workflow auto-continues to proposal
---

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Read `readme.md`.
3. Run `mspec questions --phase proposal --json` to load the question bank.
4. Ask 3–5 clarifying questions via AskUserQuestion (1 per call, multi-select preferred), covering functional scope, NFR, completion criteria, terminology.
5. Write `proposal.md` from the artifact template (Why / Goals / Non-Goals / Capabilities / Open Questions).
6. Fill the `## Constitution Check` table (Phase 0 column only; Phase 1 stays `—`).
7. Run `mspec validate --change <change-dir>`.
8. `block: true` — stop and ask the user to run `/mspec-continue`.
