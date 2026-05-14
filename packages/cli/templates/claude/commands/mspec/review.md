---
description: Run the self-review step via mspec-self-reviewer subagent
---

You are in the **self-review** step of the mspec workflow.

## Procedure

1. Run `mspec status --change <change-dir> --json` and `mspec continue --change <change-dir> --json` for `subagent_prompt`.
2. Read all `requires` artifacts (`checklist.md`, `design.md`, `architecture-overview.md`, `quickstart.md`).
3. Invoke the `mspec-self-reviewer` subagent (Task tool) with the subagent prompt.
4. The subagent returns review notes; append them as a `## Self-Review` section to `design.md` (no new files; `produces: []`).
5. Re-check Constitution Check tables across all artifacts.
6. Run `mspec validate --change <change-dir>`.
7. Since `block: true`, stop and instruct the user to run `/mspec-continue`.
