---
description: Start a new mspec change (creates changes/<timestamp>-<feature>/ and readme.md)
---<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->


You are starting the **new** step of the mspec workflow.

## Procedure

1. Run `mspec status --json` to confirm no other change is in progress (optional).
2. Ask the user for a short kebab-case feature name if not provided as an argument.
3. Run `mspec new <feature-kebab>` — the CLI creates `changes/<YYYY-MM-DD-HHMMSS>-<feature>/readme.md` from the template.
4. Read the generated `readme.md` and fill in the `## Request` section with a 1–3 line summary of the user's intent.
5. Run `mspec validate --change <change-dir>` to confirm structural validity.
6. Since `block: true`, stop and instruct the user to run `/mspec:continue` when ready.
