---
description: Advance the mspec workflow to the next step
---<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->


You are advancing the mspec workflow.

## Procedure

1. Run `mspec continue --change <change-dir> --json`.
2. Inspect `next_action`:
   - `"execute"` → load the skill named in `skill`, then follow `main_prompt`. If `subagent_prompt` is non-empty, invoke `subagent_name` via the Task tool with that prompt.
   - `"wait_user"` → stop and tell the user what input is needed.
   - `"validate_failed"` → read `blockers`, fix the offending artifact, run `mspec validate`, then re-run `/mspec:continue`.
   - `"complete"` → announce completion. No further action.
3. If `block_after: true` after executing the step, stop and wait for the user to run `/mspec:continue` again.
