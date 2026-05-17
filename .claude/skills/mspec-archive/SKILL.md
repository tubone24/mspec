---
name: mspec-archive
description: archive step of mspec workflow — deterministic merge into SoT spec and archive move
when_to_use: User runs /mspec:archive, or workflow auto-continues to archive
---<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->


## Procedure

1. Run `mspec status --change <change-dir> --json` and confirm all prior steps are `done` or `skipped`.
2. Run `mspec archive <change-dir> --dry-run` and show the diff to the user.
3. On confirmation, run `mspec archive <change-dir> -y`. The CLI:
   - Validates the change.
   - Parses the Delta Spec sections and applies ADDED / MODIFIED / REMOVED / RENAMED to `specs/<capability>/spec.md` (no LLM involved).
   - Moves `changes/<change-dir>/` → `changes/archive/<change-dir>/` via `git mv`.
   - Re-runs `mspec anchor check` to confirm anchors still resolve.
4. Report the merge summary to the user. Workflow complete.
