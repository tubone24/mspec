---
doc_type: Reference
---

# Tasks: web-ui-enhancements

## Phase 1 — Setup（型定義・翻訳キー）

### T1.1 — `client.ts` の型拡張（`ChangeInfo.isArchived` + `ArtifactFile.docType`）

`packages/web-ui/src/api/client.ts` を修正する。

- `ChangeInfo` インターフェースに `isArchived: boolean` フィールドを追加する
- `ArtifactFile` インターフェースに `docType?: 'Reference' | 'Explanation' | 'How-to' | 'Tutorial'` フィールドを追加する
- `useChanges(showArchived = false)` 関数シグネチャを追加し、`showArchived=true` のとき `?includeArchived=true` クエリを付与する
- `useSpecs()` フックを追加する（`GET /api/specs` → `SpecCapability[]`、`refetchInterval` なし）
- `useSpecContent(capability: string)` フックを追加する（`GET /api/specs/:capability` → `string`、`enabled: !!capability`）
- `SpecCapability` インターフェースを追加する（`{ capability: string }`）

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
Requirements implemented: FR-008, FR-009
Change: web-ui-enhancements
```
<!-- verify: fr-008 -->

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/artifact-preview/spec.md
Requirements implemented: FR-011
Change: web-ui-enhancements
```

### T1.2 — `en.ts` 翻訳キー追加

`packages/web-ui/src/i18n/en.ts` を修正する。

- `dashboard.showArchived` キーを追加する（例: `"Show archived"`）
- `dashboard.archivedBadge` キーを追加する（例: `"Archived"`）
- `specViewer.title` キーを追加する（例: `"Spec Viewer"`）
- `specViewer.selectCapability` キーを追加する（例: `"Select a capability"`）

---

## Phase 2 — Foundational（サーバーサイド実装）

### T2.1 — `changes.ts` アーカイブフィルター対応

`packages/cli/src/server/routes/changes.ts` を修正する。

- `GET /api/changes` ハンドラーで `req.query.includeArchived === 'true'` のとき `listChanges(paths, { includeArchived: true })` を呼ぶ分岐を追加する（デフォルトは `false`）
- レスポンスの各チェンジオブジェクトに `isArchived: c.isArchived` フィールドを追加する（フィルター ON/OFF に関わらず常に返す）

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
Requirements implemented: FR-008
Change: web-ui-enhancements
```
<!-- verify: fr-008 -->

### T2.2 — `artifacts.ts` `collectArtifacts` に `docType` 解析追加

`packages/cli/src/server/routes/artifacts.ts` を修正する。

- `collectArtifacts` 関数内で、`.md` ファイルの場合は `readFile` でファイル内容を読み込み、正規表現 `/^doc_type:\s*(.+)$/m` で `doc_type` 値を抽出する
- 抽出できた場合は `docType` フィールドとして結果配列に含め、抽出できない場合は `docType: undefined` とする
- 非 `.md` ファイル（`.jsonl` 等）は読み込みスキップし `docType: undefined` を返す

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/artifact-preview/spec.md
Requirements implemented: FR-011
Change: web-ui-enhancements
```

### T2.3 — `specs.ts` 新規作成（`GET /api/specs` + `GET /api/specs/:capability`）

`packages/cli/src/server/routes/specs.ts` を新規作成する。

- `registerSpecsRoutes(app: FastifyInstance, root: string)` をエクスポートする
- `GET /api/specs`: `paths.specsDir` 配下を `readdir` し、各サブディレクトリ名を `capability` として `SpecCapability[]` を返す（`spec.md` が存在しないディレクトリは除外する）
- `GET /api/specs/:capability`: `join(paths.specsDir, capability, 'spec.md')` を構築し、**`fullPath.startsWith(paths.specsDir + path.sep)` でパストラバーサルを防止**（失敗時は 403）してから raw text を返す（`Content-Type: text/plain; charset=utf-8`）

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
Requirements implemented: FR-009
Change: web-ui-enhancements
```
<!-- verify: fr-009 -->

### T2.4 — `server/index.ts` に `registerSpecsRoutes` を登録

`packages/cli/src/server/index.ts` を修正する。

- `registerSpecsRoutes` を import して `registerArtifactsRoutes` の近くで呼び出す

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
Requirements implemented: FR-009
Change: web-ui-enhancements
```
<!-- verify: fr-009 -->

---

## Phase 3 — User Story（テストファースト → 実装）

### T3.1 — [E2E] アーカイブフィルタートグルの Playwright テスト（FR-008）

E2E テストファイルに以下のテストを追加する（実装前に作成し、red → green のサイクルで確認する）。

- `data-testid="filter-archived"` が存在する
- クリック後に URL クエリパラメータに `showArchived=true` が含まれる
- アーカイブ済みチェンジが存在する場合、一覧に表示される

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
Requirements implemented: FR-008
Change: web-ui-enhancements
```
<!-- verify: fr-008 -->

### T3.2 — [IMPL] `Dashboard.tsx` アーカイブフィルター実装

`packages/web-ui/src/pages/Dashboard.tsx` を修正する。

- `useSearchParams` を import し `showArchived = searchParams.get('showArchived') === 'true'` で状態を取得する
- `useChanges(showArchived)` を呼び出す（T1.1 で追加したシグネチャを使用）
- `ModeFilter` の下に `<button data-testid="filter-archived">` を追加し、クリックで `setSearchParams` を切り替える
- `isArchived: true` の行には `opacity-60 italic` スタイルと「アーカイブ済み」バッジを適用する

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
Requirements implemented: FR-008
Change: web-ui-enhancements
```
<!-- verify: fr-008 -->

