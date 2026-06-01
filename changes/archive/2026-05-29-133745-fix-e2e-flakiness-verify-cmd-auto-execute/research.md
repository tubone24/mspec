---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-014 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

# Research: fix-e2e-flakiness-verify-cmd-auto-execute

## Decisions

### e2e-stability FR-001: waitForTimeout 置換戦略

| パターン | 現在の箇所 | 置換後 |
|---|---|---|
| `waitForTimeout(500)` — networkidle 後の安定待機 | checklist-verify-human, checklist-interactive 等 | 削除（`networkidle` 後は不要） |
| `waitForTimeout(400)` — debounce 後の結果待機 | spec-viewer の検索フィルタ等 | `await expect(locator).toBeVisible()` または `toHaveCount(n)` |
| `waitForTimeout(300)` — debounce リセット待機 | spec-viewer の clear ボタン後 | `await expect(allItems).toHaveCount(totalCount)` |
| `waitForTimeout(3000)` — 検索インデックスビルド待機 | spec-viewer T2.1/T2.3 | `await expect(locator).toBeVisible({ timeout: 8000 })` |
| `waitForTimeout(1000)` — コードハイライト描画待機 | code-highlight | `await expect(locator).toBeVisible()` |

Playwright のアサーション `expect(locator).toBeVisible()` はデフォルト 5000ms まで自動リトライするため、大多数の固定待機を置換できる。

### e2e-stability FR-002: vi.spyOn(process, 'cwd') リーク問題の特定

調査の結果、以下のパターンが混在している：

**パターン A（安全）**: `beforeEach` でスパイを設定し `afterEach` で `vi.restoreAllMocks()` を呼ぶ
- `verify-llm.e2e.test.ts`, `learn.e2e.test.ts` の describe ブロックレベル — これは正しい

**パターン B（危険）**: `it()` ブロック内でスパイを設定し、対応する `mockRestore()` を呼ばない
- `learn.e2e.test.ts` の一部 `it()` 内で `vi.spyOn(process, 'cwd').mockReturnValue(env.root)` をさらに呼び出しているが、対応する `afterEach` が describe スコープのため、失敗時にスパイが残る可能性

Vitest はデフォルトでテストファイルを別ワーカーで実行するため、**ファイル間**の干渉は基本的になし。ただし **同一ファイル内の並列 it()** は同一ワーカーで実行されるため、グローバル状態（`process.cwd`）のスパイは干渉のリスクがある。

修正方針: `it()` 内の `vi.spyOn(process, 'cwd')` は、その `it()` 末尾で `spy.mockRestore()` を呼ぶか、`afterEach` で `vi.restoreAllMocks()` を呼ぶ describe ブロックに移動する。

### artifact-preview FR-014: verify:cmd 自動実行の実装方針

**フロントエンド（ArtifactViewer.tsx）**:
- 現状: `li` コンポーネントが `verify: cmd:` アノテーションを検出して amber ハイライトを付与（FR-012 実装済み）
- 追加: `.md-comment` スパン内のテキストから `verify: cmd:<command>` を抽出し、Run ボタンを表示
- Run ボタンクリック時: API エンドポイントへ `POST` → レスポンスをインライン表示

**バックエンド（API サーバー）**:
- 既存ルート: `changes`, `artifacts`, `specs`, `testResults`（すべて Fastify）
- 追加: `POST /api/run-cmd` エンドポイント — `{ cmd: string }` を受け取り、`child_process.spawn` で実行して `{ exitCode, stdout, stderr }` を返す
- セキュリティ: コマンドは `mspec ` プレフィックスのみ許可（任意コマンド実行防止）。または許可コマンドリストを `.mspec/config.yaml` で定義

## Web References

