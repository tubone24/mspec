---
name: mspec-design
description: design step of mspec workflow — write design.md + architecture-overview.md, full Constitution Check
when_to_use: User runs /mspec:design, or workflow auto-continues to design
---<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->

<!-- @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-015 -->
<!-- Change: step-checkbox-update -->

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Read `research.md`.
3. Write `design.md` from the artifact template. Fill: Summary, Technical Context, Phase 0 Constitution Check, Project Structure, Decisions.
   - `## Decisions` セクションでは、各技術的決定の受け入れ基準を Delta Spec の Scenario（GIVEN/WHEN/THEN）と対応付けて記述する。これにより checklist と tasks.md の E2E タスクへのトレーサビリティを確保する。
4. Write `architecture-overview.md` with at minimum a Mermaid System Diagram (required). Add Sequence / Data Model diagrams when applicable. Inline SVG only if Mermaid can't express it.
5. Re-evaluate the Constitution Check at the bottom of `design.md` (Phase 1) — both Phase 0 and Phase 1 columns must be filled.
6. If any ❌, fill `### Complexity Tracking` with justification (otherwise write "None").
7. Use AskUserQuestion when material design trade-offs need user input.
7a. `design.md` と `architecture-overview.md` の両方が書き込まれた後、`readme.md` の `## Artifacts` 節の `- [ ] design.md / architecture-overview.md` を `- [x] design.md / architecture-overview.md` に更新する。
8. Run `mspec validate --change <change-dir>`. validate が失敗した場合は `- [x] design.md / architecture-overview.md` を `- [ ] design.md / architecture-overview.md` にロールバックする。
9. `block: true` — stop and ask the user to run `/mspec:continue`.