### T3.3 — [E2E] SoT Spec ビューアーの Playwright テスト（FR-009）

E2E テストファイルに以下のテストを追加する（実装前に作成する）。

- ダッシュボードヘッダーの「Spec Viewer」リンクが存在し、クリックで `/spec-viewer` に遷移する
- `/spec-viewer` で capability 一覧が表示される（少なくとも 1 件以上）
- capability をクリックすると右ペインに Markdown 内容が表示される

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
Requirements implemented: FR-009
Change: web-ui-enhancements
```
<!-- verify: fr-009 -->

### T3.4 — [IMPL] `SpecViewer.tsx` 新規作成

`packages/web-ui/src/pages/SpecViewer.tsx` を新規作成する。

- `useParams<{ capability?: string }>()` でルートパラメータを取得する
- `useSpecs()` で capability 一覧を取得し、左ペインに `<ul>/<li>` でリスト表示する
- 選択中の capability は `<Link to={`/spec-viewer/${cap.capability}`}>` でナビゲート
- `useSpecContent(capability)` で取得した raw text を `<ArtifactViewer>` 相当の react-markdown でレンダリングする
- レイアウトは CSS Grid `grid-cols-[240px_1fr]`、左ペインは `overflow-auto`、右ペインは Markdown エリア

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
Requirements implemented: FR-009
Change: web-ui-enhancements
```
<!-- verify: fr-009 -->

### T3.5 — [IMPL] `AppRouter` に `/spec-viewer` ルート追加

`packages/web-ui/src/router/index.tsx` を修正する。

- `SpecViewer` を import する
- `<Route path="/spec-viewer" element={<SpecViewer />} />` を追加する
- `<Route path="/spec-viewer/:capability" element={<SpecViewer />} />` を追加する

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
Requirements implemented: FR-009
Change: web-ui-enhancements
```
<!-- verify: fr-009 -->

### T3.6 — [IMPL] Dashboard ヘッダーに「Spec Viewer」リンク追加

`packages/web-ui/src/pages/Dashboard.tsx` を修正する。

- `<header>` 内の `<ThemePicker />` の左側に `<Link to="/spec-viewer">` を追加する
- テキストは `en.specViewer.title` を使用する

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
Requirements implemented: FR-009
Change: web-ui-enhancements
```
<!-- verify: fr-009 -->

### T3.7 — [IMPL] `ChangeDetail.tsx` に DockType 色付け追加（FR-011）

`packages/web-ui/src/pages/ChangeDetail.tsx` を修正する。

- `docTypeColor(docType?: string): string` 純関数を追加する（スイッチ式でカラークラスを返す）:
  - `Reference` → `bg-blue-50 border-l-4 border-blue-300 dark:bg-blue-950 dark:border-blue-700`
  - `Explanation` → `bg-purple-50 border-l-4 border-purple-300 dark:bg-purple-950 dark:border-purple-700`
  - `How-to` → `bg-green-50 border-l-4 border-green-300 dark:bg-green-950 dark:border-green-700`
  - `Tutorial` → `bg-yellow-50 border-l-4 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700`
  - default → `bg-gray-50 border-l-4 border-gray-200 dark:bg-gray-800 dark:border-gray-600`
- artifact 行の `<button>` に `docTypeColor(a.docType)` クラスを追加する（`px-2 py-1 rounded` も付与して視認性を確保）

```
anchor:
@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/artifact-preview/spec.md
Requirements implemented: FR-011
Change: web-ui-enhancements
```

---

## Phase 4 — Polish（動作確認・アンカー検証）

### T4.1 — ダークモード時の DockType 色付け確認

- ダークモードに切り替えて各 doc_type の色が視認できることを目視確認する
- `dark:bg-*` クラスが正しく適用されていることをブラウザの DevTools で確認する

### T4.2 — `mspec validate` でアンカーチェック確認

- `mspec validate --change 2026-05-26-083855-web-ui-enhancements` を実行して warning/error がないことを確認する
- 全実装ファイルに `@mspec-delta` アンカーコメントが付与されていることを確認する

---

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I. ステップ独立性 | ✅ tasks.md は design.md と checklist.md のみを参照する |
| II. 決定論的マージ | ✅ FR-008/009/011 への ADDED アンカーのみ |
| III. 質問駆動 | ✅ 未解決の Open Choices はない |
| IV. 双方向アンカー | ✅ 全タスクに `anchor:` ブロック付き（T4.2 で確認） |
| V. 強制/拡張分離 | ✅ 各機能が独立タスクとして分離されている |
| VI. Security by Default | ✅ T2.3 に `startsWith(specsDir + path.sep)` チェックを明記 |
