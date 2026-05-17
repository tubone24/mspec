---
description: Generate the Delta Spec skeleton with auto-numbered FR-NNN
---<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->


You are in the **delta** step of the mspec workflow.

## Procedure

1. Run `mspec status --change <change-dir> --json` and read `proposal.md` to discover touched capabilities.
2. For each touched capability, run `mspec delta init --capability <name> --change <change-dir>`. The CLI auto-numbers FR-NNN by reading the existing `specs/<name>/spec.md` (or starts at FR-001 for new capabilities).
3. Open the generated `changes/<change-dir>/specs/<capability>/spec.md` and fill in each Requirement's title, MUST/SHALL clause, and at least one `#### Scenario` (must be H4) with GIVEN/WHEN/THEN bullets.
4. Run `mspec validate --change <change-dir>` to check FR-ID uniqueness and Scenario H4 structure.
5. `block: false` — auto-continue. Run `/mspec:continue` to advance to research.
