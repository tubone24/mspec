---
doc_type: Explanation
---

# Proposal: step-checkbox-update

## Why

mspec ワークフローの各ステップ完了時に、`readme.md` の `## Artifacts` チェックボックス・`tasks.md` のタスクチェックボックス・`checklist.md` の verify 項目が更新されないバグ（機能不足）がある。
アーカイブ済みの change を見ても全チェックボックスが `- [ ]` のままであり、ワークフローの進捗を視覚的に追うことができない。
各スキルファイルに成果物生成後のチェックボックス更新手順を追加し、ステップ完了時に確実に `- [x]` が付くようにする。

## Goals

- `readme.md` の `## Artifacts` 節：各ステップが成果物を書いた直後に対応するチェックボックスを `- [x]` に更新する
- `tasks.md` のタスクチェックボックス：`mspec-implement` が `--expect-green` 成功後に対応する `- [ ] TNNN` を `- [x] TNNN` に更新する
- `checklist.md` の verify 項目：既存の `<!-- verify: fr-NNN -->` 自動チェックに加え、`mspec-checklist-auditor` が全項目に確実にアノテーションを付与するよう強化する

## Non-Goals

- CLI コマンドの変更（スキルファイルのみ修正）
- 新しいスキルや新しい CLI コマンドの追加
- `readme.md` の Status 行（`> Status: new`）の自動更新

## Capabilities (touched)

- `claude-integration`

## Open Questions

なし（ユーザーへの質問で解決済み）

## Constitution Check

> Step: proposal | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 各スキルが自ステップの成果物のみのチェックボックスを更新 |
| II. 決定論的マージ | ✅ | — | `- [ ]` → `- [x]` は決定論的なテキスト置換 |
| III. 質問駆動の要件確定 | ✅ | — | 3 問でスコープ・対象ファイル・修正範囲を確定済み |
| IV. 双方向アンカー | ✅ | — | 新 FR は claude-integration に追加し Delta Spec でアンカー化 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | 既存の強制ステップ内への手順追加のみ；新ステップ不要 |

### Complexity Tracking

None
