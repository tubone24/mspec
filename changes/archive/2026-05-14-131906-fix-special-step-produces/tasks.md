---
doc_type: Reference
---

# Tasks: fix-special-step-produces

## Phase 1: Setup

- [ ] T001 [P] `skip-log.ts` と `state-engine.ts` の現行実装を確認 — `packages/cli/src/lib/skip-log.ts` の `SkipEntry`・`SkipLog`・`loadSkipLog`・`recordSkip`・`isSkipped` の型と実装パターンを把握し、`done-log.ts` の対称実装の挿入点を決定する。`state-engine.ts:63-78` の `produces.length === 0` 分岐（常に `'ready'` を返すバグ箇所）と `ComputeStatusInput` インターフェース（L14-18）の変更スコープを確認する — files: `packages/cli/src/lib/skip-log.ts`, `packages/cli/src/lib/state-engine.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-state-engine/spec.md
        Requirements implemented: FR-001, FR-002
        Change: fix-special-step-produces

- [ ] T002 [P] `skip.ts` コマンドと `index.ts` の `done` コマンド登録位置確認 — `packages/cli/src/commands/skip.ts` の `SkipOptions` インターフェースと `skipCommand` 関数シグネチャを把握し、`done.ts` の実装テンプレートとして使用する。`index.ts` の `skip` コマンド登録箇所（`program.command('skip <step-id>')`）を特定し、`done` コマンド追加位置を決定する — files: `packages/cli/src/commands/skip.ts`, `packages/cli/src/index.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-001, FR-003, FR-004
        Change: fix-special-step-produces

## Phase 2: Foundational

- [ ] T010 `packages/cli/src/lib/done-log.ts` を新規作成 — `skip-log.ts` と完全対称な実装として以下を含む：`DoneEntry { done_at: string }`、`DoneLog = Record<string, Record<string, DoneEntry>>`、`doneLogPath(paths)`、`loadDoneLog(paths)`、`recordDone(paths, changeName, stepId)`、`isDone(log, changeName, stepId)`。ファイルパスは `join(paths.cacheDir, 'done-log.json')`。`mkdir(dirname(p), { recursive: true })` で cache dir を自動作成する — files: `packages/cli/src/lib/done-log.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-001, FR-002
        Change: fix-special-step-produces

## Phase 3: User Story 1 — cli-done-log FR-001/FR-002: done-log.json への upsert 記録とスキーマ

### Tests-first (E2E)

- [ ] T101 E2E for FR-001 Scenario "implement ステップを done に記録する" — `done-log.json` が存在しない状態で `recordDone(paths, changeName, 'implement')` を呼び出し、`.mspec/cache/done-log.json` に `{ changeName: { implement: { done_at: "<ISO8601>" } } }` の形式でエントリが書き込まれることを検証する — files: `packages/cli/tests/e2e/done-log.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-001
        Change: fix-special-step-produces

- [ ] T102 E2E for FR-001 Scenario "同一ステップへの 2 回目実行（idempotency）" — 既存の `done-log.json` に `implement` エントリがある状態で `recordDone` を再度呼び出し、エラーなく完了し、`done_at` タイムスタンプが新しい値で上書きされることを検証する（古い値が消え新しい値が存在する） — files: `packages/cli/tests/e2e/done-log.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-001
        Change: fix-special-step-produces

- [ ] T103 E2E for FR-002 Scenario "skip-log.json との対称的な構造" — `loadDoneLog` が返すオブジェクトの型が `Record<string, Record<string, { done_at: string }>>` のネストオブジェクト形式であることを TypeScript 型レベルで確認し、`skip-log.json` の `{ changeName: { stepId: { reason, skipped_at } } }` と同一階層構造になっていることを assertion で検証する — files: `packages/cli/tests/e2e/done-log.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-002
        Change: fix-special-step-produces

### Implementation

(T010 で `done-log.ts` を実装済み — T101/T102/T103 が GREEN になることを確認する)

## Phase 3: User Story 2 — cli-done-log FR-003/FR-004: mspec done コマンド

### Tests-first (E2E)

- [ ] T110 E2E for FR-003 Scenario "produces を持つステップへの誤用" — `produces: ['proposal.md']` を持つステップに対して `doneCommand('proposal', ...)` を実行し、エラーメッセージ `"mspec done は produces が空のステップにのみ使用できます"` がスローされ、`done-log.json` が更新されないことを検証する — files: `packages/cli/tests/e2e/done-command.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-003
        Change: fix-special-step-produces

- [ ] T111 E2E for FR-003 バイト同一性検証 — `done-log.json` が既に存在する状態でガードエラーが発生した場合、ファイルが変更されていないこと（pre/post のバイト比較）を検証する — files: `packages/cli/tests/e2e/done-command.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-003
        Change: fix-special-step-produces

