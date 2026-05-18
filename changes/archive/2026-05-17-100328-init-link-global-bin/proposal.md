---
doc_type: Proposal
---

# Proposal: init-link-global-bin

## Why

`mspec init` を実行しても `mspec` グローバルコマンドが使えない状態が続く。
`packages/cli/package.json` には `bin.mspec` が定義されているが、開発者がリポジトリをクローンした場合に `npm link` が行われないため、`mspec` コマンドが PATH に存在しない。
また開発中の動作確認は常に最新ビルドを通じて行いたいため、`init` 時にビルドとリンクをセットで行う必要がある。

## Goals

1. `mspec init` 実行時に `packages/cli` ディレクトリが検出された場合（dev-mode）、`npm run build` → `npm link` を自動実行してグローバルコマンドを有効にする。
2. 既存の `/opt/homebrew/bin/mspec` リンクは自動上書きする（`npm link` のデフォルト動作に委ねる）。
3. `packages/cli` が存在しない場合（`npm install -g @mspec/cli` ユーザー）はリンク処理をスキップし、既存の挙動を維持する。

## Non-Goals

- `npm install -g` ユーザーへのグローバルリンク処理（スコープ外）
- Windows / Linux での `npm link` 先パスの変更（npmが自動解決）
- CI/CD 環境での自動インストール
- パフォーマンス最適化・国際化対応・アクセシビリティ

## Capabilities (touched)

- `cli-init-command`

## Open Questions

- `npm run build` に失敗した場合（TypeScriptエラー等）、`init` 全体を失敗扱いにするか、警告のみにするか。
  → 実装フェーズで決定。ビルド失敗は警告にとどめ、init の他ファイル配置は完了させる方向で検討。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I: ステップ独立性 | ✅ `init.ts` に閉じた変更。他ステップに影響なし | — |
| II: 決定論的マージ | ✅ `npm link` は冪等（繰り返し実行しても同じ結果）。既存リンクは上書き | — |
| III: 質問駆動の要件確定 | ✅ 実装方法・ビルド有無・有効範囲・既存リンク対応を質問で確定 | — |
| IV: 双方向アンカー | ✅ 実装ファイルに `@mspec-delta` アンカーを埋め込む | — |
| V: 強制ステップと拡張ステップの分離 | ✅ 本変更は init コマンドの拡張のみ。スキーマや他コマンドに変更なし | — |
