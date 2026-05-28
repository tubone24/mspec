---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

<!-- @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007 -->
<!-- Change: spec-viewer-fulltext-search -->

# Design: Spec Viewer Full-Text Search

## Summary

Spec Viewer の左サイドバーに検索ボックスを追加し、MiniSearch（既存依存）を使ったクライアントサイド全文検索でフィルタリングを実現する。ハイライトはサイドバーの capability 名（`HighlightText` コンポーネント）と右ペインの Markdown 本文（`rehypeMarkText` プラグイン）の両方に適用する。

## Technical Context

- **Web UI**: React + TypeScript + Vite。`packages/web-ui/src/` 配下
- **検索ライブラリ**: `minisearch@^7.2.0`（既に `package.json` に存在）
- **既存検索スタック（Change Dashboard 用）**: `lib/searchIndex.ts` → `hooks/useSearchIndex.ts` → `Dashboard.tsx`
- **Spec Viewer の API**: `GET /api/specs` → `SpecCapability[]`、`GET /api/specs/:capability` → raw Markdown text
- **既存テスト**: `tests/e2e/spec-viewer.e2e.test.ts` に T401–T403（ナビ・一覧・コンテンツ）

## Project Structure

### 新規ファイル

| ファイル | 役割 | Anchors FR |
|---|---|---|
| `src/lib/specSearchIndex.ts` | `SpecSearchDocument` 型 + `createSpecSearchIndex()` 関数 | FR-002 |
| `src/hooks/useSpecSearchIndex.ts` | specs 全文検索インデックス構築 hook | FR-002 |
| `src/hooks/useDebounce.ts` | 汎用 `useDebounce<T>(value, delay)` hook | FR-003 |
| `src/components/HighlightText.tsx` | capability 名内のキーワードを `<mark>` でハイライト | FR-004 |
| `src/lib/rehypeMarkText.ts` | Markdown 本文内テキストノードを `<mark>` でハイライトする rehype プラグイン | FR-006 |

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/components/Search.tsx` | `placeholder?: string`・`onClear?: () => void` props を追加 |
| `src/pages/SpecViewer.tsx` | 検索状態・`useSpecSearchIndex`・フィルタ・ハイライト wiring を追加 |
| `src/i18n/en.ts` | `specViewer.searchPlaceholder`・`noResults`・`buildingIndex` キーを追加 |
| `tests/e2e/spec-viewer.e2e.test.ts` | T404–T408 を追加 |

## Data Models

### `SpecSearchDocument`（新規）

```ts
export interface SpecSearchDocument {
  id: string;         // capability 名（一意キー）
  capability: string; // capability 名（インデックス対象）
  content: string;    // spec.md 本文全文（インデックス対象）
}
```

### MiniSearch 設定

- `fields: ['capability', 'content']`
- `storeFields: ['capability']`
- `boost: { capability: 3, content: 1 }`
- `tokenize`: 既存 `lib/searchIndex.ts` の `tokenize` を **re-import して再利用**（`Intl.Segmenter('ja')` + hyphen split）

## Decisions

### D-01: インデックス構築タイミング

`/spec-viewer` 訪問時に `useSpecSearchIndex(specs)` を即時トリガーし、全 spec.md を先読みする。インデックス構築中は `isBuilding: true` が返り、Search コンポーネントに `buildingIndex` メッセージを表示する。

**受け入れ基準（FR-002 Scenario 対応）**:
- GIVEN ユーザーが `/spec-viewer` を開いた
- WHEN ページの初期化処理が完了する
- THEN `useSpecSearchIndex.isBuilding` が `false` になり検索が有効化される

### D-02: fetch 並列数（CONCURRENCY）

既存 `useSearchIndex` と同じ `CONCURRENCY = 5`（並列バッチ制限）を維持する。specs は各 5–10 KB 程度だが、ネットワーク負荷とエラー追跡のしやすさのため統一する。

### D-03: debounce 遅延

`useDebounce(query, 200)` — FR-003 要件「200ms 以内」に適合させるため 200ms を採用。

### D-04: tokenize の再利用

`lib/specSearchIndex.ts` は `lib/searchIndex.ts` から `tokenize` を **import して再利用**する（複製しない）。FR 番号（`FR-001` → `fr`, `001`）の hyphen split が spec 検索でも必要なため。

### D-05: regex エスケープ（`escapeRegExp` 契約）

`HighlightText.tsx` と `rehypeMarkText.ts` の **両方** に `escapeRegExp(query)` を適用する。`(` や `*` などの正規表現特殊文字を含むクエリでのクラッシュを防ぐ。

```ts
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

### D-06: rehype プラグインのスキップ対象

`rehypeMarkText` は以下の要素の **subtree 内テキストノードをスキップ** する：

- `pre`（シンタックスハイライトブロック）
- `code`（インラインコード）
- mermaid ブロック（`className` に `language-mermaid` を含む `code` 要素）

これにより `MermaidRenderer` が受け取る `children` が壊れず、EARS シンタックスハイライトも維持される。

**受け入れ基準（FR-004 Scenario 対応）**:
- GIVEN `design.md` などの Mermaid ブロックを含む spec が表示されている
- WHEN ユーザーが `flowchart` などのキーワードを検索する
- THEN Mermaid SVG は正常にレンダリングされ、コードブロック内部はハイライトされない

### D-07: 選択中 capability の右ペイン挙動

検索クエリによって現在選択中の capability がサイドバーからフィルタされた場合でも、**右ペインはその capability の内容を維持する**（URL / ルートを変更しない）。フィルタはサイドバー表示のみに影響する。

**根拠**: FR-006 は「サイドバーに空状態を表示する」と明記しており、右ペインの挙動は規定外。

### D-08: クリアボタン（× ボタン）の Search.tsx API 拡張

`Search.tsx` に `onClear?: () => void` prop を追加する。`placeholder?: string` も追加し、既存の "Search changes, tags…" はデフォルト値とする。

**× ボタン表示条件**: `onClear` prop が渡されている場合かつ `value` が空でない場合のみ表示する（`onClear` が `undefined` のとき非表示）。これにより既存の `Dashboard.tsx` 呼び出し箇所に視覚的変化が生じない。

**受け入れ基準（FR-007 Scenario 対応）**:
- GIVEN `design` というクエリが入力されリストが絞り込まれている状態
- WHEN ユーザーが × ボタンをクリックする
- THEN `onClear` が呼ばれ、SpecViewer で `query` が `''` にリセットされ全 capability が再表示される

## Component Contracts

### `SpecViewer.tsx` 内の状態

```ts
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 200);
const { data: specs } = useSpecs();
const { index, isBuilding } = useSpecSearchIndex(specs ?? []);

const filteredSpecs = useMemo(() => {
  if (!debouncedQuery.trim() || !index) return specs ?? [];
  return index.search(debouncedQuery).map(r => ({ capability: r.id }));
}, [debouncedQuery, index, specs]);
```

### `Search.tsx` Props（拡張後）

```ts
interface SearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;   // default: "Search changes, tags…"
  onClear?: () => void;   // × ボタン表示・クリア動作
}
```

### `HighlightText.tsx` Props

```ts
interface HighlightTextProps {
  text: string;    // capability 名など表示テキスト
  query: string;   // ハイライト対象クエリ（空文字ならそのまま表示）
}
```

### `rehypeMarkText.ts` シグネチャ

```ts
export function rehypeMarkText(query: string): () => (tree: Root) => void
// usage: rehypePlugins={[rehypeMarkText(debouncedQuery)]}
```

空クエリまたは空白のみの場合は no-op を返す。

## i18n 追加キー

```ts
specViewer: {
  title: 'Spec Viewer',
  selectCapability: 'Select a capability',
  searchPlaceholder: 'Search specs…',   // 追加
  noResults: 'No capabilities found.',  // 追加
  buildingIndex: 'Building index…',     // 追加
}
```

### D-09: rehype プラグイン適用順

`SpecViewer.tsx` の `ReactMarkdown` では `rehypeMarkText` を必ず **最後** に配置する：

```ts
rehypePlugins={[
  rehypeRaw,
  rehypeCommentDim,                   // 1. HTML コメントを dim
  rehypeGherkinEars,                  // 2. EARS/Gherkin キーワードをラップ（text node を前提）
  rehypeInlineCodeProperty,
  rehypeMarkText(debouncedQuery),     // 3. 最後にテキストを <mark> でラップ
]}
```

`rehypeGherkinEars` は `visit(tree, 'text', ...)` でテキストノードを走査するため、`rehypeMarkText` を先に実行すると EARS キーワードが `<mark>` 要素ノードに変換されて検出されなくなる。`rehypeMarkText` は **必ず `rehypeGherkinEars` の後** に配置すること。

## Complexity Tracking

None

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|---|---|---|
| I. ステップ独立性 | ✅ design は research に依存するが独立した成果物 | ✅ 他ステップのアーティファクトを変更しない |
| II. 決定論的マージ | ✅ 新規 capability spec-viewer-search のみ | ✅ 変更ファイルリストが一意で確定している |
| III. 質問駆動の要件確定 | ✅ proposal/research で要件確定済み | ✅ D-07 で未規定だった右ペイン挙動を明記 |
| IV. 双方向アンカー | ✅ `@mspec-delta` アンカーを冒頭に記載 | ✅ 各ファイルの Anchors FR を Project Structure テーブルに明記済み（`useDebounce.ts` → FR-003 など） |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみを対象 | ✅ 実装手順は tasks.md で分離される |
| VI. Security by Default | ✅ 権限境界なし・外部 API 追加なし | ✅ `escapeRegExp` で不正入力に対する防御を明記 |

## Self-Review

> Review complete. 2 blocker(s), 2 warning(s), 2 note(s). — Blockers resolved in this revision.

### 解決済みブロッカー

**[blocker → resolved] rehype プラグイン適用順が未規定だった**

`rehypeGherkinEars` は `visit(tree, 'text', ...)` でテキストノードを走査する。`rehypeMarkText` を先に実行すると EARS キーワードが `<mark>` 要素に変換されてテキストノードでなくなり、EARS ハイライトが失われる問題があった。D-09 を追加し、`rehypeMarkText` を必ず `rehypeGherkinEars` の後に配置する制約を明記した。

**[blocker → resolved] `useDebounce.ts` の `@mspec-delta` アンカー先 FR が未指定だった**

汎用 hook である `useDebounce.ts` の `@mspec-delta` アンカー対象が曖昧で、実装ステップで推測に頼る状態だった。Project Structure テーブルに "Anchors FR" 列を追加し、`useDebounce.ts → FR-003`（200ms debounce 要件）など全新規ファイルの FR マッピングを明示した。

### 警告（warning）

**[warning] D-08 の × ボタン表示条件が曖昧だった**

`onClear` が `undefined` のとき × ボタンを表示するか否かが未定義で、既存 Dashboard に視覚的変化が生じるリスクがあった。D-08 に「`onClear` prop が渡されている場合かつ `value` が空でない場合のみ表示する」という明示的な条件を追記した。

**[warning] FR-005（大文字小文字区別なし）の E2E テストが未対応**

T404–T408 に大文字クエリ（例: `FR-001`）でのヒット確認がなく、`.toLowerCase()` が誤って削除された場合に検知できないリスクがある。`quickstart.md` の Verify テーブルに T409 を追加した。

### ノート（note）

- `index.search(debouncedQuery)` のオプション未指定：MiniSearch のデフォルト `prefix: false, fuzzy: false` は tokenizer ベースのマッチングで FR の要件を満たすため変更不要。
- D-07 の右ペイン維持によるサイドバーとの視覚的不整合は `design-rationale.md` の Trade-offs に記録済みの既知トレードオフ。
