---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: webui-keyword-badge-style

## Summary

`packages/web-ui/src/index.css` の `.k-*` CSS クラス群にバッジスタイル（背景色・角丸・パディング）を追加し、EARS/Gherkin キーワードをラベル風に表示する（FR-004）。
また、同ファイルに `.prose pre` の `outline` オーバーライドを追加し、コードブロック周囲の太い枠を 1px の細線に置換する（FR-005）。
**変更対象は `index.css` 1 ファイルのみ。`GherkinHighlight.tsx` は Tailwind クラスを直接使用するため FR-004 のスコープ外（`rehypeGherkinEars` 経由のキーワードのみ対象）。**

## Technical Context

| 要素 | 詳細 |
|------|------|
| レンダリングパイプライン | `ReactMarkdown` → `rehypeGherkinEars` → `<span class="k-*">` → `index.css` |
| キーワードスパン生成 | `rehypeGherkinEars.ts` が `<span class="k-*">` を出力（FR-004 の対象）。`GherkinHighlight.tsx` は Tailwind クラス文字列を直接出力するため FR-004 スコープ外 |
| コードブロック | `ShikiHighlighter`（`addDefaultStyles={false}`）→ `prose pre` styling |
| テーマ対応 | `--color-border` CSS カスタムプロパティが light/sepia/green/dark 全テーマ対応 |

## Project Structure

```
packages/web-ui/src/
└── index.css        ← 唯一の変更対象
    ├── .k-shall / .k-must / ...  (EARS キーワード: color + font-weight → + background-color + border-radius + padding)
    ├── .k-given / .k-when / ...  (Gherkin キーワード: 同上)
    ├── [data-theme='dark'] .k-*  (ダークテーマオーバーライド: 同上)
    └── .prose pre                (新規追加: outline 細線化)
```

## Decisions

### FR-004 — キーワードバッジスタイル

各 `.k-*` クラスに以下のプロパティを追加する:

```css
/* ライトテーマ用バッジ背景色マッピング */
.k-shall     { background-color: #fee2e2; border-radius: 3px; padding: 1px 5px; }  /* red-100 */
.k-must      { background-color: #fee2e2; border-radius: 3px; padding: 1px 5px; }
.k-must-not  { background-color: #fee2e2; border-radius: 3px; padding: 1px 5px; }
.k-should    { background-color: #fef3c7; border-radius: 3px; padding: 1px 5px; }  /* amber-100 */
.k-should-not{ background-color: #fef3c7; border-radius: 3px; padding: 1px 5px; }
.k-may       { background-color: #fef9c3; border-radius: 3px; padding: 1px 5px; }  /* yellow-100 */
.k-given     { background-color: #dbeafe; border-radius: 3px; padding: 1px 5px; }  /* blue-100 */
.k-when      { background-color: #e0f2fe; border-radius: 3px; padding: 1px 5px; }  /* sky-100 */
.k-then      { background-color: #dcfce7; border-radius: 3px; padding: 1px 5px; }  /* green-100 */
.k-and       { background-color: #cffafe; border-radius: 3px; padding: 1px 5px; }  /* cyan-100 */
.k-but       { background-color: #ede9fe; border-radius: 3px; padding: 1px 5px; }  /* violet-100 */
```

ダークテーマ用オーバーライドにも対応する背景色を追加:

```css
[data-theme='dark'] .k-shall      { background-color: #450a0a; }  /* red-950 */
[data-theme='dark'] .k-must       { background-color: #450a0a; }
[data-theme='dark'] .k-must-not   { background-color: #450a0a; }
[data-theme='dark'] .k-should     { background-color: #451a03; }  /* amber-950 */
[data-theme='dark'] .k-should-not { background-color: #451a03; }
[data-theme='dark'] .k-may        { background-color: #422006; }  /* yellow-950 */
[data-theme='dark'] .k-given      { background-color: #172554; }  /* blue-950 */
[data-theme='dark'] .k-when       { background-color: #082f49; }  /* sky-950 */
[data-theme='dark'] .k-then       { background-color: #052e16; }  /* green-950 */
[data-theme='dark'] .k-and        { background-color: #083344; }  /* cyan-950 */
[data-theme='dark'] .k-but        { background-color: #2e1065; }  /* violet-950 */
```