- [ ] T112 E2E for FR-004 Scenario "implement ステップの done 前バリデーション（正常系）" — validate が成功する状態（アンカー証跡あり）で `doneCommand('implement', ...)` を実行し、`done-log.json` に `implement` エントリが保存されることを検証する — files: `packages/cli/tests/e2e/done-command.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-004
        Change: fix-special-step-produces

- [ ] T113 E2E for FR-004 Scenario "implement ステップの done 前バリデーション（異常系）" — validate がエラーを返す状態（アンカー不足）で `doneCommand('implement', ...)` を実行し、エラーメッセージが表示され `done-log.json` が更新されないことを検証する — files: `packages/cli/tests/e2e/done-command.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-004
        Change: fix-special-step-produces

### Implementation

- [ ] T114 `packages/cli/src/commands/done.ts` を新規作成 — `skip.ts` を参考に `DoneOptions { change?: string }`・`doneCommand(stepId, opts)` を実装する。ガードロジック：`step.produces.length > 0` のときエラー。`implement` ステップのみ `validateCommand` を内部実行し失敗時は `done-log.json` を更新せずにエラー終了。正常系は `recordDone(paths, change.name, stepId)` を呼び出す — files: `packages/cli/src/commands/done.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-001, FR-003, FR-004
        Change: fix-special-step-produces

- [ ] T115 `packages/cli/src/index.ts` に `done` コマンドを登録 — `skipCommand` のインポート直後に `doneCommand` をインポートし、`skip` コマンド登録の直後に `program.command('done <step-id>').description('Mark a produces-less step as done').option('--change <name>', '...').action(doneCommand)` を追加する — files: `packages/cli/src/index.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
        Requirements implemented: FR-001
        Change: fix-special-step-produces

## Phase 3: User Story 3 — cli-state-engine FR-001/FR-002: state-engine の done-log 統合

### Tests-first (E2E)

- [ ] T120 E2E for cli-state-engine FR-001 Scenario "done-log に記録済みの produces レスステップ" — `implement` ステップが `produces: []` のワークフローで `.mspec/cache/done-log.json` に `implement` エントリを書き込んだ状態で `computeStatus` を呼び出し、`implement` ステップの `state` が `'done'` であることを検証する — files: `packages/cli/tests/e2e/state-engine-produces-less.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-state-engine/spec.md
        Requirements implemented: FR-001
        Change: fix-special-step-produces

- [ ] T121 E2E for cli-state-engine FR-002 Scenario "done-log に未記録の produces レスステップ" — `implement` ステップが `produces: []` のワークフローで `done-log.json` に `implement` エントリが存在しない（ファイルなし）状態で `computeStatus` を呼び出し、前ステップが done 済みのとき `implement` の `state` が `'ready'` であることを検証する — files: `packages/cli/tests/e2e/state-engine-produces-less.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-state-engine/spec.md
        Requirements implemented: FR-002
        Change: fix-special-step-produces

- [ ] T122 E2E for cli-state-engine FR-002 file-not-found パス — `done-log.json` ファイル自体が存在しない（`.mspec/cache/` が空）場合でも `'ready'` が返される（エラーにならない）ことを検証する — files: `packages/cli/tests/e2e/state-engine-produces-less.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-state-engine/spec.md
        Requirements implemented: FR-002
        Change: fix-special-step-produces

### Implementation

- [ ] T123 `packages/cli/src/lib/state-engine.ts` を修正 — `ComputeStatusInput` に `doneLog: DoneLog` フィールドを追加（省略可能なデフォルトは `{}`）。`evaluateStep` 関数内の `produces.length === 0` 分岐（L74-78）を以下に変更：`isDone(doneLog, change.name, step.id)` が `true` なら `'done'`、`false` なら `'ready'` を返す。`loadDoneLog` と `isDone` を `done-log.ts` からインポートする — files: `packages/cli/src/lib/state-engine.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-state-engine/spec.md
        Requirements implemented: FR-001, FR-002
        Change: fix-special-step-produces

