---
doc_type: Reference
---

# Tasks: step-checkbox-update

## Phase 1: Setup

- [ ] T001 [P] 全 9 ランタイム Skill / Agent ファイルの現行 Procedure を読み、各ファイルへの挿入位置（ステップ番号と前後のテキスト）を把握する — files: `.claude/skills/mspec-proposal/SKILL.md`, `.claude/skills/mspec-delta/SKILL.md`, `.claude/skills/mspec-research/SKILL.md`, `.claude/skills/mspec-design/SKILL.md`, `.claude/skills/mspec-quickstart/SKILL.md`, `.claude/skills/mspec-checklist/SKILL.md`, `.claude/skills/mspec-tasks/SKILL.md`, `.claude/skills/mspec-implement/SKILL.md`, `.claude/agents/mspec-checklist-auditor.md`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-015, FR-016
        Change: step-checkbox-update

- [ ] T002 [P] `mspec anchor check` の `.md` HTML コメント対応を確認 — `packages/cli/src/parser/anchor.ts` の実装を読んで、`.md` ファイルの `<!-- @mspec-delta ... -->` 形式アンカーが正しく認識されるかを確認する。認識されない場合は T202 の anchor check 対象から `.md` ファイルを除外する — files: `packages/cli/src/parser/anchor.ts`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-015, FR-016
        Change: step-checkbox-update

## Phase 2: Foundational

- [ ] T010 [P] 全 18 ファイルに `@mspec-delta` アンカーブロックを付与 — 各 Markdown ファイルの YAML frontmatter 直後（または本文先頭）に HTML コメント形式で 3 行アンカーブロックを追加する。7 step skills runtime + template: `FR-015`。`mspec-implement` runtime + template: `FR-016`。`mspec-checklist-auditor` runtime + template: `FR-011`。計 18 ファイル — files: `.claude/skills/mspec-*/SKILL.md`, `.claude/agents/mspec-checklist-auditor.md`, `packages/cli/templates/claude/skills/mspec-*/SKILL.md`, `packages/cli/templates/claude/agents/mspec-checklist-auditor.md`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-015, FR-016, FR-011
        Change: step-checkbox-update

## Phase 3: User Story 1 — FR-015: 各 mspec スキルステップが readme.md Artifacts チェックボックスを更新する

### Tests-first (E2E)

- [ ] T101 E2E for FR-015 Scenario "Proposal step marks its artifact as done" — `.claude/skills/mspec-proposal/SKILL.md` の Procedure に「`readme.md` の `## Artifacts` 節の `- [ ] proposal.md` を `- [x] proposal.md` に更新する」指示が含まれること、および `mspec validate` 失敗時のロールバック指示が含まれることを grep で検証する — files: `packages/cli/tests/e2e/readme-artifacts-checkbox.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-015
        Change: step-checkbox-update

- [ ] T102 E2E for FR-015 Scenario "Delta step marks its specs artifact as done" — `.claude/skills/mspec-delta/SKILL.md` の Procedure に「`readme.md` の `## Artifacts` 節の `- [ ] specs/*/spec.md` 行を `- [x]` に更新する」指示が含まれること、および validate 失敗時のロールバック指示が含まれることを grep で検証する — files: `packages/cli/tests/e2e/readme-artifacts-checkbox.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-015
        Change: step-checkbox-update

- [ ] T103 E2E for FR-015 各スキルの他 Artifacts 行不変確認 — `mspec-research`・`mspec-design`・`mspec-quickstart`・`mspec-checklist`・`mspec-tasks` の各 SKILL.md に「対応する 1 行のみを更新し、他の Artifacts 行は変更しない」旨が記述されていることを検証する — files: `packages/cli/tests/e2e/readme-artifacts-checkbox.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-015
        Change: step-checkbox-update

### Implementation

- [ ] T104 `.claude/skills/mspec-proposal/SKILL.md`（runtime）を修正 — Step 5（`proposal.md` 書き込み）の直後、Step 6 の Constitution Check の前に以下を追加：`readme.md` の `## Artifacts` 節の `- [ ] proposal.md` を `- [x] proposal.md` に更新し、`mspec validate` が失敗した場合は `- [ ]` にロールバックする手順 — files: `.claude/skills/mspec-proposal/SKILL.md`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-015
        Change: step-checkbox-update

