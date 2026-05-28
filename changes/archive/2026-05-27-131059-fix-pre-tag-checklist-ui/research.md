<!-- @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md -->
<!-- Requirements implemented: FR-006 -->
<!-- Change: fix-pre-tag-checklist-ui -->

<!-- @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md -->
<!-- Requirements implemented: FR-005, FR-006 -->
<!-- Change: fix-pre-tag-checklist-ui -->

# Research: fix-pre-tag-checklist-ui

## Decisions

| 項目 | 決定 | 根拠 |
|------|------|------|
| `<pre>` 二重ラップ修正方法 | `ArtifactViewer.tsx` の `markdownComponents` に `pre` カスタムレンダラーを追加し、`{children}` をそのまま返す | ReactMarkdown は `<pre><code>` 構造で渡すが `code` 側を ShikiHighlighter に置き換えると ShikiHighlighter 自身の `<pre>` が残るため |
| verify-human 検出方法 | `li` カスタムレンダラー内で `String(children)` または node.children の raw HTML に `verify: human` が含まれるか判定 | `rehypeRaw` が有効なので `<!-- verify: human -->` コメントノードが hast ツリーに残っており参照可能 |
| チェックボックス状態管理 | `ArtifactViewer` 内の `useState` でファイルパスをキーとした Set を管理（インメモリ） | ファイルへの書き戻しは今回スコープ外。ページリロードでリセットされる動作を許容する |
| チェックボックス実装方法 | `input` カスタムレンダラーで `disabled` を外し、`onChange` でローカル状態をトグル | ReactMarkdown + remarkGfm は GFM タスクリストを `<input type="checkbox" disabled>` で出力するため |

## Web References

- [react-shiki README](https://github.com/Reamd7/react-shiki) — `ShikiHighlighter` は `<pre data-testid="shiki-container" ...>` を出力する
- [ReactMarkdown custom components](https://remarkjs.github.io/react-markdown/) — `components.pre` でデフォルト `<pre>` ラッパーを上書き可能
- [remark-gfm タスクリスト](https://github.com/remarkjs/remark-gfm) — チェックボックスは `<input type="checkbox" disabled>` として出力される

## Codebase Findings

### Double `<pre>` tag issue (code-syntax-highlight FR-006)

**原因ファイル**: `packages/web-ui/src/components/ArtifactViewer.tsx:70-85`

```tsx
const markdownComponents: Components = {
  code({ className, children, node }) {
    // ...
    return <CodeBlock language={lang} code={String(children)} />;  // ← ShikiHighlighter の <pre> を返す
  },
  // pre カスタムレンダラーが存在しない → ReactMarkdown のデフォルト <pre> が残る
};
```

`CodeBlock.tsx:24-35` の `ShikiHighlighter` が `<pre data-testid="shiki-container" ...>` を生成するが、
`ArtifactViewer.tsx` の `markdownComponents` に `pre` カスタムレンダラーがないため
ReactMarkdown のデフォルト `<pre>` がそのまま外側を囲んで二重になる。

**修正箇所**: `ArtifactViewer.tsx` の `markdownComponents` に以下を追加：
```tsx
pre({ children }) {
  return <>{children}</>;
},
```

### verify-human highlight (web-ui-server FR-005)

**verify-human の記法**: checklist.md 末尾に `<!-- verify: human -->` HTML コメント
- `rehypeRaw` プラグインにより HTML コメントノードが hast ツリーに残る
- 既存 `rehypeCommentDim` は HTML コメントを `<span class="md-comment">` に変換する (`lib/rehypeCommentDim.ts`)
- **現状**: Web UI 側に `verify-human` / `verify: human` の特別扱いは一切なし

**実装方針**: `ArtifactViewer.tsx` の `markdownComponents` に `li` カスタムレンダラーを追加し、
レンダリングされた子要素の文字列表現に `verify: human` が含まれるかを判定してハイライト CSS クラスを付与する。

### Interactive checkboxes (web-ui-server FR-006)

**現状**: ReactMarkdown + remarkGfm が GFM タスクリストを `<input type="checkbox" disabled>` として出力するため、クリック操作ができない。

**実装方針**:
- `ArtifactViewer` コンポーネント内に `checkedItems: Set<number>` ステートを追加（キーはリスト項目のインデックス番号）
- `markdownComponents` に `input` カスタムレンダラーを追加：
  - `type="checkbox"` の場合のみ処理
  - `disabled` を除去し、`checked` と `onChange` をローカルステートで制御
- インデックスは `li` レンダラーとのコンテキスト共有が必要なため、`useRef` カウンターか React Context で連番を管理する

## Open Choices

なし（実装方針はすべて確定）

## Constitution Check

### Phase 0 Principles

- [x] I — ステップ独立性: research は他ステップに依存しない独立アーティファクト。前段の会話コンテキストなしに単独で参照可能
- [x] II — 決定論的マージ: research.md は追記形式でマージ競合なし
- [x] III — 質問駆動の要件確定: Open Choices セクションに未決事項を明示。今回は未決なし
- [x] IV — 双方向アンカー: Delta Spec の FR-006（code-syntax-highlight）・FR-005・FR-006（web-ui-server）を `@mspec-delta` アンカーで参照済み
- [x] V — 強制ステップと拡張ステップの分離: research は設計詳細を design に委譲し、実装詳細を含まない
- [x] VI — Security by Default: 変更範囲は DOM レンダリング層のみ。ファイル書き込み・ネットワークアクセスなし
