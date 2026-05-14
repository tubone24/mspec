---
name: mspec-checklist
description: checklist step of mspec workflow — produce checklist.md via subagent
when_to_use: User runs /mspec-checklist, or workflow auto-continues to checklist
---

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Run `mspec continue --change <change-dir> --json` to fetch `subagent_prompt`.
3. Read `requires` (`specs/*/spec.md`, `design.md`).
4. Invoke `mspec-checklist-auditor` subagent (Task tool) — it should also scan related capability SoT specs for regression risk.
5. Write the returned `checklist.md` (Delta Spec Coverage / Source-of-Truth Regression / Constitution).
6. Run `mspec validate --change <change-dir>`.
7. `block: false` — auto-continue.
