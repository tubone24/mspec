---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004 -->
<!-- Change: mspec-web-ui -->

<!-- @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004 -->
<!-- Change: mspec-web-ui -->

<!-- @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: mspec-web-ui -->

<!-- @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004 -->
<!-- Change: mspec-web-ui -->

<!-- @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/cli-integration/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: mspec-web-ui -->

# Tasks: mspec-web-ui

## Phase 1: Setup

- [x] T001 [P] `packages/web-ui` スキャフォールド作成 — `pnpm create vite packages/web-ui --template react-ts`、Tailwind CSS v3、React Router v7、Zustand、TanStack Query v5、react-markdown、remark-gfm、mermaid をインストール — files: `packages/web-ui/package.json`, `packages/web-ui/vite.config.ts`, `packages/web-ui/tailwind.config.ts`

- [x] T002 [P] `packages/cli/src/server/` ディレクトリ構造を作成し fastify・@fastify/static を CLI にインストール — files: `packages/cli/src/server/index.ts`, `packages/cli/src/server/routes/changes.ts`, `packages/cli/src/server/routes/artifacts.ts`, `packages/cli/src/server/routes/testResults.ts`, `packages/cli/src/server/pidManager.ts`, `packages/cli/src/server/portResolver.ts`, `packages/cli/src/server/testResultParser.ts`, `packages/cli/package.json`

- [x] T003 [P] ルート `pnpm-workspace.yaml` を新規作成して `packages/*` を追加し、`packages/cli/package.json` の `optionalDependencies` に `@mspec/web-ui: "workspace:*"` を追記 — files: `pnpm-workspace.yaml`, `packages/cli/package.json`

## Phase 2: Foundational — サーバー・API・CLI フック

### Tests-first (E2E / Unit)

- [x] T101 E2E for web-ui-server FR-001 "初回起動: ポート 3847 で HTTP サーバーが起動し PID ファイルが生成される" — files: `packages/cli/src/server/__tests__/pidManager.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-001 <!-- verify: human -->
        Change: mspec-web-ui

- [x] T102 E2E for web-ui-server FR-002 "プロセス再利用: 有効 PID があれば新規起動せず URL を返す" — files: `packages/cli/src/server/__tests__/pidManager.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-002 <!-- verify: fr-002 -->
        Change: mspec-web-ui

- [x] T103 E2E for web-ui-server FR-003 "ゾンビ PID: 古い PID ファイルを削除して新規起動する" — files: `packages/cli/src/server/__tests__/pidManager.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-003 <!-- verify: fr-003 -->
        Change: mspec-web-ui

- [x] T104 E2E for cli-integration FR-001 "mspec new フック: 未起動時に自動起動して URL をコンソールに出力" — files: `packages/cli/tests/e2e/cli-integration.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/cli-integration/spec.md
        Requirements implemented: FR-001 <!-- verify: human -->
        Change: mspec-web-ui

- [x] T105 E2E for cli-integration FR-002 "既存サーバー稼働中: 'Web UI already running at ...' をコンソールに出力" — files: `packages/cli/tests/e2e/cli-integration.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/cli-integration/spec.md
        Requirements implemented: FR-002 <!-- verify: fr-002 -->
        Change: mspec-web-ui

- [x] T106 E2E for cli-integration FR-003 "非ブロッキング: mspec new が 5 秒以内に完了する" — files: `packages/cli/tests/e2e/cli-integration.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/cli-integration/spec.md
        Requirements implemented: FR-003 <!-- verify: human -->
        Change: mspec-web-ui

- [x] T107 Unit test for change-dashboard FR-001 "GET /api/changes が未アーカイブ一覧を作成日降順で返す" — files: `packages/cli/src/server/__tests__/routes.changes.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
        Requirements implemented: FR-001 <!-- verify: fr-001 -->
        Change: mspec-web-ui

- [x] T108 Unit test for test-result-viewer FR-001 "Playwright JSON と JUnit XML の両フォーマットが TestSuite[] に正規化される" — files: `packages/cli/src/server/__tests__/testResultParser.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md
        Requirements implemented: FR-001 <!-- verify: fr-001 -->
        Change: mspec-web-ui

### Implementation

- [x] T110 `pidManager.ts` を実装: readPid / writePid / clearPid / isAlive（kill(pid, 0) チェック） — files: `packages/cli/src/server/pidManager.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-002, FR-003
        Change: mspec-web-ui

- [x] T111 `portResolver.ts` を実装: `~/.mspecrc` の `ui.port` または 3847 を返す — files: `packages/cli/src/server/portResolver.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-004
        Change: mspec-web-ui

