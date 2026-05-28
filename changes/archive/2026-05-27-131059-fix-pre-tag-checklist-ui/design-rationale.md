---
doc_type: Explanation
---

<!-- See also: ./design.md -->
<!-- @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md -->
<!-- Requirements implemented: FR-006 -->
<!-- Change: fix-pre-tag-checklist-ui -->

<!-- @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md -->
<!-- Requirements implemented: FR-005, FR-006 -->
<!-- Change: fix-pre-tag-checklist-ui -->

# Design Rationale: fix-pre-tag-checklist-ui

## Context

mspec の Web UI は `react-markdown` を使って Markdown アーティファクトをレンダリングしている。コードブロックは `react-shiki` の `ShikiHighlighter` によってシンタックスハイライトされるが、`react-markdown` は `<code>` ノードを `<pre>` で包んでから `code` カスタムレンダラーに渡す。カスタム `code` レンダラーが `ShikiHighlighter`（これ自身も `<pre>` を出力する）を返すため、`<pre><pre ...>` という二重構造が生まれていた。

`checklist.md` は mspec ワークフローの成果物で、人間が手作業で確認すべき項目に `<!-- verify: human -->` コメントタグが付与される。しかし現行の Web UI ではすべてのチェックリスト項目が同一スタイルで表示されるため、要注意項目が埋もれてしまっていた。

また GFM タスクリストのチェックボックスは `react-markdown` + `remark-gfm` によってデフォルトで `disabled` 属性付きの `<input>` として出力される。Web UI でチェック操作をしたいというユーザー要求に応えるために、インタラクティブ化が必要だった。

## Decisions

### D-01: `pre` レンダラーによる二重ラップ修正

`react-markdown` の `components` prop には `pre` キーでカスタムレンダラーを渡すことができる。`children` をそのまま `<>{children}</>` で返すだけで、ReactMarkdown のデフォルト `<pre>` ラッパーをスキップできる。`ShikiHighlighter` が出力する `<pre data-testid="shiki-container" ...>` がそのまま DOM に残るため、一層のみになる（→ `design.md` D-01 参照）。

この方式は最小の変更でバグを修正でき、`CodeBlock.tsx` や `ShikiHighlighter` の内部に手を加える必要がない。

### D-02: `li` レンダラーによる verify-human ハイライト

`rehypeCommentDim` プラグインが `<!-- verify: human -->` コメントを `<span class="md-comment">verify: human</span>` に変換した後、`li` カスタムレンダラーの `node.children` を辿ることで検出できる。Tailwind の `bg-amber-50 border-l-4 border-amber-400` クラスを `<li>` に付与することで、黄色の左ボーダースタイルになり視覚的に目立つ（→ `design.md` D-02 参照）。

既存の `rehypeCommentDim` の処理順序（`ArtifactViewer.tsx` line 54 の rehype パイプライン）を変更せず、その変換結果を利用するため副作用がない。

### D-03: `input` レンダラーと `useRef` インデックス採番

チェックボックスのインタラクティブ化では `ArtifactViewer` コンポーネント内の `useState<Set<number>>` でチェック状態を管理する。GFM タスクリスト内の各チェックボックスに一意のインデックスを割り当てるために `useRef<number>` カウンターを使い、`li` レンダラーで描画のたびにインクリメントする。`input[type=checkbox]` レンダラーでそのカウンターを参照し、`checked`/`onChange` を制御する（→ `design.md` D-03 参照）。

ファイルへの永続化はスコープ外とした。Web UI はあくまでレビュー・確認用のビューであり、チェックボックスの「作業メモ」的な用途はインメモリで十分と判断した。

## Alternatives Considered

- **rehype プラグインで `<pre>` ラップを除去**: `rehypeRaw` の前後にカスタム rehype プラグインを挿入して `<pre>` を取り除く方法。処理フロー全体を把握する必要があり、over-engineering になる。
- **`CodeBlock.tsx` でフラグメントを返す**: `ShikiHighlighter` を `<pre>` を出力しないモードで使う方法。react-shiki の内部 API に依存するためバージョン追従が難しい。
- **localStorage でチェックボックス状態を永続化**: 永続化すると「ファイルが変わったのにチェック状態が残る」という不整合リスクがある。スコープを絞ってインメモリに留めた。

## Trade-offs

- インメモリ管理のためページリロードでチェック状態がリセットされる
- `useRef` カウンターは同一ページ内で複数の checklist.md が表示されると採番がズレる可能性があるが、現在の UI では 1 ページ 1 ファイル表示のため問題なし

## Rejected Options

- **`ShikiHighlighter` の `as` prop で `<pre>` を `<div>` に差し替え**: react-shiki がその prop をサポートしていないため却下
- **CSS で `pre > pre { display: contents }` を適用**: DOM 構造は二重のまま残り、スクリーンリーダーや他のプラグインへの副作用があるため却下

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | `ArtifactViewer.tsx` 単体変更、他コンポーネントへの依存なし |
| II. 決定論的マージ | ✅ | ✅ | カスタムレンダラー追加のみ、既存ロジック変更なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | Open Choices なし |
| IV. 双方向アンカー | ✅ | ✅ | `@mspec-delta` アンカー付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | CLI ワークフロー変更なし |
| VI. Security by Default | ✅ | ✅ | DOM 操作のみ、外部送信・ファイル書き込みなし |
