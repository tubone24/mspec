---
doc_type: Explanation
---

# Proposal: produces レスステップの done 遷移修正

## Why

`implement`・`archive`・`self-review` の 3 ステップは `produces: []` であり、`state-engine.ts` の `evaluateStep` 関数（L74-78）が `produces.length === 0` のとき常に `'ready'` を返す設計のため、`'done'` に遷移する経路が存在しない。
回避策として `workflow.yaml` に `skippable: true` が追加されたが、「スキップ（意図的な省略）」と「完了（作業を終えた）」を混同させる設計であり根本解決になっていない。
`mspec done <step-id>` コマンドと `done-log.yaml` を導入し、produces を持たないステップを正しく `done` へ遷移させる。

## Goals

- `mspec done <step-id>` コマンドを追加し、produces レスステップを明示的に done にできる
- `done-log.yaml` をチェンジディレクトリに新設し、`skip.yaml` と対称的に done 状態を永続化する
- `state-engine.ts` が `done-log.yaml` を参照して produces レスステップの `done` を判定できる
- `workflow.yaml` から `implement`・`archive`・`self-review` の `skippable: true` を削除し、意味的一貫性を回復する

## Non-Goals

- produces を持つステップへの `skippable` 変更は行わない（research・quickstart・checklist の `skippable: true` は存続）
- `mspec done` の取り消し（undone）コマンドは今回スコープ外
- パフォーマンス最適化・国際化対応・認証変更は対象外

## Capabilities (touched)

- cli-state-engine
- cli-done-log
- cli-workflow-engine

## Open Questions

- なし（質問駆動で全方針確定済み）

## Constitution Check

> Step: proposal | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | `mspec done` は各ステップ独立に動作し、前段の会話文脈に依存しない |
| II. 決定論的マージ | ✅ | — | `done-log.yaml` は archive のマージ対象成果物ではなく、マージロジックに影響しない |
| III. 質問駆動の要件確定 | ✅ | — | 4問の AskUserQuestion で方向性（コマンド方式・スコープ・skippable 削除・保存先）を確定 |
| IV. 双方向アンカー | — | — | アンカーロジックへの影響なし |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | `skippable: true` を削除することで強制ステップ（removable:false）の意味がより明確になる |

### Complexity Tracking

None
