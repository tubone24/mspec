---
doc_type: AI-Internal
---

# bump-cli-version-0-1-2 — Proposal

## Why

`packages/cli/package.json` の `version` フィールドが現在 `0.1.1` である。
ユーザーの要求に従い `0.1.2` へバンプする。
パッチバージョンの更新のみで、API や機能の変更は伴わない。

## Goals

1. `packages/cli/package.json` の `version` を `0.1.1` → `0.1.2` に更新する

## Non-Goals

- 機能追加・API 変更
- npm publish（publish は別変更で対応）
- CHANGELOG の更新

## Capabilities (touched)

- `cli-core`

## Open Questions

（なし。バージョンバンプのみのシンプルな変更）

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ proposal のみ生成、実装なし | — |
| II. 決定論的マージ | ✅ 新規ファイルのみ、競合なし | — |
| III. 質問駆動の要件確定 | ✅ 変更内容が明確なため質問不要 | — |
| IV. 双方向アンカー | ✅ delta ステップで付与予定 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | — |
