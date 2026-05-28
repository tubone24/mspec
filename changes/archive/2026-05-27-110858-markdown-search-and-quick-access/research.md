---
doc_type: Reference
---

# Research: markdown-search-and-quick-access

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| 全文検索ライブラリ | **MiniSearch 7.2.0**（既存） | Fuse.js, Lunr | `packages/web-ui/package.json:28` に既に依存済み。追加ライブラリ不要 |
| AND条件の実現方法 | MiniSearch の `combineWith: 'AND'` | クエリを分割して個別 search → intersection | MiniSearch は `searchOptions` に `{ combineWith: 'AND' }` を渡すだけで AND 絞り込みが可能。リテラルマッチ要件（DoS対策）とも整合する |
| スニペット抽出方法 | クライアント側で `content` を行分割し、キーワードを含む行と前後2行を取り出す純粋関数 `extractSnippet(content, query, context=2)` を実装 | MiniSearch 組み込みスニペット機能 | MiniSearch はスニペット抽出を組み込みで持たない。本文は別途 Map でキャッシュして再フェッチ不要に |
| content キャッシュ方式 | **別途 `Map<id, content>` でキャッシュ**（storeFields には追加しない） | storeFields に content を追加 | メモリ消費を抑制するためユーザー決定。実装は複雑になるが Change 数が増えた際のスケーラビリティを優先 |
| スニペット表示の XSS 対策 | `textContent` のみ（HTML 未レンダリング） | `dangerouslySetInnerHTML` | Proposal で決定済み。既存 `HighlightText` コンポーネントと同じ方針 |
| スニペット行数制限 | **CSS `line-clamp: 3`** でクランプ | 行数制限なし / 折りたたみ式 | 視覚的整合性を優先。ChangeRow / SpecViewer サイドバー両方に適用 |
| OS 判定方式 | `navigator.userAgentData?.platform` 優先、非対応時は `navigator.platform` フォールバック | `navigator.userAgent` 文字列パース | UA 文字列をサーバーに送信しない。`userAgentData.platform` は Chromium 93+ で同期アクセス可能 |
| キーバインド登録 | `document.addEventListener('keydown', handler)` を `useEffect` でグローバル登録し、cleanup で `removeEventListener` | `onKeyDown` を特定要素に付与 | グローバル登録が VSCode ⌘K 相当の動作に必須。既存コードに keyboard shortcut の登録パターンなし（完全新規実装） |
| パレット mount 場所 | `App.tsx` の `QueryClientProvider` 直下に `<QuickAccessPalette>` を追加 | 各ページに個別実装 | `BrowserRouter` 外側でグローバルコンポーネントを置くのが最も単純。`useChanges` / `useSpecs` フックが同一 `QueryClient` を共有できる |
| 次Stepナビゲーション表示 | **直近更新の未完了Change 1件の次ステップのみ** | 全 in-progress Change の次ステップ一覧 | ユーザー決定。シンプルで焦点が絞れる。`/api/changes` の `updatedAt` で並び替え、`currentStep` が archive 未完了のものを取得 |

---

## Web References

