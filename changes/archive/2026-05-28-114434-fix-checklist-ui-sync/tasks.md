---
doc_type: Tutorial
---

# Tasks: fix-checklist-ui-sync

## Phase 1: Setup

- [x] ビルドとテストがクリーンな状態であることを確認する

  ```bash
  cd packages/cli && pnpm test --run 2>&1 | tail -5
  cd packages/web-ui && pnpm build 2>&1 | tail -5
  ```

- [x] `packages/cli/src/server/routes/artifacts.ts` の現行 import 行を確認する（`writeFile` がないこと）

  ```bash
  head -15 packages/cli/src/server/routes/artifacts.ts
  ```

## Phase 2: Foundational

### backend — FR-007 PATCH エンドポイント

- [x] **[E2E]** `routes.artifacts.test.ts` に PATCH 用テストケースを追加する（実装前 → RED を確認）
  - Scenario A: 有効な change ID + `text/plain` コンテンツ → 200 OK、`checklist.md` が書き換わる
  - Scenario B: 存在しない change ID → 404、ファイルは変化しない
  - Scenario C: 異なる URL (`PATCH /api/changes/:id/artifacts/design.md`) → 404（ルート未登録）
  <!-- verify: fr-007 -->

  ```
  @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/web-ui-server/spec.md
  Requirements implemented: FR-007
  Change: fix-checklist-ui-sync
  ```

- [x] **[実装]** `packages/cli/src/server/routes/artifacts.ts` に PATCH ルートを追加する
  - `import { readFile, readdir, stat, writeFile } from 'node:fs/promises'` に `writeFile` を追加
  - `registerArtifactsRoutes` 内で `app.addContentTypeParser('text/plain', { parseAs: 'string' }, (_req, body, done) => done(null, body))` を登録
  - `PATCH /api/changes/:id/artifacts/checklist.md` ルートを追加:
    - `findChange` で change を取得 → 存在しなければ 404
    - `join(change.dir, 'checklist.md')` でパスを構築（可変パス引数なし）
    - `writeFile(fullPath, req.body as string, 'utf8')` で書き込み
    - `reply.send({ ok: true })` で 200 を返す
  <!-- verify: fr-007 -->

  ```
  @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/web-ui-server/spec.md
  Requirements implemented: FR-007
  Change: fix-checklist-ui-sync
  ```

- [x] テストを再実行して GREEN を確認する

  ```bash
  cd packages/cli && pnpm test --run src/server/__tests__/routes.artifacts.test.ts
  ```

### frontend — FR-013 チェックボックス初期化と永続化

- [x] **[E2E]** `buildUpdatedChecklist` ヘルパーのユニットテストを書く（実装前 → RED を確認）
  - Input: `"- [ ] A\n- [x] B\n- [ ] C"`, idx=2, checked=true → `"- [ ] A\n- [x] B\n- [x] C"`
  - Input: `"- [x] A"`, idx=0, checked=false → `"- [ ] A"`
  - Input: 非チェックボックス行を含む場合もインデックスが正しくズレないこと
  <!-- verify: fr-013 -->

  ```
  @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/artifact-preview/spec.md
  Requirements implemented: FR-013
  Change: fix-checklist-ui-sync
  ```

- [x] **[E2E]** `ArtifactViewer` コンポーネントテスト: `checklist.md` を `content` として渡すと `- [x]` 項目が初期チェック済みで表示されることを確認する（checklist-persist.e2e.test.ts で reload アサーションとしてカバー）
  <!-- verify: fr-013 -->

  ```
  @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/artifact-preview/spec.md
  Requirements implemented: FR-013
  Change: fix-checklist-ui-sync
  ```

- [x] **[実装]** `packages/web-ui/src/api/client.ts` に `usePatchChecklistItem` を追加する
  - `useQueryClient` を `@tanstack/react-query` から追加でインポート
  - `useMutation<void, Error, string>` で実装:
    - `mutationFn`: `fetch('/api/changes/${changeId}/artifacts/${relativePath}', { method: 'PATCH', headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: updatedContent })` → 非 OK は `throw new Error`
    - `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['artifact-content', changeId, relativePath] })`
  <!-- verify: fr-013 -->

  ```
  @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/artifact-preview/spec.md
  Requirements implemented: FR-013
  Change: fix-checklist-ui-sync
  ```