**受け入れ基準（Scenario 対応）:**
- GIVEN スペックビューアで Scenario セクションが表示 / WHEN GIVEN キーワードを閲覧 / THEN 背景色付き角丸ラベルが表示される

### FR-005 — コードブロック枠線の細線化

```css
/* .prose pre の outline をブラウザデフォルト → 1px テーマ色に置換 */
.prose pre {
  outline: 1px solid var(--color-border);
  outline-offset: 0;
}
```

`border` ではなく `outline` を使うことで、Shiki の inline `style` による `background-color` との重なりを避ける。`var(--color-border)` は全 4 テーマで定義済みの CSS カスタムプロパティを再利用する。

**受け入れ基準（Scenario 対応）:**
- GIVEN コードブロックが表示 / WHEN ページを閲覧 / THEN 1px 細線の枠で表示される

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ CSS のみ、他ステップ依存なし | ✅ 設計は research.md から独立して記述可能 |
| II. 決定論的マージ | ✅ `.k-*` クラスへのプロパティ追加はマージ競合リスク低 | ✅ 具体的なプロパティ値を明示、実装者の裁量余地なし |
| III. 質問駆動の要件確定 | ✅ FR-004/FR-005 の要件は readme から明確 | ✅ バッジ背景色の具体値を決定として記録 |
| IV. 双方向アンカー | ✅ Delta Spec FR-004/FR-005 と対応 | ✅ 各決定が Scenario と対応付けられている（tasks.md で `index.css` への `@mspec-delta` アンカーコメント追加を明示すること） |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制変更（CSS 追加）のみ | ✅ オプション拡張なし |
| VI. Security by Default | ✅ CSS のみ、権限/外部アクセス影響なし | ✅ XSS 等リスクなし |

### Complexity Tracking

None

## Self-Review

### Findings

| Severity | Item | Action |
|----------|------|--------|
| [blocker] | `design.md` で「`GherkinHighlight.tsx` が `.k-*` を出力」と誤記。実際は Tailwind ユーティリティクラスを直接出力するため FR-004 バッジは適用されない。Summary・Technical Context を修正してスコープを明示した | 修正済み |
| [blocker] | Constitution Principle IV（双方向アンカー）について `index.css` への `@mspec-delta` コメント配置計画が design.md に存在しなかった。tasks.md に明示的タスクとして含める必要がある | Constitution Check Phase 1 に注記追加済み |
| [warn] | セピア・グリーンテーマでのバッジ背景色の視覚的不調和は `design-rationale.md` でトレードオフとして記録済みだが、`checklist.md` に human-verify 項目がなかった | checklist.md にスコープ確認項目を追加 |
| [warn] | FR-005 の root cause（太い枠線の発生源）が `outline` か `border` かは research.md で推定止まり。`outline: 1px` で実際に解消するか、実装時に確認が必要 | note（tasks.md の実装ステップで確認する） |
| [ok] | FR-004/FR-005 の全 Scenario が design.md と checklist.md に反映されており、カバレッジ完全 | — |
| [ok] | Mermaid ダイアグラム（flowchart・sequenceDiagram）が architecture-overview.md に含まれる | — |
| [ok] | Constitution Principles I・II・III・V・VI は全アーティファクトで一貫して ✅ | — |

### Summary

`GherkinHighlight.tsx` が `.k-*` CSS クラスを使用しないという事実誤認が blockerとして検出され修正した。FR-004 の対象は `rehypeGherkinEars` 経由のキーワードレンダリングのみに限定されることを明示。`@mspec-delta` アンカー配置は tasks.md で必須タスクとして扱う。
