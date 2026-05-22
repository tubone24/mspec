---
doc_type: AI-Internal
---

# fix-upgrade-package-json-path — Proposal

## Why

グローバルインストールされた `@mspec/cli` で `mspec upgrade` を実行すると、
`Error: Cannot find module '../../package.json'` が発生して失敗する。
`dist/index.js` から `../../package.json` への相対パスがグローバルインストール時（`/opt/homebrew/lib/node_modules/@mspec/cli/`）に正しく解決されないことが原因。
`__dirname` ベースの絶対パス参照に修正し、どの環境でも正しく動作するようにする。

## Goals

1. `mspec upgrade` コマンドの `package.json` 参照を `__dirname` ベースの絶対パスに修正する
2. グローバルインストール環境（`npm install -g`）で `mspec upgrade` が正常に動作することを確認する
3. ローカルインストール環境でも regression なく動作し続けることを確認する

## Non-Goals

- パフォーマンス最適化
- `upgrade` 以外のコマンドでの同種パス解決問題の修正（別変更で対応）
- テストコードの追加

## Capabilities (touched)

- `upgrade-command`

## Open Questions

（なし。修正方針は `__dirname` ベースの絶対パスで合意済み）

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ proposal のみ生成、実装なし | — |
| II. 決定論的マージ | ✅ 新規ファイルのみ、競合なし | — |
| III. 質問駆動の要件確定 | ✅ 修正アプローチ・完了基準を確認済み | — |
| IV. 双方向アンカー | ✅ delta ステップで付与予定 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | — |
