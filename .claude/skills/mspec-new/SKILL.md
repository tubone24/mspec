<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->
---
name: mspec-new
description: new step of mspec workflow — bootstrap a change directory and readme.md
when_to_use: User runs /mspec:new, or workflow auto-continues to new
---

## Procedure

1. Run `mspec status --json` (no `--change`) to confirm overall repo state.
2. Read the user's request and propose a kebab-case feature name (ask once if ambiguous).
3. Run `mspec new <feature-kebab>` — the CLI creates `changes/<YYYY-MM-DD-HHMMSS>-<feature>/readme.md`.
4. Open `readme.md` and write a 1–3 line `## Request` summary based on the user's words. Leave `## Artifacts` checkboxes unchecked and `## Skipped Steps` empty.
5. Run `mspec validate --change <change-dir>`.
6. `block: true` — stop and ask the user to run `/mspec:continue` when ready.
