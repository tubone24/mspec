<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-001 -->
<!-- Change: fix-command-name-consistency -->
---
description: Merge the Delta Spec into the source-of-truth spec and archive the change
---

You are in the **archive** step of the mspec workflow.

## Procedure

1. Run `mspec status --change <change-dir> --json` to confirm all prior steps are `done` or `skipped`.
2. Run `mspec archive <change-dir> --dry-run` to preview the merge into `specs/<capability>/spec.md`.
3. Present the diff to the user and ask for confirmation.
4. On approval, run `mspec archive <change-dir> -y` — the CLI applies the deterministic merge and moves `changes/<change-dir>/` to `changes/archive/<change-dir>/`.
5. The CLI auto-runs `mspec anchor check` afterwards. If it fails, fix the affected anchors (paths remain under `changes/archive/...`).
6. Workflow complete.
