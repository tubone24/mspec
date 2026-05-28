---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md -->
<!-- Requirements implemented: FR-006 -->
<!-- Change: fix-pre-tag-checklist-ui -->

<!-- @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md -->
<!-- Requirements implemented: FR-005, FR-006 -->
<!-- Change: fix-pre-tag-checklist-ui -->

# Checklist: fix-pre-tag-checklist-ui

## Delta Spec Coverage

- [x] **code-syntax-highlight FR-006**: `ArtifactViewer` の `pre` カスタムレンダラーが `{children}` をそのまま返し、DOM 上の `<pre>` タグが 1 層のみになること（Scenario: AskUserQuestion コードブロックの正常描画） <!-- verify: fr-006 -->
- [x] **code-syntax-highlight FR-006**: 通常の Markdown コードフェンスでも `<pre>` が 1 層のみで Shiki ハイライトが正しく適用されること（Scenario: 通常の Markdown コードフェンスの正常描画） <!-- verify: fr-006 -->
- [x] **web-ui-server FR-005**: `<!-- verify: human -->` コメント付きチェックリスト項目が警告色（黄色背景・オレンジ枠線）でハイライト表示されること（Scenario: verify-human 項目の色付き表示）（視覚的確認は機械検証不可） <!-- verify: human -->
- [x] **web-ui-server FR-005**: `<!-- verify: human -->` コメントを持たない通常項目にハイライトが適用されないこと（Scenario: verify-human 以外の項目は通常表示） <!-- verify: fr-005 -->
- [x] **web-ui-server FR-006**: チェックボックス未チェック項目をクリックするとチェック済み状態に遷移すること（Scenario: チェックボックスのトグル操作）（インタラクティブ操作は E2E テストで検証が必要） <!-- verify: fr-006 -->
- [x] **web-ui-server FR-006**: チェック済み項目をクリックすると未チェック状態に戻ること（Scenario: チェック済み項目のアンチェック操作）（インタラクティブ操作は E2E テストで検証が必要） <!-- verify: fr-006 -->

## Source-of-Truth Regression

- [x] **code-syntax-highlight FR-001 (Shiki ハイライト)**: `pre` パススルーにより Shiki 生成の内側 `<pre>` がそのまま描画されるため低リスクだが、ハイライトが正しく維持されることを確認する <!-- verify: fr-006 -->
- [x] **code-syntax-highlight FR-005 (枠線細線化)**: 外側 `<pre>` を除去したことで CSS の border が外側 `<pre>` をターゲットにしていた場合は枠線が消失する可能性がある。Shiki 生成の `<pre>` が border CSS を継承しているか実装と CSS を確認すること（視覚的確認は機械検証不可） <!-- verify: human -->
- [x] **code-syntax-highlight FR-002 (コードコメント薄色表示)**: `pre` タグの変更は Shiki のトークンスコープに影響しないため回帰リスクなし。念のため確認する（視覚的許容性は機械検証不可） <!-- verify: human -->
- [x] **code-syntax-highlight FR-003 (Markdown HTMLコメント薄色表示)**: `pre` タグ変更は `rehypeCommentDim` の処理対象外のため回帰リスクなし。念のため確認する（視覚的許容性は機械検証不可） <!-- verify: human -->
- [x] **code-syntax-highlight FR-004 (ガーキン/EARS バッジ)**: `pre` タグ変更はバッジレンダリングロジック（`li`/テキストノード）と無関係。回帰リスクなし（視覚的許容性は機械検証不可） <!-- verify: human -->
- [x] **web-ui-server FR-001 (サーバー起動)**: 変更は React コンポーネント（`ArtifactViewer.tsx`）のみ。サーバープロセス管理には影響なし。回帰リスクなし <!-- verify: human -->
- [x] **web-ui-server FR-002 (プロセス再利用)**: 同上。回帰リスクなし <!-- verify: human -->
- [x] **web-ui-server FR-003 (PID ファイル管理)**: 同上。回帰リスクなし <!-- verify: human -->
- [x] **web-ui-server FR-004 (ポート設定)**: 同上。回帰リスクなし <!-- verify: human -->

## Constitution

- [x] **I. ステップ独立性**: 変更は `ArtifactViewer.tsx` 1 ファイルに閉じており、他コンポーネントへの依存増加がないことを確認する（設計判断の妥当性は機械検証不可） <!-- verify: human -->
- [x] **II. 決定論的マージ**: 新規追加レンダラー（`pre`/`li`/`input`）は既存の `code` レンダラーを変更せず、追加のみであることを確認する（設計判断の妥当性は機械検証不可） <!-- verify: human -->
- [x] **III. 質問駆動の要件確定**: インデックス採番方式（`useRef`）の決定根拠が `design.md` の D-03 に記録されていることを確認する（設計判断の妥当性は機械検証不可） <!-- verify: human -->
- [x] **IV. 双方向アンカー**: `mspec anchor check` 実行結果 — Scanned 266 anchor(s), 0 error(s) <!-- verify: human -->
- [x] **V. 強制ステップと拡張ステップの分離**: CLI ワークフロー（`workflow.yaml`）への変更がなく、強制ステップ定義に影響しないことを確認する（設計判断の妥当性は機械検証不可） <!-- verify: human -->
- [x] **VI. Security by Default**: 両 Delta Spec（code-syntax-highlight / web-ui-server）に `## Security Capabilities` セクションが存在し PRP-SEC 回答が含まれることを確認済み <!-- verify: human -->
