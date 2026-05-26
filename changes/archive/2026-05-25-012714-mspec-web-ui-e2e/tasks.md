---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/change-dashboard/spec.md -->
<!-- Requirements implemented: FR-005, FR-006 -->
<!-- Change: mspec-web-ui-e2e -->

<!-- @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-006, FR-007, FR-008 -->
<!-- Change: mspec-web-ui-e2e -->

<!-- @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/test-result-viewer/spec.md -->
<!-- Requirements implemented: FR-005, FR-006 -->
<!-- Change: mspec-web-ui-e2e -->

# Tasks: mspec-web-ui-e2e

> **注意**: このチェンジの TDD 証跡は Playwright E2E テスト用に `.mspec/config.yaml` の `test.command` を
> `cd packages/web-ui && pnpm test:e2e --reporter=list` に切り替えてから実行する。
> 実装完了後は元のコマンドに戻す。

## Phase 1: Setup

- [x] T001 [P] `packages/web-ui/package.json` に `"test:e2e": "playwright test"` スクリプトを追加し、`devDependencies` に `@mspec/cli: "workspace:*"` と `tsx: "^4.0.0"` を追記する — files: `packages/web-ui/package.json`

- [x] T002 [P] Playwright ブラウザ（Chromium）をインストールする: `cd packages/web-ui && pnpm exec playwright install chromium` — files: なし（Playwright キャッシュ）

- [x] T003 [P] `playwright.config.ts` を更新して `webServer` 配列に api-server.ts の起動設定を追加する — files: `packages/web-ui/playwright.config.ts`

- [x] T004 [P] `.mspec/config.yaml` の `test.command` を Playwright E2E 用に切り替える: `cd packages/web-ui && pnpm test:e2e --reporter=list` — files: `.mspec/config.yaml`

## Phase 2: Foundational — API サーバー起動スクリプト

### Tests-first (E2E)

- [x] T101 E2E for api-server 起動確認 "GET /api/health が 200 OK を返し、`changes/archive/` の一覧を含む GET /api/changes が動作する" — files: `packages/web-ui/tests/e2e/setup/api-server.test.ts`（Playwright の `request` fixture を使用）
      anchor:
        @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/change-dashboard/spec.md
        Requirements implemented: FR-005 <!-- verify: human -->
        Change: mspec-web-ui-e2e

### Implementation

- [x] T102 `tests/e2e/setup/api-server.ts` を実装: Fastify を port 3847 で起動し `registerChangesRoutes`・`registerArtifactsRoutes`・`registerTestResultsRoutes`・`/api/health` を登録し、`writePid`・`clearPid` で PID 管理する（T101 green） — files: `packages/web-ui/tests/e2e/setup/api-server.ts`
      anchor:
        @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/change-dashboard/spec.md
        Requirements implemented: FR-005 <!-- verify: human -->
        Change: mspec-web-ui-e2e

## Phase 3: User Story — E2E テストファイル

### Tests-first (E2E — Playwright)

- [x] T201 E2E for change-dashboard FR-005 "Dashboard: `[data-testid^='change-row-']` が 1 件以上存在しタイトルが 'MSPEC Dashboard'" — files: `packages/web-ui/tests/e2e/dashboard.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/change-dashboard/spec.md
        Requirements implemented: FR-005 <!-- verify: human -->
        Change: mspec-web-ui-e2e

- [x] T202 E2E for change-dashboard FR-006 "Mode filter: `filter-bugfix` クリック後に bugfix チェンジのみ、または No active changes" — files: `packages/web-ui/tests/e2e/dashboard.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/change-dashboard/spec.md
        Requirements implemented: FR-006 <!-- verify: fr-006 -->
        Change: mspec-web-ui-e2e

- [x] T203 E2E for artifact-preview FR-006 "Mermaid: `[data-testid='mermaid-svg'] svg` が 15 秒以内に DOM に出現する" — files: `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/artifact-preview/spec.md
        Requirements implemented: FR-006 <!-- verify: human -->
        Change: mspec-web-ui-e2e

- [x] T204 E2E for artifact-preview FR-007 "Theme: toggle クリック後 reload で html.class に dark が残り localStorage に theme:dark" — files: `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/artifact-preview/spec.md
        Requirements implemented: FR-007 <!-- verify: fr-007 -->
        Change: mspec-web-ui-e2e

- [x] T205 E2E for artifact-preview FR-008 "Gherkin: spec.md プレビューで `[data-testid='gherkin-highlight']` 内に `.text-red-600` スパンが存在する" — files: `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/artifact-preview/spec.md
        Requirements implemented: FR-008 <!-- verify: fr-008 -->
        Change: mspec-web-ui-e2e

- [x] T206 E2E for test-result-viewer FR-005 "TestResults: `[data-testid^='test-case-']` または 'No test results found.' が表示される" — files: `packages/web-ui/tests/e2e/test-results.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/test-result-viewer/spec.md
        Requirements implemented: FR-005 <!-- verify: fr-005 -->
        Change: mspec-web-ui-e2e

- [x] T207 E2E for test-result-viewer FR-006 "Trace: `test-case-fail` が存在する場合クリックで `trace-panel` が visible になる" — files: `packages/web-ui/tests/e2e/test-results.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/test-result-viewer/spec.md
        Requirements implemented: FR-006 <!-- verify: fr-006 -->
        Change: mspec-web-ui-e2e

## Phase 4: Polish

- [ ] T301 [P] 全 E2E テストを通して `pnpm test:e2e --reporter=list` で全 green を確認する

- [ ] T302 [P] `.mspec/config.yaml` の `test.command` を元の vitest コマンドに戻す — files: `.mspec/config.yaml`

- [ ] T303 [P] `test-results/results.json`（Playwright JSON reporter 出力）を `changes/<id>/e2e-results/` にコピーして test-result-viewer の実データとして活用可能にする

## Dependencies

- T001 → T002, T003, T004
- T004 → T101 （test.command 切り替え後でなければ証跡が記録されない）
- T102 → T101（green 確認）
- T102 → T201, T202, T203, T204, T205, T206, T207（サーバー起動が前提）

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| 原則 | Phase 0 | Phase 1 | Notes |
|------|---------|---------|-------|
| I ステップ独立性 | ✅ | — | tasks.md は design.md と checklist.md のみを参照して生成されている |
| II 決定論的マージ | ✅ | — | tasks.md は Reference ドキュメント。SoT spec にマージされない |
| III 質問駆動の要件確定 | ✅ | — | api-server.ts 起動戦略・test.command 切り替え手順を設計・タスク化した |
| IV 双方向アンカー | ✅ | — | 全 E2E タスク（T101〜T207）に `@mspec-delta` アンカーを付与済み |
| V 強制ステップと拡張ステップの分離 | ✅ | — | tasks は全フロー変更での強制ステップ。スキップ不可 |

### Complexity Tracking

None
