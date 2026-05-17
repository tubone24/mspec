---
doc_type: Reference
---

# Tasks: 目的別チェンジモード（typo / minor / bugfix）

以下のステップを承認後に TaskCreate でタスク登録し、完了ごとに TaskUpdate で更新する。

## Phase 1: Setup

- [x] T001 [P] `src/lib/readme-parser.ts` 新設 — `parseMode(content: string): string | null` を実装（`> Mode: <value>` のブロッククォート行を regex でパース）— files: `packages/cli/src/lib/readme-parser.ts`, `packages/cli/src/lib/readme-parser.test.ts`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md
        Requirements implemented: FR-018, FR-019, FR-020
        Change: lightweight-change-mode

## Phase 2: Foundational（CLI 型定義・エンジン改修）

### Tests-first (Unit)

- [x] T010 Unit test: `WorkflowSchema` が `modes:` フィールドを受け付け、未定義の場合も通過することを検証 — files: `packages/cli/src/types/workflow.test.ts`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-019, FR-021
        Change: lightweight-change-mode

- [x] T012 Unit test: `evaluateStep()` がモード由来スキップ対象のステップを `'skipped'` として返し、後続ステップが `'ready'` になることを検証 — files: `packages/cli/src/lib/state-engine.test.ts`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-019, FR-020
        Change: lightweight-change-mode

- [x] T014 Unit test: `continueCommand()` が readme.md の `> Mode:` を読んで `computeStatus()` に渡すことを検証 — files: `packages/cli/src/commands/continue.test.ts`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-019, FR-020
        Change: lightweight-change-mode

- [x] T016 Unit test: `skipCommand()` が `bugfix` モードで `force` リストに含まれるステップへの skip を拒否することを検証 — files: `packages/cli/src/commands/skip.test.ts`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-021
        Change: lightweight-change-mode

### Implementation

- [x] T011 `packages/cli/src/types/workflow.ts` に `ModeRuleSchema`（`skip: string[]`, `force: string[]`）と `WorkflowSchema.modes` (`z.record(ModeRuleSchema).optional()`) を追加 — files: `packages/cli/src/types/workflow.ts`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-019, FR-021
        Change: lightweight-change-mode

- [x] T013 `packages/cli/src/lib/state-engine.ts` の `evaluateStep()` に `isModeDrivenSkip(mode, step.id, workflow.modes)` を `isSkipped()` 呼び出しの直前に追加。`ComputeStatusInput` に `mode?: string | null` フィールドを追加 — files: `packages/cli/src/lib/state-engine.ts`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-019, FR-020
        Change: lightweight-change-mode

- [x] T015 `packages/cli/src/commands/continue.ts` の `continueCommand()` で、`computeStatus()` 呼び出し前に readme.md をパースして `parseMode()` を呼び、`mode` を `computeStatus()` に渡す — files: `packages/cli/src/commands/continue.ts`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-019, FR-020
        Change: lightweight-change-mode

- [x] T017 `packages/cli/src/commands/skip.ts` の `skipCommand()` に force チェックを追加：readme.md を読んで `parseMode()` を呼び、mode が `bugfix` かつ step が `workflow.modes.bugfix.force` に含まれる場合に `Error: bugfix モードでは <stepId> は必須です` を throw — files: `packages/cli/src/commands/skip.ts`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-021
        Change: lightweight-change-mode

## Phase 3: User Story 1 — mspec:new モード推定（claude-integration FR-018）

### Tests-first (手動検証)

- [x] T101 手動検証: `mspec-new/SKILL.md` 修正後に `/mspec:new コメント内の typo を修正したい` を実行し、スキルが `typo モードと判断しました。正しいですか？` と確認してから readme.md に `> Mode: typo` を書き込むことを確認 — files: `packages/cli/templates/claude/skills/mspec-new/SKILL.md`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md
        Requirements implemented: FR-018
        Change: lightweight-change-mode

### Implementation

- [x] T102 `packages/cli/templates/claude/skills/mspec-new/SKILL.md` の Procedure に以下を追加（`mspec new` 実行・readme.md 作成後）：(a) 説明文からモードを AI 推定、(b) AskUserQuestion で確認、(c) `> Mode: <value>` を readme.md に追記。`--mode` 明示時は (a)(b) をスキップ。フルフロー対象の場合は Mode フィールドを書かない — files: `packages/cli/templates/claude/skills/mspec-new/SKILL.md`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md
        Requirements implemented: FR-018
        Change: lightweight-change-mode

## Phase 3: User Story 2 — スキルモードスキップ（claude-integration FR-019）

### Tests-first (手動検証)

- [x] T103 手動検証: typo モードのチェンジで `/mspec:proposal` を実行し、スキルが成果物を生成せず終了して `## Skipped Steps` にスキップ記録が追記されることを確認 — files: `packages/cli/templates/claude/skills/mspec-proposal/SKILL.md`, `packages/cli/templates/claude/skills/mspec-quickstart/SKILL.md`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md
        Requirements implemented: FR-019
        Change: lightweight-change-mode

### Implementation

- [x] T104 `packages/cli/templates/claude/skills/mspec-proposal/SKILL.md` の Procedure 先頭に「readme.md の `Mode:` フィールドを読んでスキップリストに含まれる場合は成果物を生成せず `## Skipped Steps` に記録して終了する」手順を追加 — files: `packages/cli/templates/claude/skills/mspec-proposal/SKILL.md`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md
        Requirements implemented: FR-019
        Change: lightweight-change-mode

- [x] T105 `packages/cli/templates/claude/skills/mspec-quickstart/SKILL.md` に同様のモードスキップ判定手順を追加 — files: `packages/cli/templates/claude/skills/mspec-quickstart/SKILL.md`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md
        Requirements implemented: FR-019
        Change: lightweight-change-mode

## Phase 4: Polish（テンプレート・デフォルト設定）

- [x] T201 `packages/cli/templates/workflow.default.yaml` にトップレベルの `modes:` セクションを追加（typo/minor/bugfix の skip と force を定義）— files: `packages/cli/templates/workflow.default.yaml`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-019, FR-021
        Change: lightweight-change-mode

- [x] T202 `packages/cli/templates/artifacts/readme.md` のフロントマターブロックに `> Mode: <typo|minor|bugfix>（省略可）` のドキュメントを追加 — files: `packages/cli/templates/artifacts/readme.md`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md
        Requirements implemented: FR-018
        Change: lightweight-change-mode

- [x] T203 Unit test: `readme.md` に `Mode:` フィールドがない既存チェンジで `computeStatus()` が全ステップをスキップなしで実行することを検証（後方互換テスト）— files: `packages/cli/src/lib/state-engine.test.ts`
      anchor:
        @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-020
        Change: lightweight-change-mode

## Dependencies

- T010 blocks T011（スキーマ検証が通ってから実装）
- T012 blocks T013（state-engine テストが通ってから実装）
- T014 blocks T015（continue テストが通ってから実装）
- T016 blocks T017（skip テストが通ってから実装）
- T001 blocks T012, T014, T016（parseMode が必要）
- T011 blocks T013（ModeRuleSchema が必要）
- T101 blocks T102（手動検証仕様確認後に SKILL.md を修正）
- T103 blocks T104, T105（手動検証仕様確認後に SKILL.md を修正）
- T011, T013, T015 blocks T201（型・エンジン・コマンドが揃ってからデフォルト定義を追加）

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | `parseMode()` は毎回 readme.md を読む。前段コンテキスト不依存 |
| II. 決定論的マージ | ✅ | — | `modes:` はメタデータのみ。マージロジックに触れない |
| III. 質問駆動の要件確定 | ✅ | — | T101/T103 の手動検証で AskUserQuestion 1問確認を要件として明記 |
| IV. 双方向アンカー | ✅ | — | 全実装タスク・E2E タスクに `@mspec-delta` アンカーブロックを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | `REQUIRED_STEP_IDS` 不変。proposal の論理スキップは skip-log 不経由の lazy スキップとして実現 |

### Complexity Tracking

None
