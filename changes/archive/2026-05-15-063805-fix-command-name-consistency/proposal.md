---
doc_type: Explanation
---

# Proposal: fix-command-name-consistency

## Why

mspec ワークフローのスキルファイル・CLIメッセージ・ドキュメント・テンプレート内で、次のステップ指示に `mspec-continue`・`mspec-proposal` 等のハイフン区切り形式が混在している。
正しいコマンド名はコロン区切り形式（`/mspec:continue`・`/mspec:proposal`）であり、ハイフン形式は存在しないコマンドを指している誤記である。
ユーザーがそのまま実行すると「コマンドが見つからない」という混乱を招くため、全ファイルでコロン形式に統一し、ハイフン形式を完全に廃止する。

## Goals

- `.claude/skills/` 配下のスキルファイル内のハイフン形式コマンド参照をすべてコロン形式に修正する
- `packages/cli/` のソースコード・出力メッセージ内のハイフン形式をコロン形式に修正する（例：`next: run /mspec-proposal` → `next: run /mspec:proposal`）
- `packages/cli/templates/` 配下のテンプレートファイル内のハイフン形式をコロン形式に修正する
- `docs/` および `README.md` 等のドキュメント内のハイフン形式をコロン形式に修正する
- 修正後、`grep` でハイフン形式の残存件数が 0 件になることを確認する

## Non-Goals

- コマンド体系そのものの変更（ステップ名・順序の変更は行わない）
- 後方互換性のためのエイリアス追加（ハイフン形式を残さず完全廃止）
- スキルの機能追加・ロジック変更
- テストファイルの新規作成（既存テストの修正のみ）

## Capabilities (touched)

- `claude-integration`
- `cli-core`

## Open Questions

なし（ユーザーへの質問で解決済み）

## Constitution Check

> Step: proposal | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 各ファイルへの修正は独立しており、相互依存なし |
| II. 決定論的マージ | ✅ | — | ハイフン→コロンの文字列置換は決定論的 |
| III. 質問駆動の要件確定 | ✅ | — | 4問で対象範囲・廃止方針・完了基準を確定済み |
| IV. 双方向アンカー | ✅ | — | 修正は既存 FR に紐づく誤記修正のため新アンカー不要 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | 既存ファイルの文字列修正のみ；ステップ追加なし |

### Complexity Tracking

None
