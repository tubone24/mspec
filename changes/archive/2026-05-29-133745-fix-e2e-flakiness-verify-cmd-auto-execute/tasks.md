---
doc_type: How-to
---

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-014 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

# Tasks: fix-e2e-flakiness-verify-cmd-auto-execute

## Phase 1: Setup

- [x] T1.1 — 現状確認: 全 `waitForTimeout()` 箇所と `vi.spyOn(process, 'cwd')` 箇所を一覧化し、置換計画を確認する
  - `grep -r "waitForTimeout" packages/web-ui/tests/e2e/` で件数を確認
  - `grep -rn "vi.spyOn.*cwd" packages/cli/tests/e2e/` で対象ファイルを確認

## Phase 2: Foundational

### FR-014 E2E テスト（RED フェーズ）

- [x] T2.1 — [E2E RED] verify:cmd Run ボタン表示の Playwright テストを追加する
  ```
  anchor:
    @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md
    Requirements implemented: FR-014
    Change: fix-e2e-flakiness-verify-cmd-auto-execute
  ```
  - `packages/web-ui/tests/e2e/checklist-verify-cmd-run.e2e.test.ts` を新規作成
  - Scenario「verify:cmd 項目に実行ボタンが表示される」「verify:fr のみ項目には実行ボタンが表示されない」をカバー
  - 実装前なのでテストが失敗（RED）することを確認 <!-- verify: fr-014 -->

- [x] T2.2 — [E2E RED] Run ボタンクリック → インライン結果表示の Playwright テストを追加する
  ```
  anchor:
    @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md
    Requirements implemented: FR-014
    Change: fix-e2e-flakiness-verify-cmd-auto-execute
  ```
  - Scenario「実行ボタンクリックでコマンド結果がインラインに表示される」「コマンド実行中はボタンが無効化される」をカバー
  - 実装前なのでテストが失敗（RED）することを確認 <!-- verify: fr-014 -->

### Playwright e2e 安定化（FR-001）

- [x] T2.3 — `spec-viewer.e2e.test.ts` の `waitForTimeout()` 10件を条件ベース待機に置換する
  ```
  anchor:
    @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md
    Requirements implemented: FR-001
    Change: fix-e2e-flakiness-verify-cmd-auto-execute
  ```
  - `waitForTimeout(3000)` × 2 → `await expect(locator).toBeVisible({ timeout: 8000 })`
  - `waitForTimeout(400)` × 5 → `await expect(locator).toBeVisible()` または `toHaveCount(n)`
  - `waitForTimeout(300)` × 1 → `await expect(allItems).toHaveCount(totalCount)`
  - `waitForTimeout(500)` × 1 → 削除（`networkidle` 後は不要）
  - `waitForTimeout(600)` × 2 → `await expect(locator).toBeVisible()`

- [x] T2.4 — 残り5ファイルの `waitForTimeout()` を条件ベース待機に置換する
  ```
  anchor:
    @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md
    Requirements implemented: FR-001
    Change: fix-e2e-flakiness-verify-cmd-auto-execute
  ```
  - `checklist-verify-human.e2e.test.ts`（4件）: `waitForTimeout(500)` → `await expect(locator).toBeVisible()`
  - `code-highlight.e2e.test.ts`（5件）: 同様に条件ベース待機に置換
  - `checklist-interactive.e2e.test.ts`（3件）: 同様に置換
  - `full-text-search.e2e.test.ts`（3件）: 同様に置換
  - `artifact-preview.e2e.test.ts`（1件）: 同様に置換

### vitest CLI e2e 安定化（FR-002）

- [x] T2.5 — `verify-llm.e2e.test.ts` の `vi.spyOn(process, 'cwd')` クリーンアップを完全化する
  ```
  anchor:
    @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md
    Requirements implemented: FR-002
    Change: fix-e2e-flakiness-verify-cmd-auto-execute
  ```
  - `it()` 内部で追加した `cwdSpy` が `spy.mockRestore()` を呼んでいることを確認し、漏れがあれば追加
  - `afterEach` に `vi.restoreAllMocks()` が存在しない場合は追加

