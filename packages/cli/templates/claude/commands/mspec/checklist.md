---
description: Generate checklist.md via the mspec-checklist-auditor subagent
---

You are in the **checklist** step of the mspec workflow.

## Procedure

1. Run `mspec status --change <change-dir> --json` and `mspec continue --change <change-dir> --json` to fetch `subagent_prompt`.
2. Read `requires` artifacts (`specs/*/spec.md`, `design.md`).
3. Invoke the `mspec-checklist-auditor` subagent via Task tool with the subagent prompt; it should also scan related capability SoT specs for regression risk.
4. The subagent returns `checklist.md` content (Delta Spec Coverage, Source-of-Truth Regression, Constitution).
5. Run `mspec validate --change <change-dir>`.
6. `block: false` — auto-continue to self-review.
