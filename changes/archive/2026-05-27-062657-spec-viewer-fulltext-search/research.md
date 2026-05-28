---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007 -->
<!-- Change: spec-viewer-fulltext-search -->

# Research: Spec Viewer Full-Text Search

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|---|---|---|---|
| 検索ライブラリ | MiniSearch（既存依存を再利用） | Fuse.js / FlexSearch / ネイティブ `Array.filter` | `minisearch@^7.2.0` が `package.json` に既に存在。ダッシュボード検索と同じ実装パターンを踏襲でき、追加バンドルコストゼロ |
| インデックス構築方針 | 起動時に全 spec.md をフェッチしてクライアントサイドでインデックス構築 | サーバーサイドインデックス / 都度検索 | `GET /api/specs/:capability` が平文テキストを返す。40〜60 件 × 約 5–10 KB = 最大 600 KB 程度。クライアントサイドで十分処理可能 |
| debounce 実装 | カスタム `useDebounce<T>(value, delay)` hook（`useState` + `useEffect` + `setTimeout`） | lodash.debounce / usehooks-ts | プロジェクトに既存 debounce ユーティリティなし。外部依存を増やさず 10 行以内で実装可能 |
| ハイライト実装 | `<mark>` タグを使うカスタム `Highlight` コンポーネント（regex で split） | react-highlight-words ライブラリ | 既存コードに `react-highlight-words` 依存なし。capability 名のみのサイドバー表示に限定すれば regex split で十分 |
| インデックス再利用 | `useSpecs()` + 各 capability の `fetch('/api/specs/:capability')` を並列実行 | `useSearchIndex` (changes 用) を流用 | changes 用フックは `ChangeInfo[]` 専用のデータ形状を持つ。spec 用の新規フック `useSpecSearchIndex` を分離するほうが保守性が高い |
| 検索スコープ | capability 名 + spec.md 全文（見出し・本文・FR 番号） | capability 名のみ | FR-002 で全 spec.md のインデックス構築が明示要件 |

## Web References

- [MiniSearch — npm](https://www.npmjs.com/package/minisearch) — v7.2.0、週間 DL 約 130 万回。ブラウザ/Node 向け軽量全文検索エンジン
- [MiniSearch API Docs](https://lucaong.github.io/minisearch/classes/MiniSearch.MiniSearch.html) — `search()`、`MatchInfo` 型、カスタム `tokenize` オプションの公式リファレンス
- [MiniSearch MatchInfo 型](https://lucaong.github.io/minisearch/types/MiniSearch.MatchInfo.html) — `{ [term]: string[] }` 形式でマッチしたフィールド名を返す。ハイライト位置は含まないため独自処理が必要
- [Highlighting Matches Issue #37 (GitHub)](https://github.com/lucaong/minisearch/issues/37) — MiniSearch 本体にハイライト API はなく、クエリトークンを regex で本文に適用する方法が推奨されている
- [useDebounce — usehooks.com](https://usehooks.com/usedebounce) — `useState` + `useEffect` + `clearTimeout` を使う標準的な 10 行実装のリファレンス
- [react-highlight-words — npm](https://www.npmjs.com/package/react-highlight-words) — 検討した代替案。今回は未採用（新規依存コスト > 実装コスト）

## Codebase Findings

- `packages/web-ui/package.json:27` — `"minisearch": "^7.2.0"` が既に `dependencies` に存在。追加インストール不要
- `packages/web-ui/src/lib/searchIndex.ts:5` — `import MiniSearch from 'minisearch'` および `createSearchIndex()` 関数。フィールド `['name', 'title', 'summary', 'tags', 'content']` と日本語対応 `Intl.Segmenter` tokenizer を使用
- `packages/web-ui/src/hooks/useSearchIndex.ts:77` — `useSearchIndex(changes: ChangeInfo[])` は changes 専用。spec 検索には `useSpecSearchIndex(capabilities: string[])` を新規作成する必要がある
- `packages/web-ui/src/components/Search.tsx:6` — `<Search value onChange />` コンポーネントが存在するが、ダッシュボード用（placeholder「Search changes, tags…」）。Spec Viewer 用に新コンポーネントまたは props 拡張が必要
- `packages/web-ui/src/pages/SpecViewer.tsx:41` — サイドバーは `<aside>` 内の `<ul>` に capability リンクを列挙するだけ。検索 `<input>` を挿入するスペースは `<h2>` の直下
- `packages/web-ui/src/api/client.ts:78` — `useSpecs()` は `GET /api/specs` → `SpecCapability[]`（`{ capability: string }[]`）。`useSpecContent(capability)` は `GET /api/specs/:capability` → raw markdown text
- `packages/cli/src/server/routes/specs.ts:14` — `GET /api/specs` は `specs/` 配下のディレクトリを列挙し `spec.md` が存在するものだけ返す。`GET /api/specs/:capability` はパストラバーサル防止チェック付きで raw text を返す
- `packages/web-ui/src/i18n/en.ts:29` — `en.specViewer` に `title` と `selectCapability` キーのみ。検索 placeholder などの新規 i18n キーを追加する余地あり
- `packages/web-ui/tests/e2e/spec-viewer.e2e.test.ts` — 既存テストは T401〜T403 の 3 件（ナビリンク表示、一覧ロード、コンテンツレンダリング）。検索関連の E2E テストはゼロ
- `packages/web-ui/src/lib/searchIndex.ts:17` — `Intl.Segmenter` を `'ja'` ロケールで使用。spec.md は英語ベースのテキストが中心だが、hyphen split（`full-text-search` → `full`, `text`, `search`）が FR 番号検索にも有効

## Open Choices (解決済み)

| 選択肢 | 決定 | 理由 |
|---|---|---|
| ハイライト対象の範囲 | 右ペインの Markdown 本文内も含む | 検索ヒット箇所を本文で確認できる UX が重要 |
| インデックス構築タイミング | `/spec-viewer` 訪問時に先読み | 検索応答が即座になり UX が向上する |
| `Search` コンポーネントの再利用 | 既存 `Search.tsx` を `placeholder` props 化して共用 | 変更ファイル数を最小化 |
| キーボードショートカット | ⌘K 表示のみ（機能未実装） | ダッシュボードとの UI 一貫性を維持 |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|---|---|---|
| I. ステップ独立性 | ✅ | — |
| II. 決定論的マージ | ✅ | — |
| III. 質問駆動の要件確定 | ✅ | — |
| IV. 双方向アンカー | ✅ | — |
| V. 強制ステップと拡張ステップの分離 | ✅ | — |
| VI. Security by Default | ✅ | — |
