---
name: mspec-review
description: self-review step of mspec workflow — sanity-check all artifacts via subagent
when_to_use: User runs /mspec:review, or workflow auto-continues to self-review
---

<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Run `mspec continue --change <change-dir> --json` to fetch `subagent_prompt`.
3. Read all `requires` (`checklist.md`, `design.md`, `architecture-overview.md`, `quickstart.md`).
4. Invoke `mspec-self-reviewer` subagent (Task tool) with `subagent_prompt`.
5. Append the subagent's review notes as a `## Self-Review` section to `design.md` (no new files; `produces: []`).
6. Update Constitution Check tables across artifacts where the reviewer flagged gaps.
7. Run `mspec validate --change <change-dir>`.
8. `block: true` — stop and ask the user to run `/mspec:continue`.
