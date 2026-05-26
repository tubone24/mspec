<!-- See also: ./design-rationale.md for採用理由・代替案 -->

---
doc_type: Reference
---

# Design: mspec-web-ui-e2e

## Summary

Playwright E2E テストスイートを `packages/web-ui/tests/e2e/` に追加する。テスト起動は `tests/e2e/setup/api-server.ts` で Fastify を直接起動し（`mspec ui start` コマンドの代替）、`playwright.config.ts` の `webServer` 配列で Vite dev server と並行起動する。テストは実際の mspec リポジトリデータ（`changes/archive/`）を対象とし、Dashboard・ArtifactPreview・TestResults の 3 画面を `data-testid` 属性で確認する。

## Technical Context

- **テストフレームワーク**: Playwright v1.49+（`packages/web-ui` にインストール済み）
- **フロントエンド起動**: `pnpm dev`（Vite dev server, port 5173）
- **APIサーバー起動**: `tests/e2e/setup/api-server.ts`（Fastify を直接起動, port 3847）
- **テストデータ**: 実際の mspec リポジトリの `changes/archive/` — アーカイブ済みで内容が安定
- **baseURL**: `http://localhost:5173`（修正済み）

## Project Structure

```
packages/web-ui/
  playwright.config.ts          ← MODIFIED: webServer 配列に api-server.ts を追加
  tests/
    e2e/
      setup/
        api-server.ts           ← NEW: Fastify をテスト用に起動するスクリプト
      dashboard.e2e.test.ts     ← NEW: change-dashboard FR-005, FR-006
      artifact-preview.e2e.test.ts ← NEW: artifact-preview FR-006, FR-007, FR-008
      test-results.e2e.test.ts  ← NEW: test-result-viewer FR-005, FR-006
```

## `api-server.ts` の契約

```typescript
// tests/e2e/setup/api-server.ts
// Fastify を port 3847 で起動し、mspec リポジトリルートを root として渡す
import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import { registerChangesRoutes } from '../../../src/server/routes/changes.js';  // wait...
// NOTE: packages/cli の src を直接参照するのは依存方向として問題があるため、
//       packages/web-ui の devDependencies に @mspec/cli を workspace:* で追加する
```

> **注意**: `api-server.ts` は `packages/cli/src/server/` を直接 import するため、
> `packages/web-ui/package.json` の `devDependencies` に `@mspec/cli: "workspace:*"` を追加する必要がある。

## `playwright.config.ts` の変更内容

```typescript
webServer: [
  {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
  },
  {
    command: 'node --import tsx/esm tests/e2e/setup/api-server.ts',
    url: 'http://localhost:3847/api/health',
    reuseExistingServer: !process.env['CI'],
  },
],
```

## E2E テストパターン

### Dashboard（dashboard.e2e.test.ts）

```typescript
// FR-005: ダッシュボードにチェンジ行が存在すること
await page.goto('/');
await page.waitForSelector('[data-testid^="change-row-"]');
await expect(page).toHaveTitle('MSPEC Dashboard');

// FR-006: モードフィルターが機能すること
await page.click('[data-testid="filter-bugfix"]');
// filter 後の行が全て bugfix か、No active changes になること
```

### ArtifactPreview（artifact-preview.e2e.test.ts）

```typescript
// FR-006: Mermaid SVG がレンダリングされること
await page.goto(`/changes/${archiveId}/artifacts/architecture-overview.md`);
await page.waitForSelector('[data-testid="mermaid-svg"] svg', { timeout: 15000 });

// FR-007: ダーク/ライトテーマが LocalStorage に永続化されること
await page.click('[data-testid="theme-toggle"]');
await page.reload();
const isDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
expect(isDark).toBe(true);
const stored = await page.evaluate(() => localStorage.getItem('mspec-ui-store'));
expect(JSON.parse(stored!).state.theme).toBe('dark');

// FR-008: EARS/Gherkin キーワードが色付きスパンとして表示されること
await page.goto(`/changes/${archiveId}/artifacts/specs/change-dashboard/spec.md`);
const highlight = page.locator('[data-testid="gherkin-highlight"] .text-red-600');
await expect(highlight.first()).toBeVisible();
```

### TestResults（test-results.e2e.test.ts）

```typescript
// FR-005: テスト結果バッジが存在するか No results メッセージが表示されること
await page.goto(`/changes/${archiveId}/test-results`);
const hasResults = await page.locator('[data-testid^="test-case-"]').count() > 0;
const hasNoResults = await page.locator('text=No test results found.').isVisible();
expect(hasResults || hasNoResults).toBe(true);

// FR-006: fail クリックでトレースパネルが展開されること（fail がある場合のみ）
if (await page.locator('[data-testid="test-case-fail"]').count() > 0) {
  await page.locator('[data-testid="test-case-fail"]').first().click();
  await expect(page.locator('[data-testid="trace-panel"]')).toBeVisible();
}
```

## Decisions

