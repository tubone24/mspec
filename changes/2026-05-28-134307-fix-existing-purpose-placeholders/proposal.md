---
doc_type: Explanation
---

# Proposal: fix-existing-purpose-placeholders

## Why

`mspec-archive` SKILL.md に step 3d（Purpose 自動生成）を追加した `fix-specviewer-purpose-regression` チェンジにより、今後の archive 時は新規 capability spec の Purpose が自動生成されるようになった（FR-005）。しかし、既存の 41 件の capability spec（`specs/*/spec.md`）はテンプレートプレースホルダー（`<このスペックがカバーする外部から観測可能な振る舞いの概要>`）のままになっており、SpecViewer に不完全な情報が表示され続けている。

この retroactive バックフィルは Claude Code がアドホックスクリプトとして実行する一回限りの処理であり、新しい CLI コマンドや SKILL.md の変更を必要としない。各 spec の Requirements 内容を AI が読み取り、正規表現でプレースホルダー行のみを置換する。

## Goals

- 41 件の既存 capability spec の `## Purpose` プレースホルダーを意味のある 1〜2 文の記述で置換する
- プレースホルダー以外が記述済みのファイルはスキップする（冪等性）
- 正規表現でプレースホルダー行のみをピンポイント置換し、Requirements・FR 番号等の他セクションは変更しない

## Non-Goals

- 新規 CLI コマンド（`mspec fix-purpose` 等）の実装
- SpecViewer の UI 修正（プレースホルダー非表示フォールバック）
- `mspec archive` 時の Purpose 自動生成ロジックの変更（FR-005 は実装済み）
- Purpose の多言語同時生成（locale 設定に従い日本語のみ生成）

## Capabilities (touched)

- `mspec-archive`（バックフィル処理を FR-006 として記録）

## Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| 実行方法 | Claude Code アドホック（スクリプト） | 一回限りの処理のため専用 CLI/SKILL は不要 |
| 内容検証 | AI 自動承認（レビューなし） | プレースホルダー解消を優先。git で元に戻せる |
| ロールバック | Git で戻せる（バックアップ不要） | コミット前なら git checkout で完全復元可能 |
| 安全性 | 正規表現でプレースホルダーのみ置換 | `<このスペックが...>` 行のみ対象。他セクション不変 |
| 冪等性 | プレースホルダー以外はスキップ | 再実行しても既に生成済みの Purpose は変更しない |

## Open Questions

（なし。全決定事項を Decisions に記録済み）

## Constitution Check

> Step: proposal | Constitution Version: 1.1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | アドホック実行はワークフローの他ステップに影響しない |
| II. 決定論的マージ | ✅ | — | 正規表現による局所置換。CLI マージは変更なし |
| III. 質問駆動の要件確定 | ✅ | — | 実行方法・安全性・冪等性を質問で確定済み |
| IV. 双方向アンカー | N/A | — | アドホック実行のためアンカー対象なし |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | SKILL.md・workflow.yaml の変更なし |
| VI. Security by Default | ✅ | — | ローカルファイル書き込みのみ。外部ネットワーク依存なし |
| VII. 設計意図と実装の対応確認 | ✅ | — | FR-005 設計意図（既存 spec への retroactive 適用）を本チェンジで明示的に実装 |
