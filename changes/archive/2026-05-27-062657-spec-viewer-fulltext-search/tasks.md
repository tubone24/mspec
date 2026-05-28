---
doc_type: How-to
---

<!-- @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007 -->
<!-- Change: spec-viewer-fulltext-search -->

# Tasks: Spec Viewer Full-Text Search

## Phase 1 — Setup

### T-001: i18n キーを `en.ts` に追加

`src/i18n/en.ts` の `specViewer` オブジェクトに以下を追加する：
- `searchPlaceholder: 'Search specs…'`
- `noResults: 'No capabilities found.'`
- `buildingIndex: 'Building index…'`

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-001, FR-006
  Change: spec-viewer-fulltext-search
```
<!-- verify: fr-001 -->

## Phase 2 — Foundational

### T-002: `lib/specSearchIndex.ts` を新規作成

`src/lib/specSearchIndex.ts` を作成し以下を定義する：
- `SpecSearchDocument` インタフェース（`id`, `capability`, `content` フィールド）
- `createSpecSearchIndex()` 関数（`lib/searchIndex.ts` の `tokenize` を import 再利用、`fields: ['capability', 'content']`、`boost: { capability: 3, content: 1 }`）

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-002
  Change: spec-viewer-fulltext-search
```
<!-- verify: fr-002 -->

### T-003: `hooks/useDebounce.ts` を新規作成

`src/hooks/useDebounce.ts` に `useDebounce<T>(value: T, delay: number): T` hook を実装する（`useState` + `useEffect` + `clearTimeout`、10 行以内）。

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-003
  Change: spec-viewer-fulltext-search
```
<!-- verify: fr-003 -->

### T-004: `hooks/useSpecSearchIndex.ts` を新規作成

`src/hooks/useSpecSearchIndex.ts` に `useSpecSearchIndex(capabilities: SpecCapability[])` hook を実装する：
- `/spec-viewer` ロード時（`capabilities` が非空になった時点）に即時インデックス構築を開始する
- `CONCURRENCY = 5` のバッチで `GET /api/specs/:capability` を並列フェッチする
- `createSpecSearchIndex()` でインデックスを構築し `{ index, isBuilding, error }` を返す
- `isBuilding` 中は `en.specViewer.buildingIndex` メッセージを表示できるよう状態を公開する

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-002
  Change: spec-viewer-fulltext-search
```
<!-- verify: fr-002 -->

### T-005: `components/HighlightText.tsx` を新規作成

`src/components/HighlightText.tsx` に `<HighlightText text query />` コンポーネントを実装する：
- `escapeRegExp(query)` で正規表現エスケープ処理を行う
- 空クエリまたは空白のみの場合は `text` をそのまま表示する
- マッチ部分を `<mark>` タグでラップして返す

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-004
  Change: spec-viewer-fulltext-search
```

### T-006: `lib/rehypeMarkText.ts` を新規作成

`src/lib/rehypeMarkText.ts` に `rehypeMarkText(query: string)` rehype プラグインを実装する：
- 空クエリ・空白のみの場合は no-op を返す
- `escapeRegExp(query)` で正規表現エスケープ処理を行う
- `unist-util-visit` で AST を走査し、`pre`・`code`・`language-mermaid` クラスを持つ要素の subtree はスキップする（D-06）
- テキストノードをクエリで分割し、一致部分を `<mark>` 要素ノードに変換する

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-006
  Change: spec-viewer-fulltext-search
```

## Phase 3 — User Story

### T-007: E2E T404 を記述（赤フェーズ）

`tests/e2e/spec-viewer.e2e.test.ts` に以下の失敗テストを追加する：

```ts
// T404: spec-viewer-search FR-001 — 検索ボックスが表示される
test('Spec Viewer: search box is visible', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-testid="spec-search-input"]')).toBeVisible();
});
```

`mspec test --expect-red T-007 --change 2026-05-27-062657-spec-viewer-fulltext-search` で赤を記録すること。

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-001
  Change: spec-viewer-fulltext-search
```
<!-- verify: fr-001 -->

### T-008: `Search.tsx` を拡張してサイドバーに検索ボックスを組み込む（T404 を緑に）

1. `src/components/Search.tsx` に `placeholder?: string`・`onClear?: () => void` props を追加する
   - × ボタンは `onClear` が渡されている場合かつ `value` が空でない場合のみ表示する（D-08）
2. `src/pages/SpecViewer.tsx` のサイドバー `<h2>` 直下に `<Search>` を配置する
   - `data-testid="spec-search-input"` を input 要素に付与する
   - `placeholder={en.specViewer.searchPlaceholder}` を渡す

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-001
  Change: spec-viewer-fulltext-search
```
<!-- verify: fr-001 -->

### T-009: E2E T405–T409 を記述（赤フェーズ）

`tests/e2e/spec-viewer.e2e.test.ts` に以下の失敗テストを追加する：

