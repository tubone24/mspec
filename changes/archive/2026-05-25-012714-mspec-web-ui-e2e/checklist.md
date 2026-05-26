---
doc_type: Reference
---

# Checklist: mspec-web-ui-e2e

## Delta Spec Coverage

### change-dashboard

- [ ] FR-005 — ダッシュボード画面が 10 秒以内に表示され `[data-testid^="change-row-"]` 要素が 1 件以上 DOM に存在すること、かつページタイトルが "MSPEC Dashboard" であること。`dashboard.e2e.test.ts` の Scenario がこれを検証する。 <!-- verify: fr-005 -->
- [x] FR-006 — `[data-testid="filter-bugfix"]` クリック後、表示チェンジ行が bugfix モードのみになるか "No active changes found." が表示されること。`dashboard.e2e.test.ts` の Scenario がこれを検証する。 <!-- verify: fr-006 -->

### artifact-preview

- [ ] FR-006 — `architecture-overview.md` または `design.md` のプレビューページで `[data-testid="mermaid-svg"] svg` セレクターに一致する SVG 要素が 1 件以上 15 秒以内に DOM に出現すること。`artifact-preview.e2e.test.ts` の Scenario がこれを検証する。 <!-- verify: fr-006 -->
- [x] FR-007 — `[data-testid="theme-toggle"]` クリック後のページリロードで `html` 要素が `dark` クラスを持ち、`localStorage["mspec-ui-store"]` に `"theme":"dark"` が含まれること。`artifact-preview.e2e.test.ts` の Scenario がこれを検証する。 <!-- verify: fr-007 -->
- [x] FR-008 — `spec.md` のプレビューページで `[data-testid="gherkin-highlight"]` 内に `text-red-600` クラスを持つ `<span>` が 1 件以上存在すること。`artifact-preview.e2e.test.ts` の Scenario がこれを検証する。 <!-- verify: fr-008 -->

### test-result-viewer

- [x] FR-005 — `/changes/:id/test-results` ページで `[data-testid^="test-case-"]` のいずれか、または "No test results found." テキストが DOM に存在すること。`test-results.e2e.test.ts` の Scenario がこれを検証する。 <!-- verify: fr-005 -->
- [x] FR-006 — `[data-testid="test-case-fail"]` が存在する場合にクリックすると `[data-testid="trace-panel"]` が visible になること。`test-results.e2e.test.ts` の Scenario がこれを検証する（fail がない場合はスキップ）。 <!-- verify: fr-006 -->

## Source-of-Truth Regression Risk

| Capability | Risk | Reason |
|------------|------|--------|
| web-ui-server FR-001/FR-002/FR-003（サーバー起動・PID 管理） | 🟡 MEDIUM | `api-server.ts` が Fastify を直接起動するため、本番の `mspec ui start` / PID ファイル管理パスが E2E で一切実行されない。テストが green でも production server-start の回帰を検出できない。 <!-- verify: human --> |
| artifact-preview FR-002（Mermaid SVG レンダリング） | 🟢 LOW | 新規 artifact-preview FR-006 が既存機能を上書き検証する。回帰は E2E で即座に検出可能。 <!-- verify: human --> |
| artifact-preview FR-003（EARS / Gherkin ハイライト） | 🟢 LOW | 新規 artifact-preview FR-008 が既存機能を上書き検証する。クラス名 `text-red` が変更された場合も E2E で検出可能。 <!-- verify: human --> |
| artifact-preview FR-004（ダーク / ライトモード永続化） | 🟢 LOW | 新規 artifact-preview FR-007 が既存機能を上書き検証する。LocalStorage キー `mspec-ui-store` の変更は E2E で検出可能。 <!-- verify: human --> |
| change-dashboard FR-001（チェンジ一覧表示） | 🟢 LOW | 新規 change-dashboard FR-005 が既存機能を上書き検証する。`change-row-*` 要素の消失は E2E で検出可能。 <!-- verify: human --> |
| change-dashboard FR-003（モード別フィルター） | 🟢 LOW | 新規 change-dashboard FR-006 が既存機能を上書き検証する。フィルター実装の変更は E2E で検出可能。 <!-- verify: human --> |
| test-result-viewer FR-003（トレース展開） | 🟡 MEDIUM | fail ケースが archive データに存在しない場合、FR-006 のトレース展開パスがスキップされる（潜在リスク）。 <!-- verify: human --> |

## Design Decision Coverage

- [ ] Decision #1 — `api-server.ts` が `http://localhost:3847/api/health` に 200 OK を返すことを `playwright.config.ts` webServer 第 2 要素 `url` 設定で待機確認していること <!-- verify: human -->
- [ ] Decision #2 — `playwright.config.ts` の `baseURL` が `http://localhost:5173` に修正済みであることを実ファイルで確認すること <!-- verify: human -->
- [ ] Decision #3 — 全 E2E テストで要素特定に `data-testid` 属性のみを使用し、脆弱な CSS セレクターや XPath を使用していないこと <!-- verify: human -->
- [ ] Decision #4 — `[data-testid="mermaid-svg"] svg` の待機に `waitForSelector` + timeout 15s を使用しており、Mermaid の非同期レンダリングに対応していること <!-- verify: human -->
- [ ] Decision #5 — テーマ永続化検証で `page.evaluate(() => localStorage.getItem('mspec-ui-store'))` と `page.reload()` 後の `html.classList.contains('dark')` を使用していること <!-- verify: human -->
- [ ] Decision #6 — `test-case-fail` 複数存在時に `.first()` を使用して最初の 1 件でトレースパネル展開を確認していること <!-- verify: human -->
- [ ] `packages/web-ui/package.json` の `devDependencies` に `@mspec/cli: "workspace:*"` が追加済みで `api-server.ts` が import できること <!-- verify: human -->

## Constitution Checklist

- [ ] 原則 I ステップ独立性 — E2E テストファイルは `packages/web-ui/tests/e2e/` に閉じており単独で `pnpm playwright test` で実行できること <!-- verify: human -->
- [ ] 原則 II 決定論的マージ — Delta Spec は ADDED のみ（MODIFIED/REMOVED なし）で archive 時の CLI マージが正しく処理されること <!-- verify: human -->
- [ ] 原則 III 質問駆動の要件確定 — `api-server.ts` 起動戦略の AskUserQuestion による確定が design.md に追跡可能な形で記録されていること <!-- verify: human -->
- [ ] 原則 IV 双方向アンカー — 新規 `.e2e.test.ts` 3 ファイルと `api-server.ts` に `@mspec-delta` アンカーが付与され `mspec anchor check` がゼロ終了すること <!-- verify: human -->
- [ ] 原則 V 強制ステップと拡張ステップの分離 — `workflow.yaml` の強制ステップ定義を変更しておらず、Constitution Check Phase 0/1 で全 5 原則が評価済みであること <!-- verify: human -->
