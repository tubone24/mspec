---
doc_type: Reference
---

# Tasks: checklist AI-driven verification

## Phase 1: Setup

- [ ] T001 [P] `mspec anchor check` の `.md` HTML コメント対応確認 — `packages/cli/src/parser/anchor.ts` の `blankOutHtmlComments` 呼び出し（L39）により、HTML コメント形式の `<!-- @mspec-delta ... -->` アンカーがスキャン前にマスクされることを確認する。CLI TypeScript 変更は Non-Goal（design.md 参照）のため、`.md` ファイルのアンカーブロックは将来互換として記述し、T202 の `mspec anchor check` 対象から除外する — files: `packages/cli/src/parser/anchor.ts`, `packages/cli/src/lib/text-mask.ts`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-014
        Change: checklist-ai-driven-verification

- [ ] T002 [P] `mspec-checklist-auditor.md` と `mspec-implement/SKILL.md` の現行内容確認 — 各ファイルの Procedure / Constraints 節の行番号を特定し、FR-011 アノテーション付与手順・FR-012 自動チェックロジック・FR-013 報告ロジックの挿入位置を把握する — files: `.claude/agents/mspec-checklist-auditor.md`, `.claude/skills/mspec-implement/SKILL.md`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-011, FR-012, FR-013
        Change: checklist-ai-driven-verification

## Phase 2: Foundational

- [ ] T010 [P] 4 ファイルに `@mspec-delta` アンカーブロックを付与 — 各 Markdown ファイルの YAML frontmatter 直後に HTML コメント形式で 3 行アンカーブロックを追加する。`mspec-checklist-auditor.md`（runtime + template）: `FR-011, FR-014`。`mspec-implement/SKILL.md`（runtime + template）: `FR-012, FR-013, FR-014`。現時点では `mspec anchor check` のスキャン対象外だが将来の CLI 拡張に備える — files: `.claude/agents/mspec-checklist-auditor.md`, `packages/cli/templates/claude/agents/mspec-checklist-auditor.md`, `.claude/skills/mspec-implement/SKILL.md`, `packages/cli/templates/claude/skills/mspec-implement/SKILL.md`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-011, FR-012, FR-013, FR-014
        Change: checklist-ai-driven-verification

## Phase 3: User Story 1 — FR-011: checklist-auditor が verify: アノテーションを付与する

### Tests-first (E2E)

- [ ] T101 E2E for FR-011 Scenario "AI-verifiable item receives FR reference annotation" — `.claude/agents/mspec-checklist-auditor.md` に「E2E Scenario で検証可能な項目の末尾に `<!-- verify: fr-NNN -->` を付与する」ルールが記述されていることを検証する（ファイル内容の grep + 構造確認） — files: `packages/cli/tests/claude-integration/checklist-auditor-verify-annotation.test.ts`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-011
        Change: checklist-ai-driven-verification

- [ ] T102 E2E for FR-011 Scenario "Human-review item receives human annotation" — `.claude/agents/mspec-checklist-auditor.md` に「自動検証不可能な項目の末尾に `<!-- verify: human -->` を付与する」ルールが記述されていること、および 1 項目に 1 アノテーションのみ付与する旨が明記されていることを検証する — files: `packages/cli/tests/claude-integration/checklist-auditor-verify-annotation.test.ts`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-011
        Change: checklist-ai-driven-verification

### Implementation

- [ ] T103 `.claude/agents/mspec-checklist-auditor.md`（runtime）を修正 — Constraints 節に以下を追加する：E2E Scenario 対応項目 → `<!-- verify: fr-NNN -->` / それ以外 → `<!-- verify: human -->` の判定ルール、1 項目に付与する `verify:` アノテーションは 1 つのみという一意性ルール、付与例（`- [ ] ... <!-- verify: fr-011 -->`） — files: `.claude/agents/mspec-checklist-auditor.md`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-011
        Change: checklist-ai-driven-verification

