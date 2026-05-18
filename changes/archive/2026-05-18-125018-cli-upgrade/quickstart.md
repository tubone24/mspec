---
doc_type: How-to
---

# Quickstart: mspec upgrade

`mspec upgrade` コマンドを使って、インストール済みの mspec CLI を最新の安定バージョンに更新する方法を説明します。

## Prerequisites

- mspec CLI がグローバルにインストールされていること (`npm install -g @mspec/cli`)
- Node.js `>=18.0.0`
- npm がインストールされていること
- インターネット接続（npm registry へのアクセスが必要）

## Setup

追加のセットアップは不要です。`mspec upgrade` は mspec CLI に組み込まれています。

現在のバージョンを確認するには:

```bash
mspec --version
```

## Try it (Golden Path)

### 1. アップグレードを実行する

```bash
mspec upgrade
```

実行すると、現在のバージョンと最新バージョンが表示されます:

```
現在のバージョン: 0.1.0-beta.1
最新バージョン:   1.0.0

アップグレードしますか？ [y/N]
```

`y` を入力して Enter を押すと、アップグレードが開始されます。

```
added 42 packages, and audited 43 packages in 3s
✓ アップグレード完了
```

### 2. 確認プロンプトをスキップする（--yes フラグ）

スクリプトや自動化環境で確認なしにアップグレードするには:

```bash
mspec upgrade --yes
# または
mspec upgrade -y
```

## Verify

アップグレード後にバージョンを確認します:

```bash
mspec --version
# → 1.0.0 (最新バージョン)
```

### すでに最新バージョンの場合

最新バージョンがすでにインストールされている場合、アップグレードは実行されません:

```
現在のバージョン: 1.0.0
最新バージョン:   1.0.0

すでに最新バージョンです (1.0.0)
```

## Troubleshooting

### ネットワークエラーが発生した場合

```
バージョン情報の取得に失敗しました: fetch failed
```

- インターネット接続を確認してください
- ファイアウォールや VPN が npm registry (`registry.npmjs.org`) へのアクセスをブロックしていないか確認してください
- しばらく待ってから再実行してください

### npm install の権限エラーが発生した場合

グローバルインストールに管理者権限が必要な環境では `sudo` が必要な場合があります:

```bash
sudo npm install -g @mspec/cli@latest
```

あるいは、npm のグローバルディレクトリを権限不要の場所に変更することを検討してください（[npm ドキュメント参照](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)）。

### npm install が失敗した場合

アップグレード中に npm 自体がエラーを出力して失敗することがあります（例: ネットワーク中断、キャッシュ破損など）。その場合は npm のエラーメッセージを確認した上で、手動でアップグレードを実行してください:

```bash
npm install -g @mspec/cli@latest
```

### 非インタラクティブ環境でアップグレードがキャンセルされる場合

TTY（端末）が利用できない環境（CI、スクリプト、パイプ経由など）では、確認プロンプトに対して空の応答が返されるためアップグレードがキャンセルされます。このような環境では `--yes` フラグを使用してください:

```bash
mspec upgrade --yes
```
