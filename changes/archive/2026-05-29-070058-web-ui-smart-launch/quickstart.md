---
doc_type: How-to
---

# Quickstart: web-ui-smart-launch

## Prerequisites

- Node.js >= 18.0.0（組み込み `fetch` と `crypto.randomUUID()` が必要）
- `mspec` CLI がインストール済みであること（`mspec --version` で確認）
- mspec プロジェクトルートに `.mspec/` ディレクトリが存在すること
- （Verify セクションのみ）`jq` がインストール済みであること。未インストールの場合は `python3 -m json.tool` で代替可能

## Setup

```bash
# mspec CLI をリポジトリからビルドする場合
cd packages/cli
npm install
npm run build

# グローバルリンクを更新
npm link
```

## Try it (Golden Path)

### 1. `mspec new` で Web UI が自動起動する

```bash
cd /path/to/your/mspec-project
mspec new my-feature
```

**期待される出力（抜粋）:**
```
✓ Created 2026-05-29-120000-my-feature
  Web UI started at http://localhost:3847
  next: run /mspec:proposal
```

→ ブラウザで `http://localhost:3847` を開き、Web UI が表示されることを確認する。

### 2. すでに起動中のとき再起動しない

```bash
# 同じプロジェクトで再度 mspec new を実行
mspec new another-feature
```

**期待される出力:**
```
✓ Created 2026-05-29-120001-another-feature
  Web UI already running at http://localhost:3847
  next: run /mspec:proposal
```

→ 新しいプロセスは起動せず、既存の URL が表示される。

### 3. `mspec open` で Web UI を起動してブラウザで開く

```bash
mspec open
```

**期待される出力:**
```
Web UI opened at http://localhost:3847
```

→ ブラウザが自動で `http://localhost:3847` を開く。

### 4. 別プロジェクトがポートを使用中のとき別ポートで起動する

```bash
# 別プロジェクトがすでに 3847 を使用中の状態で実行
mspec new cross-port-feature
```

**期待される出力:**
```
✓ Created 2026-05-29-120002-cross-port-feature
  Web UI started at http://localhost:3848
  next: run /mspec:proposal
```

→ 3847 が使用中のため 3848 で起動する。

## Verify

```bash
# ヘルスエンドポイントでプロジェクト同一性を確認
curl -s http://localhost:3847/__mspec/health | jq .
```

**期待されるレスポンス:**
```json
{
  "projectRoot": "/path/to/your/mspec-project",
  "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "port": 3847,
  "pid": 12345
}
```

```bash
# PID ファイルに JSON が書き込まれていることを確認
cat .mspec/ui.pid
```

**期待される内容:**
```json
{"pid":12345,"port":3847,"projectRoot":"/path/to/your/mspec-project","token":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}
```

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `候補ポートが全て使用中` エラーが出る | 3847〜3851 がすべて他プロセスに使われている | `lsof -i :3847-3851` で占有プロセスを確認して終了させる |
| URL にアクセスできないのに `Web UI already running` と表示される | 別プロジェクトが同じポートを先取りしており、トークン照合で不一致が検出されなかった | `.mspec/ui.pid` を削除してから再度 `mspec new` / `mspec open` を実行する（通常は自動回復する） |
| ブラウザが開かない（`mspec open`） | `open` / `xdg-open` / `start` コマンドが環境にない | 手動でターミナルに表示された URL をブラウザで開く |
| `/__mspec/health` が 404 を返す | 旧バージョンのサーバーが起動している（ヘルスエンドポイント未実装） | `.mspec/ui.pid` を削除して `mspec open` でサーバーを再起動する |
| Web UI のポートが毎回変わる | `3847` を別プロジェクトが常時占有している | そのプロジェクトの Web UI を停止するか、mspec の設定でデフォルトポートを変更する |