```ts
// T405: spec-viewer-search FR-002/FR-003 — 検索でフィルタリングされる
test('Spec Viewer: search filters capability list', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  const input = page.locator('[data-testid="spec-search-input"]');
  await input.fill('full-text');
  await page.waitForTimeout(300);
  const items = page.locator('[data-testid="capability-item"]');
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(10);
});

// T406: spec-viewer-search FR-007 — × ボタンでリセット
test('Spec Viewer: clear button resets search', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  const input = page.locator('[data-testid="spec-search-input"]');
  await input.fill('full-text');
  await page.waitForTimeout(300);
  await page.locator('[data-testid="spec-search-clear"]').click();
  const items = page.locator('[data-testid="capability-item"]');
  expect(await items.count()).toBeGreaterThan(10);
});

// T407: spec-viewer-search FR-006 — 結果なし時のメッセージ
test('Spec Viewer: shows no-results message', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="spec-search-input"]').fill('xyzzy-nonexistent-9999');
  await page.waitForTimeout(300);
  await expect(page.locator('[data-testid="spec-no-results"]')).toBeVisible();
});

// T408: spec-viewer-search FR-004 — サイドバーにハイライト表示
test('Spec Viewer: capability name highlight shown in sidebar', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="spec-search-input"]').fill('search');
  await page.waitForTimeout(300);
  const mark = page.locator('[data-testid="capability-item"] mark').first();
  await expect(mark).toBeVisible();
});

// T409: spec-viewer-search FR-005 — 大文字クエリでもヒット
test('Spec Viewer: search is case-insensitive', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="spec-search-input"]').fill('FR-001');
  await page.waitForTimeout(300);
  const items = page.locator('[data-testid="capability-item"]');
  expect(await items.count()).toBeGreaterThan(0);
});
```

`mspec test --expect-red T-009 --change 2026-05-27-062657-spec-viewer-fulltext-search` で赤を記録すること。

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-002, FR-003, FR-004, FR-005, FR-006, FR-007
  Change: spec-viewer-fulltext-search
```
<!-- verify: fr-002 -->
<!-- verify: fr-003 -->

### T-010: `SpecViewer.tsx` にフルテキスト検索を統合（T405–T409 を緑に）

`src/pages/SpecViewer.tsx` を以下の通り更新する：

1. `useSpecSearchIndex(specs ?? [])` を呼び出してインデックスを取得する
2. `useDebounce(query, 200)` で debounce 済みクエリを生成する
3. `useMemo` でフィルタ済み capability リストを算出する（インデックスなしの場合は全件）
4. サイドバーの capability 名を `<HighlightText text={s.capability} query={debouncedQuery} />` でレンダリングする
5. フィルタ結果が空の場合は `data-testid="spec-no-results"` を持つメッセージを表示する
6. `<Search onClear={() => setQuery('')} />` で × ボタンによるリセットを接続する
7. `ReactMarkdown` の `rehypePlugins` 配列末尾に `rehypeMarkText(debouncedQuery)` を追加する（D-09: `rehypeGherkinEars` の後）

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007
  Change: spec-viewer-fulltext-search
```
<!-- verify: fr-001 -->
<!-- verify: fr-002 -->
<!-- verify: fr-003 -->

## Phase 4 — Polish & Verification

### T-011: 既存 E2E テスト（T401–T403）のリグレッション確認

`tests/e2e/spec-viewer.e2e.test.ts` の既存テスト T401–T403 がすべて green のままであることを確認する。
特に `Search.tsx` の props 追加が Dashboard の検索 UI に影響していないことを確認する。

```
anchor:
  @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
  Requirements implemented: FR-001
  Change: spec-viewer-fulltext-search
```
<!-- verify: fr-001 -->

### T-012: TypeScript ビルドエラーが 0 件であることを確認

```bash
pnpm --filter web-ui tsc --noEmit
```

新規ファイルの型定義（`SpecSearchDocument`・`useSpecSearchIndex` の戻り型など）が正しく解決されることを確認する。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|---|---|---|
| I. ステップ独立性 | ✅ tasks.md は design/checklist に依存するが独立した成果物 | — |
| II. 決定論的マージ | ✅ 新規 capability spec-viewer-search のみ | — |
| III. 質問駆動の要件確定 | ✅ proposal/research/design/self-review で要件確定済み | — |
| IV. 双方向アンカー | ✅ 全タスクに `@mspec-delta` アンカーブロックを記載 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ 実装タスクのみ記載、ワークフロー変更なし | — |
| VI. Security by Default | ✅ escapeRegExp / rehype スキップルールがタスクに明記済み | — |

<!-- LEARNING: E2E テストタスク（T-007, T-009）を実装タスクより前に配置する TDD 順序パターンは spec-viewer 系の新規ページ機能追加で有効 | source: FR-001 | confidence: high -->