- [ ] T105 `.claude/skills/mspec-delta/SKILL.md`, `.claude/skills/mspec-research/SKILL.md`, `.claude/skills/mspec-quickstart/SKILL.md`, `.claude/skills/mspec-checklist/SKILL.md`, `.claude/skills/mspec-tasks/SKILL.md`（runtime 5 本）を修正 — 各ファイルの成果物書き込みステップ直後、`mspec validate` 実行ステップの直前に Artifacts 更新手順を挿入する。対象行はそれぞれ `- [ ] specs/*/spec.md (Delta Spec)`, `- [ ] research.md`, `- [ ] quickstart.md`, `- [ ] checklist.md`, `- [ ] tasks.md` — files: `.claude/skills/mspec-delta/SKILL.md`, `.claude/skills/mspec-research/SKILL.md`, `.claude/skills/mspec-quickstart/SKILL.md`, `.claude/skills/mspec-checklist/SKILL.md`, `.claude/skills/mspec-tasks/SKILL.md`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-015
        Change: step-checkbox-update

- [ ] T106 `.claude/skills/mspec-design/SKILL.md`（runtime）を修正 — Step 4（`architecture-overview.md` 書き込み完了）の直後、Step 5 の Constitution Check 再評価の前に「`design.md` と `architecture-overview.md` の**両方**が書き込まれた後に `- [ ] design.md / architecture-overview.md` を `- [x]` に更新し、validate 失敗時はロールバック」する手順を追加 — files: `.claude/skills/mspec-design/SKILL.md`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-015
        Change: step-checkbox-update

- [ ] T107 CLI テンプレート 7 本を runtime と同一内容に更新 — `diff` コマンドで差分ゼロを確認しながら、T104〜T106 で適用した変更を対応する `packages/cli/templates/claude/skills/` 配下の各 SKILL.md に反映する — files: `packages/cli/templates/claude/skills/mspec-proposal/SKILL.md`, `packages/cli/templates/claude/skills/mspec-delta/SKILL.md`, `packages/cli/templates/claude/skills/mspec-research/SKILL.md`, `packages/cli/templates/claude/skills/mspec-design/SKILL.md`, `packages/cli/templates/claude/skills/mspec-quickstart/SKILL.md`, `packages/cli/templates/claude/skills/mspec-checklist/SKILL.md`, `packages/cli/templates/claude/skills/mspec-tasks/SKILL.md`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-015
        Change: step-checkbox-update

## Phase 3: User Story 2 — FR-016: mspec-implement がタスク GREEN 時に tasks.md チェックボックスを更新する

### Tests-first (E2E)

- [ ] T110 E2E for FR-016 Scenario "Task goes GREEN, tasks.md checkbox is checked" — `.claude/skills/mspec-implement/SKILL.md` の Step 3 配下（`--expect-green` 成功後の処理）に「`tasks.md` の `- [ ] TNNN: …` 行を `- [x] TNNN: …` に更新する（冪等）」指示が含まれることを grep で検証する — files: `packages/cli/tests/e2e/tasks-checkbox-update.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-016
        Change: step-checkbox-update

- [ ] T111 E2E for FR-016 Scenario "Partial task completion does not mark checkbox" — `.claude/skills/mspec-implement/SKILL.md` に「テストが 1 件でも FAIL の場合は `tasks.md` の `- [ ] TNNN` 行を変更しない」という条件分岐の指示が含まれることを検証する — files: `packages/cli/tests/e2e/tasks-checkbox-update.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-016
        Change: step-checkbox-update

### Implementation

- [ ] T112 `.claude/skills/mspec-implement/SKILL.md`（runtime）を修正 — Step 3 の既存 `--expect-green` ロジック（`checklist.md` 自動チェック行）の直後に「`tasks.md` の `- [ ] TNNN` を `- [x] TNNN` に更新する（全テスト GREEN の場合のみ、冪等）」手順を追加する — files: `.claude/skills/mspec-implement/SKILL.md`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-016
        Change: step-checkbox-update

- [ ] T113 `packages/cli/templates/claude/skills/mspec-implement/SKILL.md`（template）を修正 — T112 適用済みの runtime ファイルと同一内容に更新する（`diff` で差分ゼロを確認） — files: `packages/cli/templates/claude/skills/mspec-implement/SKILL.md`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-016
        Change: step-checkbox-update

## Phase 3: User Story 3 — FR-011 強化: mspec-checklist-auditor が全項目に verify: アノテーションを付与・自己検証する

### Tests-first (E2E)