- [x] **[実装]** `packages/web-ui/src/components/ArtifactViewer.tsx` を修正する
  - `useEffect` を `react` から追加でインポート
  - `usePatchChecklistItem` を `../api/client.js` からインポート
  - `buildUpdatedChecklist(content: string, idx: number, checked: boolean): string` ヘルパーを関数として追加:
    - `content.split('\n')` で行分割
    - チェックボックス行（`/^- \[[ x]\]/`）のみカウントしてインデックス管理
    - `idx` 番目の行を `- [x]` または `- [ ]` に書き換えて `join('\n')`
  - `const patchMutation = usePatchChecklistItem(changeId, relativePath)` を追加
  - `useEffect(() => { ... }, [content, relativePath])` で `- [x]` パターンから初期 `Set<number>` を構築して `setCheckedItems` を呼ぶ
  - `onChange` ハンドラ内に PATCH 呼び出しを追加:
    - `relativePath.endsWith('checklist.md')` ガードの後
    - `const updated = buildUpdatedChecklist(content, idx, !checkedItems.has(idx))`
    - `patchMutation.mutate(updated)`
  <!-- verify: fr-013 -->

  ```
  @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/artifact-preview/spec.md
  Requirements implemented: FR-013
  Change: fix-checklist-ui-sync
  ```

- [x] テストを再実行して GREEN を確認する

  ```bash
  cd packages/web-ui && pnpm test --run
  ```

## Phase 3: User Story

- [ ] **[手動 E2E]** Web UI を起動し、`checklist.md` が存在するチェンジを開いて動作を確認する
  <!-- verify: human -->

  確認手順:
  1. `mspec new test-e2e-checklist` でテスト用チェンジを作成
  2. `mspec checklist` でサンプル `checklist.md` を生成
  3. ブラウザで Web UI (http://localhost:3847) を開く
  4. チェンジを選択し `checklist.md` を開く
  5. 未チェック項目をクリック → チェックが入る
  6. ページをリロード → チェック状態が保持されている（ファイルに永続化済み）
  7. チェック済み項目をクリック → チェックが外れる
  8. リロード → アンチェック状態が保持されている

- [ ] **[回帰確認]** FR-006 の既存チェックボックストグル動作（UI 上の ON/OFF）が壊れていないことを確認する
  <!-- verify: human -->

- [ ] **[回帰確認]** `checklist.md` 以外のアーティファクト（`design.md`, `research.md` 等）を開いたときに PATCH が呼ばれないことを確認する（ Network タブで確認）
  <!-- verify: human -->

## Phase 4: Polish

- [ ] `mspec anchor check --change 2026-05-28-114434-fix-checklist-ui-sync` を実行してアンカー解決エラーがないことを確認する

  ```bash
  mspec anchor check --change 2026-05-28-114434-fix-checklist-ui-sync
  ```

- [ ] TypeScript の型エラーがないことを確認する

  ```bash
  cd packages/web-ui && pnpm tsc --noEmit
  cd packages/cli && pnpm tsc --noEmit
  ```

- [ ] `mspec validate --change 2026-05-28-114434-fix-checklist-ui-sync` を実行する

---

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I — ステップ独立性 | ✅ tasks.md は design.md と checklist.md のみ参照。実装詳細に依存しない |
| II — 決定論的マージ | ✅ アンカーブロックは FR-007 / FR-013 のみ参照。既存要件と競合なし |
| III — 質問駆動の要件確定 | ✅ 全設計判断は research.md で確定済み |
| IV — 双方向アンカー | ✅ 全実装・E2E タスクに `@mspec-delta` アンカーブロックあり |
| V — 強制ステップと拡張ステップの分離 | ✅ tasks.md は実装フェーズのみ対象 |
| VI — Security by Default | ✅ Phase 3 に PATCH が checklist.md 固定であることの手動確認タスクあり |