- [ ] T124 `packages/cli/src/commands/status.ts` を修正 — `loadSkipLog` 呼び出しの直後に `loadDoneLog(paths)` を並走追加し、`computeStatus({ workflow, change, skipLog, doneLog })` に渡す — files: `packages/cli/src/commands/status.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-state-engine/spec.md
        Requirements implemented: FR-001, FR-002
        Change: fix-special-step-produces

- [ ] T125 `packages/cli/src/commands/continue.ts` を修正 — `loadSkipLog` 呼び出しの直後に `loadDoneLog(paths)` を並走追加し、`computeStatus({ workflow, change, skipLog, doneLog })` に渡す — files: `packages/cli/src/commands/continue.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-state-engine/spec.md
        Requirements implemented: FR-001, FR-002
        Change: fix-special-step-produces

## Phase 3: User Story 4 — cli-workflow-engine FR-018: skippable: true の削除

### Tests-first (E2E)

- [ ] T130 E2E for FR-018 Scenario "workflow.yaml の skippable フラグ削除" — `.mspec/workflow.yaml` を読み込み、`implement`・`archive`・`self-review` ステップの `skippable` プロパティが `undefined` または `false` であることを検証する。`research`・`quickstart`・`checklist` の `skippable: true` が維持されていることも同時に検証する — files: `packages/cli/tests/e2e/workflow-skippable.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-018
        Change: fix-special-step-produces

- [ ] T131 E2E for FR-018 — `mspec skip implement` が `skip.ts:23` のガード（`!step.skippable`）によって拒否されることを検証する（`skippable: true` 削除後のリグレッション確認） — files: `packages/cli/tests/e2e/workflow-skippable.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-018
        Change: fix-special-step-produces

### Implementation

- [ ] T132 `.mspec/workflow.yaml` を修正 — `implement`・`archive`・`self-review` ステップの `skippable: true` 行を削除する（3 箇所）。`research`・`quickstart`・`checklist` の `skippable: true` は維持する — files: `.mspec/workflow.yaml`
      anchor:
        @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-018
        Change: fix-special-step-produces

## Phase 4: Polish

- [ ] T201 [P] 全テストスイートを実行してリグレッションがないことを確認 — `npm test` を `packages/cli/` で実行し、既存テストが壊れていないことを検証する — files: `packages/cli/`

- [ ] T202 [P] `mspec validate --change 2026-05-14-131906-fix-special-step-produces` を実行して全アーティファクトが有効であることを確認する

- [ ] T203 [P] `mspec anchor check --change 2026-05-14-131906-fix-special-step-produces` を実行し、新規ファイル（`done-log.ts`・`done.ts`・`state-engine.ts`・`state-engine-produces-less.e2e.test.ts`・`done-log.e2e.test.ts`・`done-command.e2e.test.ts`・`workflow-skippable.e2e.test.ts`）のアンカーブロックが orphan なしで正しく解決されることを確認する

## Dependencies

- T001・T002 must be done before T010, T114 (パターン確認が先)
- T010 blocks T101, T102, T103 (done-log.ts が先)
- T101, T102, T103 block T114 (テストが GREEN になってから実装確認)
- T110, T111, T112, T113 block T114, T115 (done コマンドのテストが先)
- T120, T121, T122 block T123 (state-engine テストが先)
- T123 blocks T124, T125 (state-engine.ts 変更が先)
- T130, T131 block T132 (workflow テストが先)
- T114, T115, T123, T124, T125, T132 block T201, T202, T203

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | `done-log.ts` は独立モジュール。`state-engine.ts` への変更は `doneLog` パラメータ追加のみで既存呼び出し元への後方互換性を維持（デフォルト `{}`） |
| II. 決定論的マージ | ✅ | `done-log.json` は `.mspec/cache/` に配置され archive マージ対象外。`tasks.md` 自体は `changes/` 配下の Delta Spec マージ対象外 |
| III. 質問駆動の要件確定 | ✅ | BLOCKER-1〜4 はすべて self-review フェーズで解決済み（design.md Self-Review 参照）。tasks.md に未解決の設計判断なし |
| IV. 双方向アンカー | ✅ | 全実装タスク・全 E2E テストタスクに 3 行アンカーブロックを付与済み。新規ファイル 7 本それぞれに対応 FR-ID を記載 |
| V. 強制ステップと拡張ステップの分離 | ✅ | T132 で `implement`・`archive`・`self-review` の `skippable: true` を削除し強制/拡張の境界を明確化。`removable` フラグと `workflow.ts` 型スキーマには触れない |

### Complexity Tracking

None — 違反 0 件。新規ファイル 2 本（`done-log.ts`・`done.ts`）・既存ファイル 5 本修正・workflow.yaml 3 行削除。