- [ ] T120 E2E for FR-011 Scenario "Auditor self-validates that no item is left unannotated" — `.claude/agents/mspec-checklist-auditor.md` の `## Constraints` 節に「全項目書き込み後に `verify:` アノテーションなし行をスキャンし、残存行に `<!-- verify: human -->` を付与してから完了を宣言する」自己検証ルールが含まれることを grep で検証する — files: `packages/cli/tests/e2e/checklist-auditor-self-validate.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-011
        Change: step-checkbox-update

### Implementation

- [ ] T121 `.claude/agents/mspec-checklist-auditor.md`（runtime）を修正 — `## Constraints` 節の末尾に以下を追加：「全項目書き込み後に `verify:` アノテーションなし行を再スキャンし、残存行がある場合は `<!-- verify: human -->` を付与してから完了を宣言する。残存行ゼロの場合はそのまま完了宣言する」 — files: `.claude/agents/mspec-checklist-auditor.md`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-011
        Change: step-checkbox-update

- [ ] T122 `packages/cli/templates/claude/agents/mspec-checklist-auditor.md`（template）を修正 — T121 適用済みの runtime ファイルと同一内容に更新する（`diff` で差分ゼロを確認） — files: `packages/cli/templates/claude/agents/mspec-checklist-auditor.md`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-011
        Change: step-checkbox-update

## Phase 3: User Story 4 — FR-014: runtime / template 全 9 ペアの同期検証

### Tests-first (E2E)

- [ ] T130 E2E for FR-014 Scenario "Template and runtime skill contain identical verify procedure" — 全 9 ペアに対して `diff` を実行し、すべて差分ゼロであることを検証するテストを書く — files: `packages/cli/tests/e2e/runtime-template-sync.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md
        Requirements implemented: FR-014
        Change: step-checkbox-update

### Implementation

（FR-014 の実装責務は T107・T113・T122 でカバー — T130 は検証のみ）

## Phase 4: Polish

- [ ] T201 [P] 全テストスイートを実行してリグレッションがないことを確認 — `packages/cli/` で `npm test` を実行し、既存テストが壊れていないことを検証する — files: `packages/cli/`

- [ ] T202 [P] `mspec validate --change 2026-05-15-040857-step-checkbox-update` を再実行して全アーティファクトが有効であることを確認。T002 の確認結果に応じて `mspec anchor check` の `.md` ファイル対象可否を判断する

- [ ] T203 [P] 全 9 ペアの最終 diff 確認 — `diff` で runtime / template 全ペアの差分がゼロであることを確認する（T130 E2E の補完確認）

## Dependencies

- T001 must be done before T104〜T106（挿入位置の把握が先）
- T002 must be done before T202（anchor check 対象判断が先）
- T010 blocks T104〜T107, T112, T113, T121, T122（アンカーブロック付与が先）
- T101, T102, T103 block T104〜T106（E2E が RED であることを確認してから実装）
- T104 blocks T107（runtime 完成後に template を同期）
- T105 blocks T107（同上）
- T106 blocks T107（同上）
- T110, T111 block T112
- T112 blocks T113
- T120 blocks T121
- T121 blocks T122
- T107, T113, T122 block T130

## Constitution Check

> Step: tasks | Constitution Version: 1.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | tasks.md は design.md・checklist.md のみを入力とし、他ステップと独立している。`mspec-tasks` SKILL.md 自体への変更は T105 でスコープ内に含まれるが、tasks.md 生成ステップの独立性は侵害しない |
| II. 決定論的マージ | ✅ | anchor ブロックは HTML コメントとして `.md` ファイルに記述され、archive パーサーの対象外。CLI TypeScript の archive / merge ロジックに触れない |
| III. 質問駆動の要件確定 | ✅ | 全 Open Questions（validate 失敗時のロールバック・design 2 ファイルタイミング・specs/* 行の 1 行更新）は research ステップの Q&A で解決済み。tasks.md に未解決事項なし |
| IV. 双方向アンカー | ✅ | T010 で全 18 ファイルにアンカーブロックを付与する。各実装タスクの anchor ブロックに対応 FR を明示 |
| V. 強制ステップと拡張ステップの分離 | ✅ | `workflow.yaml` の強制ステップ定義に触れない。既存スキルへの Procedure 追加のみであり、新ステップ・新スキルの追加なし |

### Complexity Tracking

None — 違反 0 件。Skill / Agent Markdown ファイル 18 本の手順追加・同期のみ。
