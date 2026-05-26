# Research: webui-keyword-badge-style

## Decisions

| 決定事項 | 採用案 | 理由 |
|----------|--------|------|
| バッジ背景色の付与方式 | `index.css` の `.k-*` クラスに `background-color` / `padding` / `border-radius` を追加 | スタイルは `index.css` に集約されており、変更箇所が最小限 |
| ダークテーマ対応 | ダーク用 `.k-*` オーバーライドにも同様の背景色を設定（透過度を調整） | 4テーマ全てで視認性を確保するため |
| コードブロック border の修正方式 | `.prose pre` に対して `outline: 1px solid var(--color-border)` でブラウザデフォルトの太い outline を上書き | `ShikiHighlighter` 出力の `pre` 要素がフォーカス可能要素として扱われ、ブラウザデフォルトの太い outline が表示される可能性が高い |

## Web References

| URL | 要点 |
|-----|------|
| https://developer.mozilla.org/en-US/docs/Web/CSS/outline | `outline` プロパティで focus ring の太さ・色を制御可能。`outline: 1px solid color` で細い枠に変更できる |
| https://tailwindcss.com/docs/typography-plugin | `prose pre` は `backgroundColor` / `color` / `borderRadius` のみ設定。`border` プロパティは存在しない |
| https://shiki.matsu.io/ | Shiki は `pre.shiki` にインライン `style="background-color:..."` を出力。border は出力しない |

## Codebase Findings

### キーワードハイライト実装箇所

**`packages/web-ui/src/index.css:46-71`**
```css
.k-shall     { color: #dc2626; font-weight: 600; }
.k-given     { color: #1d4ed8; font-weight: 600; }
/* ... */
[data-theme='dark'] .k-shall { color: #f87171; }
```
現在は `color` と `font-weight` のみ設定。背景色・パディング・角丸は未設定。

**`packages/web-ui/src/lib/rehypeGherkinEars.ts:14-26`**
rehype プラグインとして Markdown テキスト内のキーワードを `<span class="k-*">` でラップする。

**`packages/web-ui/src/components/GherkinHighlight.tsx:12-27`**
React コンポーネントとしてキーワードを Tailwind クラスで直接スタイリング（別コンテキスト用）。

### コードブロック border 実装箇所

**`packages/web-ui/src/components/CodeBlock.tsx:24-35`**
```tsx
<ShikiHighlighter
  addDefaultStyles={false}  // react-shiki デフォルト styles.css を無効化
  className="text-sm"
  ...
>
```
`addDefaultStyles={false}` により react-shiki の `border-radius: 0.5rem` も無効化されている。

**`packages/web-ui/src/index.css`**
`pre` 要素に対する `outline` / `border` の明示的な指定なし。

**推定 border 源泉**：Shiki が出力する `pre.shiki` 要素は一部のブラウザ（特に macOS Safari / Chrome）でフォーカス受付時にシステム標準の太い outline（約 3px の黒枠）を表示する。`addDefaultStyles={false}` によって `border-radius` も外れているため、この outline が角丸なしの鋭い黒枠として目立つ。

### 実装方針

**FR-004 キーワードバッジ化**（変更ファイル: `packages/web-ui/src/index.css`）
- `.k-shall` 〜 `.k-but` 全クラスに以下を追加:
  ```css
  background-color: <色の薄いバージョン>;
  border-radius: 3px;
  padding: 1px 5px;
  ```
- ライトテーマ: 各 `color` を半透明化した背景色（例 SHALL: `#fee2e2`, GIVEN: `#dbeafe`）
- ダークテーマオーバーライドにも対応した背景色を設定

**FR-005 コードブロック border 細線化**（変更ファイル: `packages/web-ui/src/index.css`）
```css
.prose pre {
  outline: 1px solid var(--color-border);
  outline-offset: 0;
}
```
ブラウザデフォルトの太い outline を `--color-border`（テーマ対応）の 1px 細線に置換。

## Open Choices

なし

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ CSS のみの変更であり他ステップへの依存なし | — |
| II. 決定論的マージ | ✅ `index.css` のクラス定義追加のみ、マージ競合リスクは低い | — |
| III. 質問駆動の要件確定 | ✅ FR-004/FR-005 の要件は readme の要求から明確に導出済み | — |
| IV. 双方向アンカー | ✅ Delta Spec に FR-004/FR-005 として記録済み | — |
| V. 強制ステップと拡張ステップの分離 | ✅ 本変更は UI スタイルのみ。強制ステップと拡張ステップを混在させない | — |
| VI. Security by Default | ✅ CSS の変更のみ。権限境界・外部アクセス・秘密情報への影響なし | — |
