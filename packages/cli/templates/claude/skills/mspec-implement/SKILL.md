---
name: mspec-implement
description: implement step of mspec workflow — write code/tests with TDD red→green and anchors
when_to_use: User runs /mspec:implement, or workflow auto-continues to implement
---<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->

<!-- @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-012, FR-013, FR-014 -->
<!-- Change: checklist-ai-driven-verification -->
<!-- @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-016 -->
<!-- Change: step-checkbox-update -->

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Read `tasks.md`.
3. For each task in dependency order:
   - Copy its 3-line `anchor:` block to the head of the target file (within the first 10 lines, language-appropriate comment).
   - If it is an **E2E test** task: write the failing test, then run `mspec test --expect-red <task-id> --change <change-dir>` to record red evidence.
   - If it is an **implementation** task: implement the code, then run `mspec test --expect-green <task-id> --change <change-dir>` to record green evidence.
   - After `--expect-green` is recorded, read the task's anchor `Requirements implemented: FR-NNN` list. For each FR-NNN, scan `checklist.md` and update any `- [ ] ... <!-- verify: fr-NNN -->` lines to `- [x] ... <!-- verify: fr-NNN -->` (idempotent: skip lines already `- [x]`; skip if no matching annotation found — checklist.md remains unchanged). <!-- FR-012 auto-check -->
   - After `--expect-green` is recorded (全テスト GREEN の場合のみ)、`tasks.md` の当該タスク行 `- [ ] TNNN: …` を `- [x] TNNN: …` に更新する（冪等: すでに `- [x]` の行は変更しない）。<!-- FR-016 tasks-checkbox -->
4. Use AskUserQuestion if any decision deviates from `design.md`.
5. After all tasks complete, scan `checklist.md` for remaining unchecked items and report: <!-- FR-013 report -->
   - `verify: human` 未チェック項目あり → 一覧をユーザーに提示し、人間レビューを要求してブロックする（block）
   - `verify: fr-NNN` 未チェック項目あり（gap）→ 対象 FR 番号とギャップ（tasks.md の `Requirements implemented` アンカーに対応 FR が存在しない）を警告し、ユーザーの確認を待つ（警告 + block）
   - 未チェック項目ゼロ → 実装完了を宣言（block なし）
6. After all tasks:
   - Run `mspec anchor check --change <change-dir>` (must pass; `enforce_anchor: true`).
   - Run `mspec validate --change <change-dir>` (checks `enforce_e2e` and `enforce_tdd`).
7. `block: true` — stop and ask the user to run `/mspec:continue`.