- [x] T112 Fastify サーバーブートストラップを実装: `server/index.ts` で `@fastify/static` により `node_modules/@mspec/web-ui/dist/` をサーブ、`/api/*` ルートをマウント、SPA catch-all を設定（T101 green） — files: `packages/cli/src/server/index.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-001 <!-- verify: human -->
        Change: mspec-web-ui

- [x] T113 `launchWebUiIfNeeded()` を実装: `require.resolve` で `@mspec/web-ui` を検出し、PID チェック → 起動/再利用/案内メッセージを分岐（T104/T105/T106 green） — files: `packages/cli/src/commands/new.ts`, `packages/cli/src/server/index.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/cli-integration/spec.md
        Requirements implemented: FR-001, FR-002, FR-003 <!-- verify: human -->
        Change: mspec-web-ui

- [x] T114 `routes/changes.ts` を実装: `packages/cli/src/lib/` および `packages/cli/src/workflow/` の既存関数を呼び出して未アーカイブチェンジを読み込み `ChangeInfo[]` を返す（T107 green） — files: `packages/cli/src/server/routes/changes.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
        Requirements implemented: FR-001 <!-- verify: fr-001 -->
        Change: mspec-web-ui

- [x] T115 `testResultParser.ts` を実装: `.json` → Playwright 形式、`.xml` → JUnit XML 形式と判別して `TestSuite[]` に正規化（T108 green） — files: `packages/cli/src/server/testResultParser.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md
        Requirements implemented: FR-001 <!-- verify: fr-001 -->
        Change: mspec-web-ui

- [x] T116 `routes/artifacts.ts` と `routes/testResults.ts` を実装 — files: `packages/cli/src/server/routes/artifacts.ts`, `packages/cli/src/server/routes/testResults.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-001 <!-- verify: human -->
        Change: mspec-web-ui

## Phase 3: User Story — フロントエンド実装

### Tests-first (E2E — Playwright)

- [ ] T201 E2E for change-dashboard FR-001/FR-002 "ダッシュボード: チェンジ一覧表示・ステップ進捗バーが 5 秒以内に反映" — files: `packages/web-ui/tests/e2e/dashboard.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
        Requirements implemented: FR-001, FR-002 <!-- verify: fr-002 -->
        Change: mspec-web-ui

- [ ] T202 E2E for change-dashboard FR-004 "チェンジ行クリックで詳細ページに遷移し URL が /changes/:id になる" — files: `packages/web-ui/tests/e2e/dashboard.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
        Requirements implemented: FR-004
        Change: mspec-web-ui

- [ ] T203 E2E for artifact-preview FR-001 "design.md が HTML にレンダリングされプレビューエリアに表示される" — files: `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-001 <!-- verify: human -->
        Change: mspec-web-ui

- [ ] T204 E2E for artifact-preview FR-002 "Mermaid ブロックが SVG ダイアグラムとして描画される" — files: `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-002 <!-- verify: fr-002 -->
        Change: mspec-web-ui

- [ ] T205 E2E for artifact-preview FR-003 "spec.md の SHALL/GIVEN キーワードが色分けハイライトされる" — files: `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-003 <!-- verify: fr-003 -->
        Change: mspec-web-ui

- [ ] T206 E2E for artifact-preview FR-005 "prototype.html が sandbox iframe でレンダリングされる" — files: `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-005 <!-- verify: fr-005 -->
        Change: mspec-web-ui

- [ ] T207 E2E for test-result-viewer FR-002/FR-003 "失敗テストが赤バッジで表示され、クリックでトレース展開される" — files: `packages/web-ui/tests/e2e/test-results.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md
        Requirements implemented: FR-002, FR-003 <!-- verify: fr-003 -->
        Change: mspec-web-ui

### Implementation

- [ ] T210 `Dashboard.tsx` + `StepProgress.tsx` + `ModeFilter.tsx` を実装（T201 green） — files: `packages/web-ui/src/pages/Dashboard.tsx`, `packages/web-ui/src/components/StepProgress.tsx`, `packages/web-ui/src/components/ModeFilter.tsx`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
        Requirements implemented: FR-001, FR-002, FR-003
        Change: mspec-web-ui

- [ ] T211 `ChangeDetail.tsx` を実装し React Router v7 で `/changes/:id` ルートに接続（T202 green） — files: `packages/web-ui/src/pages/ChangeDetail.tsx`, `packages/web-ui/src/router/index.tsx`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
        Requirements implemented: FR-004
        Change: mspec-web-ui

