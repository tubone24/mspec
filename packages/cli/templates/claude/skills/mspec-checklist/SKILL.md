---
name: mspec-checklist
description: checklist step of mspec workflow — produce checklist.md via subagent
when_to_use: User runs /mspec:checklist, or workflow auto-continues to checklist
---

<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->

<!-- @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-015 -->
<!-- Change: step-checkbox-update -->

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Run `mspec continue --change <change-dir> --json` to fetch `subagent_prompt`.
3. Read `requires` (`specs/*/spec.md`, `design.md`).
4. Invoke `mspec-checklist-auditor` subagent (Task tool) — it should also scan related capability SoT specs for regression risk.
5. Write the returned `checklist.md` (Delta Spec Coverage / Source-of-Truth Regression / Constitution).
5a. `readme.md` の `## Artifacts` 節の `- [ ] checklist.md` を `- [x] checklist.md` に更新する。
6. Run `mspec validate --change <change-dir>`. validate が失敗した場合は `- [x] checklist.md` を `- [ ] checklist.md` にロールバックする。
7. `block: false` — auto-continue.
