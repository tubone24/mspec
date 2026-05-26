# Checklist: webui-keyword-badge-style

## Delta Spec Coverage

- [ ] **FR-004**: `.k-shall`, `.k-must`, `.k-must-not`, `.k-should`, `.k-should-not`, `.k-may`, `.k-given`, `.k-when`, `.k-then`, `.k-and`, `.k-but` の各クラスに `background-color`、`border-radius: 3px`、`padding: 1px 5px` が追加されていること <!-- verify: fr-004 -->
- [ ] **FR-004**: ダークテーマ (`[data-theme='dark']`) の各 `.k-*` クラスに対応するダーク用 `background-color` が追加されていること <!-- verify: fr-004 -->
- [ ] **FR-004**: GIVEN キーワードがスペックビューア上でバッジ（背景色付き角丸ラベル）として表示され、テキスト色のみの場合より視覚的に目立つこと（Scenario: GIVEN キーワードのバッジ表示） <!-- verify: fr-004 -->
- [ ] **FR-004**: SHALL キーワードが要件テキスト内でバッジとして表示されること（Scenario: SHALL キーワードのバッジ表示） <!-- verify: fr-004 -->
- [ ] **FR-005**: `.prose pre` に `outline: 1px solid var(--color-border)` および `outline-offset: 0` が追加されていること <!-- verify: fr-005 -->
- [ ] **FR-005**: シンタックスハイライト適用済みコードブロックの枠線が 1px 細線で表示され、視覚的に軽い印象になること（Scenario: コードブロック枠線の細さ確認） <!-- verify: fr-005 -->

## Source-of-Truth Regression

- [ ] **FR-001 regression**: `.k-*` クラスへの `background-color` / `padding` 追加が、Shiki によるシンタックスハイライト（トークン着色）に干渉しないこと。`.k-*` は Shiki のトークン span とは別のラッパー span として出力されるが、もし入れ子になる場合は背景色が Shiki カラーを上書きするリスクがある <!-- verify: human -->
- [ ] **FR-001 regression**: `.prose pre` への `outline` 追加が Shiki の inline `style`（`background-color` 等）と重なり、コードブロックの見た目（背景塗りつぶし範囲、スクロール挙動など）を壊さないこと <!-- verify: fr-005 -->
- [ ] **FR-002 regression**: コメントトークンの薄い色表示（Shiki `comment` スコープ）が、`.k-*` バッジスタイル追加後も維持されること。コメント内にキーワード文字列が含まれる場合に `.k-*` スタイルが誤適用されないか確認する <!-- verify: human -->
- [ ] **FR-003 regression**: Markdown HTMLコメント（`<!-- ... -->`）の薄い色表示が、今回の CSS 変更（`.k-*` + `.prose pre outline`）の影響を受けないこと。HTML コメントのレンダリング要素と `.k-*` / `.prose pre` セレクターの対象要素が重複しないことを確認する <!-- verify: human -->
- [ ] **関連 CSS セレクター競合**: `index.css` 内の既存セレクター（Tailwind `prose` ユーティリティ等）と新規追加セレクターとの specificity 競合がないこと <!-- verify: human -->

- [ ] **FR-004 scope**: `GherkinHighlight.tsx` 経由のキーワード（standalone コンポーネント用）は今回の変更スコープ外であることが確認されていること <!-- verify: human -->

## Constitution

- [ ] **I. ステップ独立性**: 変更対象は `index.css` 1 ファイルのみであり、他ステップ・他モジュールへの依存を新たに生じさせていないこと <!-- verify: human -->
- [ ] **II. 決定論的マージ**: `design.md` に各 `.k-*` クラスの具体的プロパティ値（背景色 hex 値・border-radius・padding 値）が全て明示されており、実装者の裁量なく一意に実装できること <!-- verify: human -->
- [ ] **III. 質問駆動の要件確定**: FR-004 のバッジ背景色の色選択根拠（Tailwind カラーパレット対応）および FR-005 の `outline` vs `border` の選択理由が `design-rationale.md` または `design.md` に記録されており、追跡可能であること <!-- verify: human -->
- [ ] **IV. 双方向アンカー**: `packages/web-ui/src/index.css` の実装箇所に `@mspec-delta` アンカーコメントが打たれており、FR-004 および FR-005 それぞれに対応するアンカーブロックが存在すること <!-- verify: human -->
- [ ] **V. 強制ステップと拡張ステップの分離**: 今回の変更はオプション拡張を含まず、強制対象（CSS クラス追加）のみであること <!-- verify: human -->
- [ ] **VI. Security by Default**: CSS のみの変更であり、権限境界・外部 API・秘密情報・認証への影響がないこと。XSS 等のセキュリティリスクが存在しないこと <!-- verify: human -->