- [ ] T212 `ArtifactPreview.tsx` を `react-markdown + remark-gfm` で実装（T203 green） — files: `packages/web-ui/src/pages/ArtifactPreview.tsx`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-001 <!-- verify: human -->
        Change: mspec-web-ui

- [ ] T213 `MermaidRenderer.tsx` を実装: `mermaid.initialize()` + `mermaid.render()` で SVG 変換（T204 green） — files: `packages/web-ui/src/components/MermaidRenderer.tsx`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-002 <!-- verify: fr-002 -->
        Change: mspec-web-ui

- [ ] T214 `GherkinHighlight.tsx` を実装: SHALL/MUST を赤系、SHOULD/MAY を黄系、GIVEN/WHEN/THEN を緑系でハイライト（T205 green） — files: `packages/web-ui/src/components/GherkinHighlight.tsx`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-003 <!-- verify: fr-003 -->
        Change: mspec-web-ui

- [ ] T215 `PrototypeIframe.tsx` を実装: `sandbox="allow-scripts"` 属性付き `<iframe>` でプロトタイプ HTML を表示（T206 green） — files: `packages/web-ui/src/components/PrototypeIframe.tsx`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-005 <!-- verify: fr-005 -->
        Change: mspec-web-ui

- [ ] T216 `TestResults.tsx` を実装: green/red/skip バッジ一覧 + 失敗テストの折りたたみトレースパネル（T207 green） — files: `packages/web-ui/src/pages/TestResults.tsx`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004 <!-- verify: fr-003 -->
        Change: mspec-web-ui

- [ ] T217 `useChangesStore.ts`（Zustand）と `api/client.ts`（TanStack Query hooks、`refetchInterval: 3000`）を実装 — files: `packages/web-ui/src/store/useChangesStore.ts`, `packages/web-ui/src/api/client.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
        Requirements implemented: FR-002 <!-- verify: fr-002 -->
        Change: mspec-web-ui

## Phase 4: Polish

- [ ] T301 E2E for artifact-preview FR-004 "ダーク/ライトモード切り替えがページリロード後も保持される（LocalStorage）" — files: `packages/web-ui/tests/e2e/theme.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-004
        Change: mspec-web-ui

- [ ] T302 `ThemeToggle.tsx` を実装し LocalStorage で選択状態を永続化（T301 green） — files: `packages/web-ui/src/components/ThemeToggle.tsx`, `packages/web-ui/src/store/useChangesStore.ts`
      anchor:
        @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
        Requirements implemented: FR-004
        Change: mspec-web-ui

- [ ] T303 [P] `i18n/en.ts` の i18n スケルトンを実装: 全 UI 文字列をキーで管理できる構造を定義 — files: `packages/web-ui/src/i18n/en.ts`

- [ ] T304 [P] Playwright E2E 設定ファイルを作成し、`pnpm test:e2e` で実行できるように設定 — files: `packages/web-ui/playwright.config.ts`, `packages/web-ui/package.json`

- [ ] T305 [P] `packages/web-ui` の `pnpm build` 出力を確認し、CLI の `@fastify/static` が正しく `dist/` をサーブできることを手動確認

## Dependencies

- T110 → T101, T102, T103（green 確認）
- T111 → T112
- T112 → T113
- T113 → T104, T105, T106（green 確認）
- T114 → T107（green 確認）
- T115 → T108（green 確認）
- T116 → T203, T206, T207
- T210 → T201（green 確認）
- T211 → T202（green 確認）
- T212 → T203（green 確認）
- T213 → T204（green 確認）
- T214 → T205（green 確認）
- T215 → T206（green 確認）
- T216 → T207（green 確認）
- T217 → T201, T202（green 確認）
- T302 → T301（green 確認）

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| 原則 | Phase 0 | Phase 1 | Notes |
|------|---------|---------|-------|
| I ステップ独立性 | ✅ | — | tasks.md は design.md と checklist.md のみを参照して生成されている |
| II 決定論的マージ | ✅ | — | tasks.md は Reference ドキュメント。SoT spec にマージされない |
| III 質問駆動の要件確定 | ✅ | — | 全設計判断は proposal/research/design ステップで AskUserQuestion を経て確定済み |
| IV 双方向アンカー | ✅ | — | 全実装・E2E タスク（T101〜T302）に `@mspec-delta` アンカーを付与済み |
| V 強制ステップと拡張ステップの分離 | ✅ | — | tasks は全フロー変更での強制ステップ。スキップ不可 |

### Complexity Tracking

None
