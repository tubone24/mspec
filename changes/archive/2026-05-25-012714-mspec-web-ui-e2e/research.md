---
doc_type: Reference
---

# Research: mspec-web-ui-e2e

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| Playwright baseURL | `http://localhost:5173`（Vite dev server）| `http://localhost:3847` (誤: Fastify) | `playwright.config.ts` の `webServer.url` は `5173`、`baseURL` は `3847` で不一致だった → 修正済み |
| API テスト戦略 | 実際の Fastify サーバーを `mspec ui start` で起動 | `page.route()` モック | 実環境に近いテストでユーザー選択。`mspec ui start` コマンドを新設して Playwright の `webServer` から起動する |
| `mspec ui start` コマンド | 新規 capability `web-ui-server-cmd` として別チェンジで実装 | 既存 `launchWebUiIfNeeded()` をそのまま使用 | `launchWebUiIfNeeded()` は `mspec new` 内部からしか呼べない。E2E テスト用に独立した `mspec ui start` コマンドが必要 |
| Mermaid SVG 待機方法 | `page.waitForSelector('[data-testid="mermaid-svg"] svg')` + timeout 延長 | `waitForFunction` でポーリング | `MermaidRenderer` は `useEffect` 内で非同期 `mermaid.render()` を実行。`data-testid` 要素は即時存在するが内部 `<svg>` の出現待ちが必要 |
| LocalStorage 検証 | `page.evaluate(() => localStorage.getItem('mspec-ui-store'))` で `theme` フィールドを確認 | CSS pixel 比較 | zustand `persist` の key が `name: 'mspec-ui-store'` と明示されている |
| テーマ DOM 検証 | `page.locator('html').evaluate(el => el.classList.contains('dark'))` | CSS property 取得 | `ThemeToggle` が `document.documentElement.classList` を直接操作するため |
| テストデータ | 実際の mspec リポジトリの `changes/archive/` — アーカイブ済みチェンジを対象 | fixtures ファイル | 実リポジトリデータで安定している（アーカイブ済みは変化しない） |

## Web References

- [Playwright `page.route()` — Network interception](https://playwright.dev/docs/network#handle-requests) — `/api/**` をインターセプトしてモック JSON を返す手法（将来のモック戦略として参考）
- [Playwright `waitForSelector`](https://playwright.dev/docs/api/class-page#page-wait-for-selector) — SVG 等の非同期 DOM 出現待機
- [Playwright Multiple webServers](https://playwright.dev/docs/test-webserver#multiple-webservers) — `webServer` 配列で複数サーバーを起動する公式ドキュメント
- [Playwright `evaluate` + localStorage](https://playwright.dev/docs/api/class-page#page-evaluate) — LocalStorage キーの読み書き
- [Mermaid `render()` API](https://mermaid.js.org/config/usage.html#api-usage) — Promise ベースの非同期 SVG 生成
- [zustand `persist` middleware](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) — `name` オプションが localStorage キーになる

## Codebase Findings

### playwright.config.ts の修正点

- **修正済み**: `baseURL: 'http://localhost:3847'` → `http://localhost:5173` に変更
- `webServer.command: 'pnpm dev'` で Vite を port 5173 で起動
- `mspec ui start` コマンド実装後に `webServer` 配列で Fastify も起動させる（現在は `mspec ui start` 未実装のためペンディング）

### 実装済み data-testid の一覧（テスト可能）

| コンポーネント | data-testid | 用途 |
|-------------|-------------|------|
| `Dashboard.tsx:72` | `change-row-<id>` | チェンジ行の特定 |
| `ModeFilter.tsx:22` | `filter-<mode>` | モードフィルターボタン |
| `StepProgress.tsx` | `step-progress` | 進捗バー |
| `MermaidRenderer.tsx:36` | `mermaid-svg` | Mermaid SVG コンテナ（内部に `<svg>` が出現） |
| `GherkinHighlight.tsx:30` | `gherkin-highlight` | EARS/Gherkin ハイライトコード |
| `PrototypeIframe.tsx:6` | `prototype-iframe` | プロトタイプ iframe |
| `ThemeToggle.tsx:12` | `theme-toggle` | テーマ切り替えボタン |
| `TestResults.tsx:66` | `test-case-<status>` | テストケース行（pass/fail/skip） |
| `TestResults.tsx:81` | `trace-panel` | 失敗テストのトレース展開パネル |

### router の URL パターン（テスト用 navigate 先）

- `/` → Dashboard
- `/changes/:id` → ChangeDetail
- `/changes/:id/artifacts/<relativePath>` → ArtifactPreview
- `/changes/:id/test-results` → TestResults

### Mermaid 非同期レンダリングの注意点

`MermaidRenderer.tsx` の `useEffect` → `mermaid.render()` → `setSvg()` → `dangerouslySetInnerHTML` の流れが非同期。`data-testid="mermaid-svg"` の div は即時存在するが内部の `<svg>` は非同期で挿入される。Playwright では：

```typescript
await page.waitForSelector('[data-testid="mermaid-svg"] svg', { timeout: 15000 });
```

## Open Choices

| 論点 | 状況 |
|------|------|
| `mspec ui start` コマンドの実装 | この E2E チェンジのスコープ外 → 別チェンジ（`web-ui-server-cmd`）として先行実装が必要 |
| Playwright `webServer` 配列の第 2 要素 | `mspec ui start` 実装後に `playwright.config.ts` へ追記する |
| `test-case-fail` の複数存在 | `page.locator('[data-testid="test-case-fail"]').first()` を使用するか、テスト結果ファイル（fixtures）で fail が 1 件のみになるよう制御する |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ research ステップは proposal.md と specs/\*/spec.md のみを入力とし、research.md を独立して生成している | — |
| II 決定論的マージ | ✅ research.md は新規ファイルであり、既存ファイルへのマージ競合は発生しない | — |
| III 質問駆動の要件確定 | ✅ 2問の AskUserQuestion で API 戦略・サーバー起動方式を確定した | — |
| IV 双方向アンカー | ✅ Decisions テーブルの採用案が design ステップの技術選定根拠として参照される | — |
| V 強制ステップと拡張ステップの分離 | ✅ research は全フロー変更での強制ステップであり、skip 対象外として扱われている | — |
