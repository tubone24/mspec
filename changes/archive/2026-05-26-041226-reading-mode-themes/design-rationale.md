---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: reading-mode-themes

## Context

現在の Web UI は `darkMode: 'class'` による 2 値テーマのみを持つ。4 テーマへの拡張にあたり、CSS の管理戦略をどこで切るかが最初の重要な判断だった。選択肢は「最小変更（`dark:` クラスを維持しセピア・グリーンのみ CSS 変数で追加）」と「全体 CSS カスタムプロパティ移行」の 2 つだった。ユーザーは全体移行を選択した。

シンタックスハイライトは `ArtifactViewer.tsx` の `code` renderer がすでに mermaid と Gherkin の特殊ケースを持つ構造で、汎用言語への対応ポイントが自明だった。Shiki を選んだ主因は VS Code 同等の TextMate 文法品質と、`react-shiki` による React ライフサイクルの隠蔽である。

Markdown HTMLコメントの減光は、mspec の spec.md に `<!-- @mspec-delta ... -->` アノテーションが多用されている特性から生じた要件である。これらのアノテーションが本文と同じ視覚強度で表示されると可読性が著しく低下する。

## Decisions

**CSS カスタムプロパティへの全体移行を選んだ理由**：セピア・グリーンは `dark:` クラス体系の外にある新しいトークン空間であり、`dark:` を維持した最小変更では「セピア時は `bg-[#FBF0D9]`、グリーン時は `bg-[#C5E8C5]`」という個別クラスが各コンポーネントに散在する。CSS 変数を使えば `bg-[var(--color-bg)]` という単一のトークン参照に統一でき、テーマの追加・変更がコンポーネント変更ゼロで可能になる。変更ファイル数は増えるが長期的な保守コストは下がる。

**`dark` クラスを Dark テーマ時のみ維持する理由**：Tailwind Typography プラグインの `prose-invert` は `dark:prose-invert` という `dark:` クラス依存で機能する。`darkMode: ['selector', '[data-theme="dark"]']` 設定により `dark:` クラスは `[data-theme="dark"]` セレクタで動作するが、HTML 要素に `dark` クラスが付いていないと `prose-invert` が機能しないエッジケースがある。`dark` クラスの二重付与はコストゼロで後方互換性を保証する。

**Shiki + react-shiki を選んだ理由**：`highlight.js` は自動言語検出があるが API が命令型で React との相性が悪い。`prism-react-renderer` は Prism 文法品質（TextMate より低い）に依存する。`react-shiki` は Shiki v1 の非同期ハイライター初期化を `useShikiHighlighter` フックに隠蔽し、言語・テーマの動的インポートを Vite の dynamic import で処理する。バンドルサイズは `shiki/core` で言語を明示指定することで最小化できる。

**`colorReplacements` によるコメント減光を選んだ理由**：Shiki は最終的に `<span style="color: #6A737D">/* comment */</span>` を出力する。CSS でインラインスタイルを上書きするには `!important` が必要になり脆弱。`colorReplacements` はテーマ単位でトークン色を変換する公式 API であり、Shiki のテーマ処理パイプライン内で解決できる。

## Alternatives Considered

- **Tailwind CSS v4 への移行**：v4 はネイティブ CSS 変数サポートがあり本変更との親和性は高いが、mspec-web-ui は v3 で構築されており、破壊的マイグレーションコストが今回のスコープを超える。
- **CSS Modules によるテーマ管理**：Tailwind と混在する場合にコンフリクトが生じやすく、採用しなかった。
- **Prism.js の直接利用**：CDN での利用は簡単だが、Vite バンドル戦略との整合性が悪い。`prism-react-renderer` は TextMate 文法未使用で品質が Shiki に劣る。
- **正規表現による Markdown コメント検出**：レンダリング後の DOM を正規表現で事後処理する方法は、Markdown エスケープや入れ子コードブロック内のコメントに誤マッチするリスクがある。rehype の AST walk はノードタイプで正確にコメントを識別できる。

## Trade-offs

- **全体 CSS 変数移行のコスト**：`dark:` クラスを持つ全コンポーネントの修正が必要。変更 diff が大きくなりレビュー負荷が高い。
- **react-shiki の外部依存追加**：`shiki` 本体 + `react-shiki` の 2 パッケージが増える。`shiki/core` でも初回ロードに数十 KB 追加される。
- **rehypeCommentDim の Markdown コメント可視化**：`<!-- -->` コメントは通常ブラウザで非表示だが、本変更で薄い色で表示される。mspec 内部のアノテーションには意図通りだが、一般的なユーザーが書いた Markdown でコメントが意図せず表示される点はトレードオフ。
- **フォントの Google Fonts CDN 依存**：オフライン環境でフォールバックになる。CSP を設定している環境では追加が必要（今回スコープ外）。

## Rejected Options

- `localStorage` 直接操作でのテーマ永続化 → 既存 `persist` ミドルウェアが存在し、二重管理になるため却下
- テーマ選択ドロップダウン → ユーザーが Pill ボタン群を選択
- アイコンボタン（太陽・本・葉・月）→ ユーザーが Pill ボタン群を選択。アイコンのみでは選択状態が分かりにくい
- Shiki フルバンドル → バンドルサイズ ~1.2MB (gzip) は許容できないため `shiki/core` で言語を絞る

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ design-rationale は research.md と design.md のみを参照 | ✅ 後続ステップへの依存なし |
| II. 決定論的マージ | ✅ 全トレードオフと却下オプションが明示 | ✅ 未確定事項（フォント・Green カラー）は Visual Prototype への委譲として明記 |
| III. 質問駆動の要件確定 | ✅ 全意思決定に根拠を記述 | ✅ 追加の確認事項なし |
| IV. 双方向アンカー | ✅ design.md の Decisions テーブルと相互参照 | ✅ 実装ファイル名を具体的に参照 |
| V. 強制ステップと拡張ステップの分離 | ✅ フォント確定は Visual Prototype ステップへの委譲 | ✅ 本ファイルは拡張ステップの結果を待たずに完結 |
| VI. Security by Default | ✅ Google Fonts CDN・rehype XSS リスクについて言及 | ✅ rehypeCommentDim はユーザー入力を HTML として出力しない（テキストノード化のみ）設計 |

### Complexity Tracking

None
