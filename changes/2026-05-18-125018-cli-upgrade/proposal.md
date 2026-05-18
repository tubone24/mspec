---
doc_type: AI-Internal
---

# cli-upgrade — Proposal

## Why

`mspec` CLI をインストールしたユーザーが最新バージョンへのアップグレード方法を知らず、毎回手動で `npm install -g @mspec/cli@latest` を実行する必要がある。
`mspec upgrade` コマンドを追加し、現在バージョンと最新バージョンを確認した上でアップグレードを実行できるようにすることで、ユーザー体験を向上させる。

## Goals

- `mspec upgrade` サブコマンドを新規実装する
- 実行時に現在インストール済みバージョンと npm registry 上の最新バージョンを表示する
- ユーザーが確認後、`npm install -g @mspec/cli@latest` を実行してアップグレードする
- すでに最新バージョンの場合は「already up-to-date」旨のメッセージを返して終了する
- ネットワークエラー等のエラーシナリオで適切なエラーメッセージを表示する

## Non-Goals

- Homebrew 経由のインストール環境への対応
- 特定バージョンへのダウングレード（`mspec upgrade --version x.y.z` のような機能）
- ベータ版・RC 版チャンネルへのアップグレード
- 自動アップデート（起動時の定期チェックなど）

## Capabilities (touched)

- `cli-upgrade` — `mspec upgrade` サブコマンドの実装（バージョン取得・表示・npm 実行）
- `version-check` — 現在バージョンと npm registry 最新バージョンの比較ロジック

## Open Questions

- インタラクティブな確認プロンプト（y/n）を設けるか、`--yes` フラグで省略できるようにするか？
- npm の実行権限がない環境（sudo 必要な場合）での案内はどうするか？

## Constitution Check

| 原則 | Phase 0 (Proposal) | Phase 1 (Design) |
|------|--------------------|------------------|
| I ステップ独立性 | OK — 本提案は proposal 単体で完結しており、後続ステップに依存する記述がない | — |
| II 決定論的マージ | OK — capability 名は kebab-case で一意、delta init の入力として曖昧さなし | — |
| III 質問駆動の要件確定 | OK — 機能スコープ・インストール方法・期待動作・Non-Goals・完了基準を 5 問で確定した | — |
| IV 双方向アンカー | OK — 本 proposal は readme.md の Request と整合しており、逸脱なし | — |
| V 強制ステップと拡張ステップの分離 | OK — research / design / checklist はすべて後続ステップとして分離されている | — |