- [x] T2.6 — `learn.e2e.test.ts` の `vi.spyOn(process, 'cwd')` クリーンアップを完全化する
  ```
  anchor:
    @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md
    Requirements implemented: FR-002
    Change: fix-e2e-flakiness-verify-cmd-auto-execute
  ```
  - `it()` 内部の各 `vi.spyOn(process, 'cwd')` に対して `spy.mockRestore()` を末尾に追加

## Phase 3: User Story

### POST /api/run-cmd ルート実装（FR-014）

- [x] T3.1 — `packages/cli/src/server/routes/runCmd.ts` を新規作成する
  ```
  anchor:
    @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md
    Requirements implemented: FR-014
    Change: fix-e2e-flakiness-verify-cmd-auto-execute
  ```
  - `POST /api/run-cmd` ハンドラを実装
  - `cmd` の最初のトークンが `mspec` でない場合は 403 を返す
  - `spawn(tokens[0], tokens.slice(1), { shell: false, cwd: root })` でコマンドを実行
  - `{ exitCode, stdout, stderr }` を JSON で返す <!-- verify: fr-014 -->

- [x] T3.2 — 両サーバーに `registerRunCmdRoute` を登録する
  ```
  anchor:
    @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md
    Requirements implemented: FR-014
    Change: fix-e2e-flakiness-verify-cmd-auto-execute
  ```
  - `packages/web-ui/tests/e2e/setup/api-server.ts` に `registerRunCmdRoute` の import と呼び出しを追加
  - 本番サーバー（`packages/cli/src/server/server-process.ts` または相当ファイル）にも同様に追加

### ArtifactViewer.tsx の Run ボタン追加（FR-014）

- [x] T3.3 — `packages/web-ui/src/components/ArtifactViewer.tsx` の `li` コンポーネントに Run ボタンを追加する（GREEN フェーズ）
  ```
  anchor:
    @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md
    Requirements implemented: FR-014
    Change: fix-e2e-flakiness-verify-cmd-auto-execute
  ```
  - `extractVerifyCmd(node)` 関数を追加して `.md-comment` スパンから `verify: cmd:<cmd>` を抽出
  - `useState<{ exitCode: number; stdout: string; stderr: string } | null>` と `useState<boolean>` を li スコープに追加
  - Run ボタン（`disabled={running}`）と結果表示 `<pre>` をアンバーハイライト li 内に描画
  - T2.1/T2.2 の E2E テストが通過（GREEN）することを確認 <!-- verify: fr-014 -->

## Phase 4: Polish

- [x] T4.1 — e2e テストスイートを 3 回連続実行して結果の安定性を確認する
  ```
  anchor:
    @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md
    Requirements implemented: FR-003
    Change: fix-e2e-flakiness-verify-cmd-auto-execute
  ```
  - `vitest run` を 3 回実行し pass/skip/fail 件数が全回一致することを確認
  - `playwright test` を 3 回実行し同様に一致することを確認

- [x] T4.2 — mspec anchor check と validate を実行してアーティファクト整合性を確認する
  - `mspec anchor check --change 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute`
  - `mspec validate --change 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute`

## Constitution Check

### Phase 0 — Pre-Implementation

| # | Principle | Status | Note |
|---|-----------|--------|------|
| I | ステップ独立性 | ✅ pass | tasks.md は design.md のみ参照して生成 |
| II | 決定論的マージ | ✅ pass | anchor ブロックで FR-ID と capability を明示 |
| III | 質問駆動の要件確定 | ✅ pass | 全 FR が確定済み。未解決の設計疑問なし |
| IV | 双方向アンカー | ✅ pass | 全タスクに anchor ブロック付与。実装ファイルへのアンカーは T2-T3 フェーズで付与 |
| V | 強制/拡張ステップの分離 | ✅ pass | tasks ステップは強制ステップとして独立 |
| VI | Security by Default | ✅ pass | T3.1 に `mspec` プレフィックス限定・`shell:false` を明記 |
| VII | 設計意図と実装の対応確認 | ✅ pass | Decisions テーブルの各決定が対応タスクにトレーサブル |
