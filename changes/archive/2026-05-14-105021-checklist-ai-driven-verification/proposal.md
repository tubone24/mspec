# Proposal: checklist-ai-driven-verification

## Why

現状の `checklist.md` は「人間が検証後にチェックを入れる」前提で設計されており、AI が実装フェーズ中に自動検証してチェックを入れるワークフローが存在しない。  
テストが RED → GREEN になったという事実は AI が直接確認できる証跡であり、対応するチェックリスト項目を自動でチェック済みにすることで、人間のレビュー負担を削減しつつ検証漏れを防げる。  
また、AIが自動チェックできない項目（Constitution / 設計方針等）は「人間レビュー要求」として明示し、完了後の未チェック項目を報告することでフォールスルーを防ぐ。

## Goals

- `mspec-checklist-auditor` が生成する各項目に `verify: task-XXX` または `verify: human` のメタデータを付与し、AI が検証可能かどうかを明示する
- `mspec-implement` スキルが各タスク GREEN 時に `checklist.md` の対応項目（`verify: task-XXX`）を自動チェックする
- 全タスク完了後に未チェック項目が残る場合、その理由を説明してユーザーに指示を仰ぐステップを追加する
- ランタイムファイル（`.claude/`）とテンプレートファイル（`packages/cli/templates/`）の両方を同期更新する

## Non-Goals

- checklist.md のフォーマット（セクション構成）は変更しない
- `mspec-checklist` スキル本体（呼び出し手順）は変更しない
- CLI ソースコード（TypeScript）の変更は行わない
- パフォーマンス最適化・国際化・モバイル対応

## Capabilities (touched)

- `claude-integration`

## Open Questions

- `verify: task-XXX` の形式は checklist.md の各リスト項目のインライン末尾コメント（`<!-- verify: task-001 -->`）として埋め込むか、別行として記述するか？（設計フェーズで確定）
- `verify: human` 項目と未チェック項目の区別をユーザーへの報告時にどう表現するか？

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ checklist ステップ（生成）と implement ステップ（検証）は独立して機能する。implement は checklist.md の `verify:` メタデータを読むだけで生成ロジックに依存しない | — |
| II. 決定論的マージ | ✅ 本変更は Skill / Agent の Markdown ファイル編集のみ。CLI の archive / merge ロジックには触れない | — |
| III. 質問駆動の要件確定 | ✅ スコープ・未検証項目の扱い・検証粒度の 3 点を AskUserQuestion で確定した | — |
| IV. 双方向アンカー | ✅ 実装フェーズで変更するすべてのファイルに `@mspec-delta` アンカーブロックを付与する | — |
| V. 強制ステップと拡張ステップの分離 | ✅ checklist は引き続き独立したワークフローステップ。implement への自動チェック追加は既存ステップの手順拡張であり新ステップ追加ではない | — |