- [Mastering waits and timeouts in Playwright - CircleCI](https://circleci.com/blog/mastering-waits-and-timeouts-in-playwright/)
- [Why You Shouldn't Use page.waitForTimeout() in Playwright - BrowserStack](https://www.browserstack.com/guide/playwright-waitfortimeout)
- [Smart Waits in Playwright — Avoid Flaky Tests Like a Pro - Medium](https://medium.com/@divyakandpal93/smart-waits-in-playwright-avoid-flaky-tests-like-a-pro-779be48e8b0b)
- [How to avoid and detect flaky tests in Vitest - Trunk.io](https://trunk.io/blog/how-to-avoid-and-detect-flaky-tests-in-vitest)
- [Flaky tests in Vitest: every pattern that breaks CI - Mergify](https://mergify.com/learn/flaky-tests/vitest)
- [Parallel Test Execution Causing Flaky Tests? - DeFlaky Blog](https://deflaky.com/blog/parallel-test-execution-flaky)

## Codebase Findings

### 影響ファイル一覧（e2e-stability）

**Playwright tests（waitForTimeout 置換対象）:**
- `packages/web-ui/tests/e2e/spec-viewer.e2e.test.ts` — 10件（3000ms×2 を含む最多）
- `packages/web-ui/tests/e2e/checklist-verify-human.e2e.test.ts` — 4件
- `packages/web-ui/tests/e2e/code-highlight.e2e.test.ts` — 5件
- `packages/web-ui/tests/e2e/checklist-interactive.e2e.test.ts` — 3件
- `packages/web-ui/tests/e2e/full-text-search.e2e.test.ts` — 3件
- `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts` — 1件

**vitest CLI tests（process.cwd スパイ使用）:**
- `packages/cli/tests/e2e/verify-llm.e2e.test.ts` — beforeEach+afterEach ✅ / `it()`内部スパイに `mockRestore()` なし ⚠
- `packages/cli/tests/e2e/learn.e2e.test.ts` — describe レベルは afterEach ✅ / `it()` 内追加スパイは不完全 ⚠

### ArtifactViewer.tsx の現状

```
li コンポーネント:
  isVerifyHuman = text.includes('verify: human') || text.includes('verify: cmd:')
  → true なら amber ハイライト
  → false なら通常 li
  → Run ボタンは未実装（FR-014 で追加）
```

### API サーバーの現状

`packages/web-ui/tests/e2e/setup/api-server.ts` は Fastify で構築。
現在の routes: `changes`, `artifacts`, `testResults`, `specs`。
コマンド実行エンドポイントは未実装。FR-014 では `POST /api/run-cmd` を新規追加する。

## Open Choices

### OC-1: verify:cmd 実行コマンドの許可リスト戦略

**選択肢 A**: `mspec ` プレフィックスのみ許可（厳格）  
**選択肢 B**: `.mspec/config.yaml` の `allowed_cmd_prefixes` フィールドで設定可能  
**選択肢 C**: 制限なし（localhost 専用として信頼）

→ デフォルトは **選択肢 A** で実装し、必要に応じて B に拡張する方針を採用（Security by Default）

## Constitution Check

### Phase 0 — Pre-Implementation

| # | Principle | Status | Note |
|---|-----------|--------|------|
| I | ステップ独立性 | ✅ pass | 各修正は独立して適用可能 |
| II | 決定論的マージ | ✅ pass | e2e-stability は新規 capability、artifact-preview は FR-014 追加のみ |
| III | 質問駆動の要件確定 | ✅ pass | OC-1 は A で決定済み（bugfix モードのため深い問答不要） |
| IV | 双方向アンカー | ✅ pass | 実装後に `@mspec-delta` アンカーを各テストファイルに付与する |
| V | 強制ステップと拡張ステップの分離 | ✅ pass | 今回変更はテストコード + web-ui コンポーネントのみ |
| VI | Security by Default | ✅ pass | OC-1 で `mspec` プレフィックス限定に決定。任意コマンド実行を回避 |
| VII | 設計意図と実装の対応確認 | ✅ pass | FR-012（amber ハイライト）が既実装、FR-014 はその自然な拡張 |
