---
doc_type: AI-Internal
---

<!-- @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md -->
<!-- Requirements implemented: (TBD at delta step) -->

# Proposal: ui-visual-mock-workflow

## Why

UI 画面を言語ベースの仕様書に記述するのは難しく、認識齟齬が起きやすい。
代わりに HTML/CSS/JS で visual mock を先に生成してブラウザで確認し、
ユーザーからのフィードバックを収集して tasks.md に反映するワークフローを mspec に追加する。

## Goals

- mspec ワークフローに `visual-mock` ステップを追加する
- Claude が HTML/CSS/JS の mock ファイルを `changes/<change>/mock/` に生成し、ローカル HTTP サーバーで起動する
- ブラウザで mock を確認したユーザーからフィードバックを収集し、tasks.md に反映する
- 既存ワークフロー（proposal → delta → research → design → tasks）との整合性を維持する

## Non-Goals

- Figma・外部デザインツールとの連携
- リアルタイム共同編集
- CI/CD パイプラインへの組み込み
- mock から実装コードの自動生成

## Capabilities (touched)

- `visual-mock`（新規）: HTML/CSS/JS mock の生成・サーブ・フィードバック収集
- `cli-workflow-engine`（修正）: visual-mock ステップをワークフロー定義に追加
- `cli-core`（修正）: `mspec mock` サブコマンドの追加

## Open Questions

- visual-mock ステップは proposal の直後に入れるか、tasks の直前に入れるか？
  （早期フィードバック vs 設計が固まってから mock を作る、のトレードオフ）
- フィードバックの収集方式: CLI の対話入力か、mock ページに埋め込むかのどちらか？
- mock ファイルは archive 後も `changes/` に残すか、削除するか？

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I  ステップ独立性 | ✅ visual-mock は独立したステップとして定義し、他ステップの成果物を書き換えない | — |
| II  決定論的マージ | ✅ mock ファイルは `changes/<change>/mock/` 以下に配置し、SoT spec との衝突なし | — |
| III  質問駆動の要件確定 | ✅ 5 問の質問でスコープ・Non-Goal・完了基準を確定済み | — |
| IV  双方向アンカー | ✅ 本 proposal に `@mspec-delta` アンカーを記載済み | — |
| V  強制ステップと拡張ステップの分離 | ✅ visual-mock は任意（拡張）ステップとして追加し、既存の強制ステップを変更しない | — |
