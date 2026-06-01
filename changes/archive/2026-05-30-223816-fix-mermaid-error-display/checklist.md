---
doc_type: Reference
---

# Checklist: fix-mermaid-error-display

## 機能確認

- [x] FR-015: 構文エラーを含む Mermaid ブロックをレンダリングしたとき「Syntax error in text」「mermaid version」を含む大きなエラー文字列が表示されず、コンパクトな「⚠ Mermaid 構文エラー」バッジのみが表示されることを確認する <!-- verify: fr-015 -->
- [x] FR-015: 構文的に正しい Mermaid ブロックを含む MD をプレビューしたとき、SVG ダイアグラムが正常に描画され、エラーインジケータが表示されないことを確認する <!-- verify: fr-015 -->

> 注: FR-016 は `risk_tier: trivial` のため checklist 項目を生成しない（スキップ）。

## リグレッションリスク

- [x] FR-002: `MermaidRenderer.tsx` 変更後も、構文的に正しい Mermaid フローチャートが SVG として正常に描画されることを確認する（`suppressErrorRendering: true` 追加・`parse()` 導入が正常系に影響していないこと） <!-- verify: fr-002 -->
- [x] FR-006: Playwright E2E テストで `[data-testid="mermaid-svg"] svg` セレクターに一致する SVG 要素が 1 件以上存在することを確認する（`mermaid.initialize()` 引数変更が E2E テストの前提条件を破壊していないこと） <!-- verify: human -->
  - `MermaidRenderer.tsx` の `mermaid.initialize({ suppressErrorRendering: true })` が既存の `data-testid="mermaid-svg"` 付与ロジックと競合していないことをコードレビューで確認する
  - Playwright を実行して `[data-testid="mermaid-svg"] svg` セレクターが 1 件以上 pass することを確認する

## デプロイ前確認

- [x] `MermaidRenderer.tsx` に `mermaid.parse()` 呼び出しが実装されており、parse 失敗時にレンダリングをスキップするコードパスが存在することを確認する <!-- verify: fr-015 -->
- [x] `mermaid.initialize()` に `suppressErrorRendering: true` が設定されていることをコード上で確認する <!-- verify: fr-015 -->
- [x] エラー表示が `String(err)` の生出力ではなく固定の「⚠ Mermaid 構文エラー」バッジに変更されていることを確認する <!-- verify: fr-015 -->

## Constitution Check

- [x] Constitution IV — 双方向アンカー: `mspec anchor check` 実行結果が 0 エラーであることを確認済み <!-- verify: cmd:mspec anchor check --change 2026-05-30-223816-fix-mermaid-error-display -->
- [x] Constitution VI — Security by Default: Delta Spec に `## Security Capabilities` セクションが存在することを確認済み <!-- verify: cmd:grep "## Security Capabilities" changes/2026-05-30-223816-fix-mermaid-error-display/specs/artifact-preview/spec.md -->
- [x] Constitution VII — 設計意図と実装の対応: `design.md` の Decision 1（suppressErrorRendering）・Decision 2（parse() バリデーション）・Decision 3（コンパクトエラー表示）がそれぞれ `MermaidRenderer.tsx` の実装に対応していることをコードレビューで確認する（設計判断の実装対応は機械検証不可） <!-- verify: human -->
  - `MermaidRenderer.tsx` 内に `suppressErrorRendering: true` が設定されていることを確認する
  - `MermaidRenderer.tsx` 内に `mermaid.parse()` 呼び出しと例外ハンドリングが実装されていることを確認する
