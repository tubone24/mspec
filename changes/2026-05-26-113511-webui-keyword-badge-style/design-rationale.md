---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: webui-keyword-badge-style

## Context

Web UI のスペックビューアは EARS/Gherkin キーワード（SHALL・GIVEN 等）をテキスト色のみで強調しているが、スペックドキュメントが長くなるほどキーワードが文章に埋もれて読み取りにくくなる。バッジ（ラベル）スタイルは GitHub の Issue/PR ラベルや RubyDoc の `note:` タグのように、パッと見でキーワードを識別させる UX パターンとして広く使われている。

コードブロックの border は `@tailwindcss/typography` の `prose` クラスと Shiki のインライン style の組み合わせにより、ブラウザデフォルトの outline が意図せず目立つ状態になっている。これを明示的に 1px の細線で上書きすることで統一感のある見た目にする。

## Decisions

**バッジ背景色を CSS クラスで付与する理由**：rehypeGherkinEars と GherkinHighlight の 2 実装が共通して `class="k-*"` を出力する設計になっており、`index.css` を変更すれば両方に自動的に適用される。コンポーネント側への変更は不要で、スタイルと構造の関心が分離された状態を維持できる。

**背景色にテーマ固有 hex 値を使う理由**：`--color-border` 等の既存 CSS カスタムプロパティは汎用的な UI 色のために定義されており、キーワード固有の色は各クラスの `color` プロパティとの色相統一が必要。`color-mix()` は Safari 15.4 未満で非対応のため、テーマ別の hex 値をハードコードする方が確実。

**outline を border の代わりに使う理由**：`border` を `.prose pre` に追加すると、ボックスモデルのレイアウト（paddingとの組み合わせ）に影響する可能性がある。`outline` はレイアウトに影響しない描画層プロパティであり、Shiki のインラインスタイルとの干渉を避けつつ視覚的な枠を追加できる。

## Alternatives Considered

- **Tailwind の `ring-*` ユーティリティクラスを使う**：`ring-1 ring-color-border` で同様の効果が出るが、CodeBlock コンポーネントの `className` への追加が必要になり変更箇所が増える。`index.css` への CSS ルール追加の方が局所性が高い。
- **キーワードスパンに Tailwind クラスを直接埋め込む**：`rehypeGherkinEars.ts` の `properties.className` を変更する方法もあるが、テーマ対応のために `data-theme` selector を使った複雑な Tailwind クラスが必要になる。CSS クラスで完結する現行設計を維持する方が保守性が高い。
- **CSS カスタムプロパティでバッジ背景色を定義**：`--k-shall-bg` 等を `:root` に追加する案。キーワードが 11 種あり変数が多くなりすぎるため却下。

## Trade-offs

- バッジ背景色を固定 hex 値でハードコードするため、セピア・グリーンテーマでは軽微な色の不調和が生じる可能性がある（ただし白系の明るい背景では許容範囲内）
- `outline` は Print メディアでは非表示になることがある（スペックビューアは印刷用途が主目的でないため許容）

## Rejected Options

- **`border: 2px solid` → `border: 1px solid` に変更**：既存の `.prose pre` に border が定義されていないため、変更ではなく追加になる。変更と説明する表現は誤解を招くため却下。
- **`GherkinHighlight.tsx` の Tailwind クラスも同時に更新**：`GherkinHighlight.tsx` は別のコンテキスト（将来的な standalone 利用）向けのコンポーネントで、今回の変更スコープ外。スコープを絞ることで実装リスクを最小化する。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ | ✅ 他ステップへの指示・依存なし |
| II. 決定論的マージ | ✅ | ✅ 代替案の評価と採用理由が明示済み |
| III. 質問駆動の要件確定 | ✅ | ✅ トレードオフが記録されており判断の文脈を保持 |
| IV. 双方向アンカー | ✅ | ✅ design.md の Decisions と対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ |
| VI. Security by Default | ✅ | ✅ |