- [ ] T104 `packages/cli/templates/claude/agents/mspec-checklist-auditor.md`（template）を修正 — T103 適用済みの runtime ファイルと同一内容に更新する（`diff` で差分ゼロを確認） — files: `packages/cli/templates/claude/agents/mspec-checklist-auditor.md`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-011
        Change: checklist-ai-driven-verification

## Phase 3: User Story 2 — FR-012: implement スキルがタスク GREEN 時に checklist を自動チェックする

### Tests-first (E2E)

- [ ] T110 E2E for FR-012 Scenario "Test suite goes GREEN, corresponding checklist item is auto-checked" — `.claude/skills/mspec-implement/SKILL.md` に「GREEN 後に task アンカーを読んで FR-NNN を解決 → `<!-- verify: fr-NNN -->` 付きの `- [ ]` 行を `- [x]` に置換（冪等）」する手順が含まれることを検証する — files: `packages/cli/tests/claude-integration/implement-auto-check.test.ts`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-012
        Change: checklist-ai-driven-verification

- [ ] T111 E2E for FR-012 Scenario "No matching verify annotation — checklist unchanged" — `.claude/skills/mspec-implement/SKILL.md` に「`verify:` アノテーションが checklist.md に存在しない場合は checklist.md を変更しない」旨の冪等性ルールが含まれることを検証する — files: `packages/cli/tests/claude-integration/implement-auto-check.test.ts`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-012
        Change: checklist-ai-driven-verification

### Implementation

- [ ] T112 `.claude/skills/mspec-implement/SKILL.md`（runtime）を修正 — Step 3 完了（`mspec test --expect-green`）直後に FR-NNN 逆引き解決 → checklist.md 走査 → `<!-- verify: fr-NNN -->` 付き `- [ ]` を `- [x]` に置換 → 冪等チェックの自動チェックロジック（FR-012）を追加する — files: `.claude/skills/mspec-implement/SKILL.md`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-012
        Change: checklist-ai-driven-verification

## Phase 3: User Story 3 — FR-013: implement ステップが全タスク完了後に未チェック項目を報告する

### Tests-first (E2E)

- [ ] T120 E2E for FR-013 Scenario "Unchecked human items reported at end of implement" — `.claude/skills/mspec-implement/SKILL.md` の全タスク完了後セクションに「`<!-- verify: human -->` の未チェック項目一覧を提示し人間レビューを要求してブロックする」手順が含まれることを検証する — files: `packages/cli/tests/claude-integration/implement-unchecked-report.test.ts`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-013
        Change: checklist-ai-driven-verification

- [ ] T121 E2E for FR-013 Scenario "Unchecked fr-annotated items trigger gap warning" — `.claude/skills/mspec-implement/SKILL.md` に「`<!-- verify: fr-NNN -->` の未チェック項目が残る場合に対象 FR 番号とギャップを報告して警告ブロックする」手順が含まれることを検証する — files: `packages/cli/tests/claude-integration/implement-unchecked-report.test.ts`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-013
        Change: checklist-ai-driven-verification

- [ ] T122 E2E for FR-013 Scenario "All items checked — implementation declared complete" — `.claude/skills/mspec-implement/SKILL.md` に「全項目チェック済みの場合は未チェック項目の報告なしに実装完了を宣言する（ブロックなし）」手順が含まれることを検証する — files: `packages/cli/tests/claude-integration/implement-unchecked-report.test.ts`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-013
        Change: checklist-ai-driven-verification

### Implementation

- [ ] T123 `.claude/skills/mspec-implement/SKILL.md`（runtime）を修正 — 全タスク完了後のステップとして 3 分岐報告ロジックを追加する：`verify: human` 未チェックあり → 一覧提示 + 人間レビュー要求 + block、`verify: fr-NNN` 未チェックあり（gap）→ 対象 FR 一覧 + ギャップ説明 + 警告 block、未チェックゼロ → 実装完了宣言。T112 と同一ファイルへの追記 — files: `.claude/skills/mspec-implement/SKILL.md`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-013
        Change: checklist-ai-driven-verification

