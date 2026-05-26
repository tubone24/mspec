---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-26-113511-webui-keyword-badge-style/specs/code-syntax-highlight/spec.md -->
<!-- Requirements implemented: FR-004, FR-005 -->
<!-- Change: webui-keyword-badge-style -->

# Tasks: webui-keyword-badge-style

> 変更対象: `packages/web-ui/src/index.css` 1 ファイルのみ。
> TDD: E2E（Red）→ CSS 実装（Green）の順序を厳守。
> change-dir: `2026-05-26-113511-webui-keyword-badge-style` / feature-kebab: `webui-keyword-badge-style`

## Phase 1: Setup

- [ ] T001 [P] ベースライン確認 — `packages/web-ui` で `pnpm test` および Playwright E2E が緑であることを確認し、本チェンジ前の基準を固定する。files: `packages/web-ui/`

## Phase 2: Foundational

### Tests-first (E2E — Red)

- [ ] T101 E2E for FR-004 Scenario "GIVEN キーワードのバッジ表示" — Playwright で spec ファイルを開き、`span.k-given` の computed style に `background-color`（`rgba(0, 0, 0, 0)` 以外）・`border-radius`（0 より大）・`padding`（0 より大）が設定されていることを検証する。ライトテーマで `background-color` が `rgb(219, 234, 254)`（blue-100）と一致することも確認する。files: `packages/web-ui/tests/e2e/keyword-badge.e2e.test.ts`（新規）
      anchor:
        @mspec-delta 2026-05-26-113511-webui-keyword-badge-style/specs/code-syntax-highlight/spec.md
        Requirements implemented: FR-004
        Change: webui-keyword-badge-style

- [ ] T102 E2E for FR-004 Scenario "SHALL キーワードのバッジ表示" — `span.k-shall` の computed style に `background-color: rgb(254, 226, 226)`（red-100）・`border-radius`・`padding` が設定されていることを検証する。files: `packages/web-ui/tests/e2e/keyword-badge.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-26-113511-webui-keyword-badge-style/specs/code-syntax-highlight/spec.md
        Requirements implemented: FR-004
        Change: webui-keyword-badge-style

- [ ] T103 E2E for FR-005 Scenario "コードブロック枠線の細さ確認" — Playwright でコードブロックを含む spec ファイルを開き、`.prose pre` の computed style `outline-width` が `1px` であることを検証する。files: `packages/web-ui/tests/e2e/keyword-badge.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-26-113511-webui-keyword-badge-style/specs/code-syntax-highlight/spec.md
        Requirements implemented: FR-005
        Change: webui-keyword-badge-style

### Implementation (Green)

- [x] T110 `index.css` に FR-004 バッジスタイルを追加 — `packages/web-ui/src/index.css` の `/* ── EARS Keywords ──` セクションに `background-color`, `border-radius: 3px`, `padding: 1px 5px` を各 `.k-*` クラスに追記。`/* ── Gherkin Keywords ──` セクションにも同様に追記。`/* ── Dark theme overrides ──` の各 `.k-*` に dark 用 `background-color`（red-950/amber-950/blue-950 等）を追加。T101/T102 が GREEN になることを確認。files: `packages/web-ui/src/index.css`
      anchor:
        @mspec-delta 2026-05-26-113511-webui-keyword-badge-style/specs/code-syntax-highlight/spec.md
        Requirements implemented: FR-004
        Change: webui-keyword-badge-style

- [x] T111 `index.css` に FR-005 コードブロック outline を追加 — `packages/web-ui/src/index.css` の末尾に `.prose pre { outline: 1px solid var(--color-border); outline-offset: 0; }` を追記。T103 が GREEN になることを確認。files: `packages/web-ui/src/index.css`
      anchor:
        @mspec-delta 2026-05-26-113511-webui-keyword-badge-style/specs/code-syntax-highlight/spec.md
        Requirements implemented: FR-005
        Change: webui-keyword-badge-style

- [x] T112 `index.css` に `@mspec-delta` アンカーコメントを追加（Constitution IV 対応）— FR-004 の EARS/Gherkin Keywords セクション直前に以下を追記:
  ```
  // @mspec-delta 2026-05-26-113511-webui-keyword-badge-style/specs/code-syntax-highlight/spec.md
  // Requirements implemented: FR-004
  // Change: webui-keyword-badge-style
  ```
  FR-005 の `.prose pre` ルール直前にも同様に FR-005 のアンカーを追記。files: `packages/web-ui/src/index.css`

## Phase 3: User Story

- [ ] T201 手動目視確認 — `packages/web-ui` で `pnpm dev` を起動し、spec ファイルを ライト・ダーク・セピア・グリーン の 4 テーマで閲覧する。チェック項目: (1) キーワードが角丸バッジとして視覚的に目立つ (2) コードブロックの枠線が細くなっている (3) セピア・グリーンテーマで軽微な色の不調和は許容（design-rationale.md のトレードオフ記録通り）。files: なし（手動確認）

## Phase 4: Polish

- [ ] T301 FR-001/FR-002/FR-003 リグレッション確認 — E2E または手動で以下を確認: (1) Shiki シンタックスハイライトが正常に機能する (2) コードコメントが薄い色で表示される (3) Markdown HTML コメントが薄い色で表示される。files: なし

- [ ] T302 `GherkinHighlight.tsx` スコープ外確認 — `GherkinHighlight.tsx` が Tailwind クラスを直接使用する経路では FR-004 バッジが適用されないことを確認（スコープ外として設計済み）。既存動作が変わっていないことを手動で確認する。files: なし

## Constitution Check

| Principle | Phase 0 |
|-----------|---------|
| I. ステップ独立性 | ✅ 全タスクが `index.css` 単一ファイルを対象とし、他ステップへの依存なし |
| II. 決定論的マージ | ✅ 各タスクに対象ファイル・変更内容・受け入れ条件を明示 |
| III. 質問駆動の要件確定 | ✅ FR-004/FR-005 の具体的 CSS 値は design.md で確定済み |
| IV. 双方向アンカー | ✅ T101〜T111 に `anchor:` 3 行ブロックを付与。T112 で `index.css` への `@mspec-delta` アンカー追記を必須タスク化 |
| V. 強制ステップと拡張ステップの分離 | ✅ E2E テスト・CSS 実装・アンカー追記は全て強制（optional なし） |
| VI. Security by Default | ✅ CSS のみの変更、セキュリティリスクなし |