| # | Decision | Acceptance Criterion |
|---|----------|---------------------|
| 1 | `api-server.ts` で Fastify を直接起動 | `http://localhost:3847/api/health` が 200 OK を返す（`playwright.config.ts` webServer 第2要素の待機条件） |
| 2 | baseURL を `5173` に修正済み | Playwright が `http://localhost:5173/` を開いてダッシュボードが表示される |
| 3 | `data-testid` による要素特定 | `[data-testid="mermaid-svg"] svg`・`[data-testid^="change-row-"]`・`[data-testid="trace-panel"]` が各シナリオで検証される（change-dashboard FR-005, artifact-preview FR-006, test-result-viewer FR-006）|
| 4 | Mermaid 待機: `waitForSelector` + timeout 15s | `architecture-overview.md` をプレビューして 15 秒以内に SVG が DOM に出現する（artifact-preview FR-006） |
| 5 | LocalStorage 検証: `page.evaluate` + `page.reload()` | テーマトグル後リロードして `html.classList.contains('dark')` が true かつ `mspec-ui-store` に `"theme":"dark"` が含まれる（artifact-preview FR-007） |
| 6 | `test-case-fail` の `.first()` 使用 | 失敗テストが複数ある場合も最初の 1 件をクリックしてトレースパネルが展開される（test-result-viewer FR-006） |
| 7 | `api-server.ts` に `writePid`/`clearPid` を含める | E2E 終了後に `~/.mspec/ui.pid` を正しくクリーンアップし、次回 `mspec new` 時のゾンビ PID 問題を防ぐ（web-ui-server FR-003 の回帰防止） |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ design ステップは research.md のみを入力とし、design.md を独立して生成している | ✅ design.md は他の成果物（tasks.md 等）に依存せず単独で参照可能 |
| II 決定論的マージ | ✅ design.md は新規ファイルであり、既存ファイルへのマージ競合は発生しない | ✅ テストパターンの型定義・waitForSelector パターンは曖昧さなく記述されている |
| III 質問駆動の要件確定 | ✅ AskUserQuestion で api-server.ts の起動戦略を確定した | ✅ 全 Decisions が Delta Spec の Scenario にトレース可能な受け入れ基準を持つ |
| IV 双方向アンカー | ✅ Decisions テーブルの各行が Delta Spec の FR にトレース可能 | ✅ テストパターンが tasks.md のアンカーとして機能する |
| V 強制ステップと拡張ステップの分離 | ✅ design は全フロー変更での強制ステップ | ✅ design-rationale.md が採用理由の拡張ドキュメントとして分離されている |

### Complexity Tracking

None.

## Self-Review

### Findings

| # | 重要度 | 箇所 | 問題 | 対応 |
|---|--------|------|------|------|
| 1 | 🔴 MUST-FIX | `design.md` vs `checklist.md` vs `specs/artifact-preview/spec.md` | CSS クラス名不整合: design.md コードは `.text-red-600` を使用しているが spec と checklist は `text-red` と記載していた | ✅ 修正済み — 実装（`GherkinHighlight.tsx`）の実際のクラス `text-red-600` に全文書を統一 |
| 2 | 🔴 MUST-FIX | `quickstart.md` Golden Path | `pnpm test:e2e` コマンドを使用しているが `packages/web-ui/package.json` にそのスクリプトを追加する手順がなかった。ゴールデンパスが未実行の状態 | ✅ 修正済み — Setup ステップ 3 に `"test:e2e": "playwright test"` の追加手順を追記 |
| 3 | 🟡 SHOULD-FIX | `quickstart.md` vs `design.md` | `api-server.ts` 実装例に `writePid`/`clearPid` が含まれるが design.md の Decisions テーブルに記載なし | ✅ 修正済み — Decision #7 として PID クリーンアップの意図（ゾンビ PID 防止）を追記 |
| 4 | 🟡 SHOULD-FIX | `quickstart.md` 前提条件 vs `specs/change-dashboard/spec.md` | 「archived changes」と「active changes」の用語不整合。`/api/changes` は `includeArchived: false` でアクティブチェンジのみを返す | ✅ 修正済み — quickstart と spec.md の GIVEN 句を「アクティブなチェンジ（アーカイブ除く）」に統一 |
| 5 | 🟢 NOTE | `checklist.md` | FR-005/FR-006 が複数 capability で重複する番号になっており、スコープなしで読むと混乱する | 非ブロッカー。tasks.md でアンカーを付与する際に spec ファイルパスで一意化される |
| 6 | 🟢 NOTE | `architecture-overview.md` Constitution Check Phase 1 Principle IV | "tasks.md のアンカーとして機能する" は tasks.md 未作成時点での forward-looking な記述 | 非ブロッカー。設計フェーズでは想定として適切 |

### Verdict

**PASS**（全 MUST-FIX・SHOULD-FIX 対応済み）

CSS クラス名の不整合（Finding #1）と quickstart のゴールデンパス欠陥（Finding #2）を修正し、PID 管理の設計根拠（Finding #3）と用語統一（Finding #4）も完了した。