- [ ] T124 `packages/cli/templates/claude/skills/mspec-implement/SKILL.md`（template）を修正 — T112 + T123 適用済みの runtime ファイルと同一内容に更新する（`diff` で差分ゼロを確認） — files: `packages/cli/templates/claude/skills/mspec-implement/SKILL.md`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-012, FR-013
        Change: checklist-ai-driven-verification

## Phase 3: User Story 4 — FR-014: runtime / template の同期検証

### Tests-first (E2E)

- [ ] T130 E2E for FR-014 Scenario "Template and runtime skill contain identical verify procedure" — `diff .claude/agents/mspec-checklist-auditor.md packages/cli/templates/claude/agents/mspec-checklist-auditor.md` および `diff .claude/skills/mspec-implement/SKILL.md packages/cli/templates/claude/skills/mspec-implement/SKILL.md` がいずれも空（差分ゼロ）であることを検証するテスト — files: `packages/cli/tests/claude-integration/runtime-template-sync.test.ts`
      anchor:
        @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md
        Requirements implemented: FR-014
        Change: checklist-ai-driven-verification

### Implementation

(FR-014 の実装責務は T104 と T124 でカバー — T130 は検証のみ)

## Phase 4: Polish

- [ ] T201 [P] 全テストスイートを実行してリグレッションがないことを確認 — `npm test` を `packages/cli/` で実行し、既存テストが壊れていないことを検証する — files: `packages/cli/`

- [ ] T202 [P] `mspec validate --change 2026-05-14-105021-checklist-ai-driven-verification` を再実行して全アーティファクトが有効であることを確認。注意: `mspec anchor check` は `.md` ファイルの HTML コメントアンカーを現バージョンでは認識しない（T001 参照）。anchor check は `.md` ファイルを除外して実行するか、anchor check そのものはスキップとする

- [ ] T203 [P] runtime / template の最終 diff 確認 — `diff .claude/agents/mspec-checklist-auditor.md packages/cli/templates/claude/agents/mspec-checklist-auditor.md && diff .claude/skills/mspec-implement/SKILL.md packages/cli/templates/claude/skills/mspec-implement/SKILL.md` がいずれも空であることを確認（T130 E2E の補完） — files: `.claude/agents/mspec-checklist-auditor.md`, `packages/cli/templates/claude/agents/mspec-checklist-auditor.md`, `.claude/skills/mspec-implement/SKILL.md`, `packages/cli/templates/claude/skills/mspec-implement/SKILL.md`

## Dependencies

- T001 must be done before T010, T202 (HTML コメント対応確認が先)
- T002 must be done before T103, T112 (挿入位置特定が先)
- T010 blocks T103, T104, T112, T123, T124 (アンカーブロック付与が先)
- T101, T102 block T103
- T103 blocks T104
- T110, T111 block T112
- T112 blocks T123
- T120, T121, T122 block T123
- T123 blocks T124
- T104 blocks T130 (partially)
- T124 blocks T130 (partially)

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | tasks.md は design.md・checklist.md のみを入力とし、他ステップと独立している。`mspec-tasks` SKILL.md への変更なし |
| II. 決定論的マージ | ✅ | anchor ブロックは HTML コメントとして `.md` ファイルに記述され、archive パーサーの対象外。CLI TypeScript の archive / merge ロジックに触れない |
| III. 質問駆動の要件確定 | ✅ | 全 Open Questions（アノテーション形式・報告トーン・冪等性）は research/design で解決済み。tasks.md に未解決事項なし |
| IV. 双方向アンカー | ✅ (条件付き) | T010 で全 4 ファイルにアンカーブロックを付与済み。`mspec anchor check` の `.md` HTML コメント対応は T001 で非サポートと確認されるため、anchor check の `.md` ファイルへの適用は T202 で除外する（design.md Constitution IV 条件と一致） |
| V. 強制ステップと拡張ステップの分離 | ✅ | `workflow.yaml` の強制ステップ定義に触れない。tasks.md 自体は `mspec-tasks` スキルの手順変更を伴わない |

### Complexity Tracking

None — 違反 0 件。Skill / Agent Markdown ファイル 4 本の手順追加のみ。
