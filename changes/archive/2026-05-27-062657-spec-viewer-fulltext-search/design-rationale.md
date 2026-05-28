---
doc_type: Explanation
---

<!-- See also: ./design.md -->

<!-- @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007 -->
<!-- Change: spec-viewer-fulltext-search -->

# Design Rationale: Spec Viewer Full-Text Search

## Context

mspec Web UI の Spec Viewer ページは 40 以上の capability を一覧表示するが、目視スクロール以外の探索手段を持たない。Change Dashboard はすでに MiniSearch を使った全文検索（`lib/searchIndex.ts` + `hooks/useSearchIndex.ts`）を実装しており、同じライブラリをゼロコストで Spec Viewer にも適用できる状況にある。

本変更は「既存技術スタックの延長線上で実装できる機能拡張」であり、外部サービスや新規バンドル依存を導入せずに完結する。ユーザーが挙げた要件（インクリメンタルフィルター・ハイライト・FR 番号検索・クリアボタン）はすべてクライアントサイドで実現可能である。

## Decisions

### なぜ `useSearchIndex` を再利用せず新規 `useSpecSearchIndex` を作るか

既存の `useSearchIndex` は `ChangeInfo[]` を受け取り、変更の artifacts を `/api/changes/:id/artifacts` 経由で取得する。Spec Viewer が必要とするのは `SpecCapability[]` を受け取り `/api/specs/:capability` から spec.md を取得する、全く異なるデータ形状のインデックスである。無理に共有すると型の歪みが生じ、将来の Changes 検索改善が Spec Viewer にも影響してしまうリスクがある。

一方 `createSearchIndex()` は `SearchDocument` 型に特化しており、spec 用の `SpecSearchDocument` と互換性がない。そのため `lib/specSearchIndex.ts` に `createSpecSearchIndex()` を新規定義し、`tokenize` のみを既存から import 再利用する設計が最もクリーンである（詳細は D-04）。

### なぜ右ペインの Markdown 本文ハイライトに rehype プラグインを選んだか

`ReactMarkdown` の `components` プロパティで `text` ノードをインターセプトするアプローチも検討したが、`react-markdown` では `text` コンポーネントの上書きは公式サポートされておらず、将来のバージョンアップで壊れる可能性がある。rehype プラグインは AST レベルで処理するため、テキストノードの分割と `<mark>` ラップを確実に行える。`rehypeGherkinEars` など既存の rehype プラグインがプロジェクトで使われており、同じパターンを踏襲できるため選択した。

`pre`/`code` サブツリーのスキップ（D-06）は、`MermaidRenderer` が `children` を raw text として受け取る前提で動作しているため必須である。ハイライトが `children` を React 要素に変換してしまうと `String(children).trim()` が `[object Object]` になりクラッシュする。

## Alternatives Considered

- **`react-highlight-words` ライブラリの採用**: highlight 対象の text node 分割を自動化できるが、新規依存の追加コストが実装コストを上回る。capability 名のサイドバーハイライトなら 15 行の `HighlightText` コンポーネントで十分。
- **`SpecViewer.tsx` 内にすべてのロジックを集約**: 実装コストは最小だが、400 行超のコンポーネントになり将来の保守性が著しく低下する。hook・コンポーネント・lib への分離は React のベストプラクティスに沿う。
- **`Search.tsx` の代わりに `SpecSearch.tsx` を新規作成**: 既存コンポーネントへの影響ゼロだが、全く同じ UI を 2 箇所に維持することになる。`placeholder` と `onClear` の 2 props 追加という最小変更で共用できるため却下。
- **インデックス構築を lazy init（検索フォーカス時）にする**: 初回ロードを軽量にできるが、検索ボックスをクリックした後に数秒待つ UX が発生する。先読みしてバックグラウンドで構築することで検索応答が即座になりユーザー体験が向上する。

## Trade-offs

- **インデックス構築中のネットワーク負荷**: `/spec-viewer` アクセス時に最大 60 件の spec.md（約 600 KB）を並列フェッチする。CONCURRENCY=5 のバッチ制限を設けることでブラウザのネットワーク負荷を制御する。
- **right pane は選択中 capability を維持する（D-07）**: フィルタで選択中 capability が消えても右ペインはそのまま表示する。UI 上の視覚的不整合（サイドバーに表示されていない capability の内容が右ペインに残る）は許容する。FR-006 のスコープ外であり、実装を単純化できる。
- **`Search.tsx` の変更が Change Dashboard にも影響**: `placeholder` と `onClear` のどちらも既存の `Dashboard.tsx` に渡していないため、既存の `Search` 呼び出し箇所のコードは変更不要。ただし E2E スナップショットテストがある場合は確認が必要。

## Rejected Options

- **Elasticsearch / Algolia などの外部インデックスサービス**: Non-Goal として明示済み。サーバー運用コストと複雑性を導入しない方針。
- **ネイティブ `Array.filter()` のみで実装**: capability 名のみを検索する場合は十分だが、FR-002 で spec.md 本文（最大 10 KB × 60 件）の全文検索が要件として確定しているため不採用。
- **debounce を `lodash.debounce` で実装**: 新規依存の追加が不要な 10 行の `useDebounce` hook で代替できる。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|---|---|---|
| I. ステップ独立性 | ✅ design-rationale は design と独立した成果物 | ✅ 他ステップのアーティファクトを変更しない |
| II. 決定論的マージ | ✅ 新規 capability spec-viewer-search のみ | ✅ 変更ファイルリストが一意で確定している |
| III. 質問駆動の要件確定 | ✅ proposal/research/design で要件確定済み | ✅ 代替案・却下理由が記録されている |
| IV. 双方向アンカー | ✅ `@mspec-delta` アンカーを冒頭に記載 | ✅ `design.md` との相互参照コメントあり |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみを対象 | ✅ 実装手順は tasks.md で分離される |
| VI. Security by Default | ✅ 権限境界なし | ✅ `escapeRegExp` による不正入力防御の根拠を記載 |