- [MiniSearch API — SearchOptions.combineWith](https://lucaong.github.io/minisearch/types/MiniSearch.SearchOptions.html) — `combineWith: 'AND'` で全トークン必須マッチ。スニペット機能は組み込みなく `storeFields` で本文保持 or Map キャッシュが必要
- [MiniSearch GitHub — SearchResult type](https://github.com/lucaong/minisearch/blob/master/docs/types/MiniSearch.SearchResult.html) — `match` / `queryTerms` は返るが行コンテキストは含まない
- [navigator.userAgentData 利用ガイド](https://medium.com/@jortiz.dev/bye-navigator-platform-here-is-the-alternative-939b883bf050) — `navigator.userAgentData?.platform === 'macOS'` が推奨。Firefox/Safari は `navigator.platform` フォールバック必須
- [MDN — NavigatorUAData](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/getHighEntropyValues) — platform は低エントロピー値なので同期アクセス可。`getHighEntropyValues()` 不要
- [React keyboard shortcut hook パターン](https://www.taniarascia.com/keyboard-shortcut-hook-react/) — `useEffect` + `document.addEventListener('keydown')` + cleanup の実装ガイド
- [MiniSearch AND/OR combineWith — GitHub Issue #100](https://github.com/lucaong/minisearch/issues/100) — `combineWith: 'AND'` の動作と制限の確認

---

## Codebase Findings

**全文検索ライブラリ**
- `packages/web-ui/package.json:28` — `"minisearch": "^7.2.0"` が依存として存在

**既存 Search Index 実装**
- `packages/web-ui/src/lib/searchIndex.ts:1-45` — `createSearchIndex()` が `fields: ['name', 'title', 'summary', 'tags', 'content']` / `storeFields: ['changeId']` で定義。`content` はインデックスされるが **storeFields 未登録**（別途 Map キャッシュが必要）
- `packages/web-ui/src/lib/specSearchIndex.ts:1-24` — `createSpecSearchIndex()` が `fields: ['capability', 'content']` / `storeFields: ['capability']` で定義。同様に `content` は storeFields 未登録
- `packages/web-ui/src/hooks/useSearchIndex.ts:31-75` — `buildIndex()` で `CONCURRENCY=5` の並列フェッチ。各アーティファクトの `content` を `idx.add(doc)` に渡すが結果には返却されない
- `packages/web-ui/src/hooks/useSpecSearchIndex.ts:25-43` — `buildSpecIndex()` も同じパターン

**SpecViewer 検索コンポーネント**
- `packages/web-ui/src/pages/SpecViewer.tsx:67-75` — `<Search>` コンポーネントを使用。`inputTestId="spec-search-input"` / `clearTestId="spec-search-clear"`
- `packages/web-ui/src/pages/SpecViewer.tsx:39-42` — `filteredSpecs` は `index.search(debouncedQuery).map((r) => ({ capability: r.id }))` — **スニペットなし**

**Changes ダッシュボード検索**
- `packages/web-ui/src/pages/Dashboard.tsx:75` — `useSearchIndex(changes)` を呼び出し
- `packages/web-ui/src/pages/Dashboard.tsx:88-101` — `scoreMap` で changeId ごとにスコア集計。スニペット表示なし
- `packages/web-ui/src/pages/Dashboard.tsx:150` — `<Search value={q} onChange={setQ} />` が AppBar の `right` prop に渡される

**Search コンポーネント**
- `packages/web-ui/src/components/Search.tsx:57-59` — ⌘K のキーボードヒントを**装飾として**既に表示中（実際のキーバインドは未実装）

**キーボードショートカット**
- `packages/web-ui/src` 全体 — `keydown` / `metaKey` / `ctrlKey` / `addEventListener` のパターンは**一切存在しない**（完全新規実装が必要）

**ルーター / アプリ構造**
- `packages/web-ui/src/App.tsx:17-23` — `<QueryClientProvider>` → `<AppRouter>` の2層構造。パレットは `QueryClientProvider` 直下に追加で全ページ有効
- `packages/web-ui/src/router/index.tsx:15-28` — Routes は `/`, `/changes/:id`, `/spec-viewer`, `/spec-viewer/:capability` の4系統

**i18n / 状態管理**
- `packages/web-ui/src/i18n/en.ts:11-61` — `quickAccessPalette` キーは未存在（追加が必要）
- `packages/web-ui/src/store/useChangesStore.ts` — Zustand store には `theme` のみ。パレット open/close 状態はローカル `useState` か新規 store で管理する

**サーバー API（クイックアクセス用データ源）**
- `packages/cli/src/server/routes/specs.ts:14-29` — `GET /api/specs` → `[{ capability: string }]` — パレット内 Spec 一覧に利用可
- `packages/cli/src/server/routes/changes.ts:29-66` — `GET /api/changes` → `ChangeInfo[]`（`currentStep` / `updatedAt` 含む）— パレット内 Change 一覧・次ステップナビゲーションに利用可

**E2E テストパターン**
- `packages/web-ui/tests/e2e/spec-viewer.e2e.test.ts` — `data-testid="spec-search-input"` / `spec-search-clear` / `spec-no-results` / `capability-item` の testid を使用
- `packages/web-ui/tests/e2e/web-ui-search.e2e.test.ts` — `input[placeholder*="Search"]` / `[data-testid^="change-row-"]` で検索テスト
- クイックアクセスパレット用 E2E ファイルは**存在しない**（新規作成必要）

---

## Open Choices（全て解決済み）

| # | 質問 | 決定 |
|---|------|------|
| 1 | スニペット表示の行数制限 | CSS `line-clamp: 3` でクランプ（リスト高さの視覚的整合性優先） |
| 2 | `storeFields` への `content` 追加の可否 | 別途 `Map<id, content>` でキャッシュ（メモリ消費抑制優先） |
| 3 | 次Step ナビゲーションの表示対象 | 直近更新の未完了 Change 1件の次ステップのみ表示 |

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK — research はコードベース分析のみ。実装への変更なし | — |
| II 決定論的マージ | OK — research.md は新規追加ファイルのみ | — |
| III 質問駆動の要件確定 | OK — Open Choices を AskUserQuestion で全件解決済み | — |
| IV 双方向アンカー | OK — アンカーは delta ステップで付与済み | — |
| V 強制ステップと拡張ステップの分離 | OK — research は調査ステップ。強制ステップフローを変えない | — |
| VI Security by Default | OK — UA 文字列のサーバー送信なし、textContent のみ使用、ReDoS 回避（combineWith:'AND' + リテラルマッチ）を確認済み | — |
