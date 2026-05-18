---
doc_type: How-to
---

# Quickstart: @mspec/cli 0.1beta を使う

## Prerequisites

- Node.js 18 以上（`node --version` で確認）
- npm 8 以上（`npm --version` で確認）

---

## Setup

### オプション A: npx（インストール不要）

```bash
npx @mspec/cli@beta init
```

### オプション B: グローバルインストール

```bash
npm install -g @mspec/cli@beta
mspec --version   # 0.1.0 と表示されることを確認
```

---

## Try it（Golden Path）

### 1. プロジェクトを初期化する

```bash
cd your-project
mspec init
```

または npx の場合：

```bash
npx @mspec/cli@beta init
```

### 2. 新しい変更を始める

```bash
mspec new my-feature
```

`changes/<timestamp>-my-feature/readme.md` が生成されます。

### 3. ステータスを確認する

```bash
mspec status
```

---

## Verify

以下をすべて確認できれば成功わん！

```bash
# バージョン確認
mspec --version
# → 0.1.0

# ヘルプ表示
mspec --help
# → コマンド一覧が表示される

# init コマンドのヘルプ
mspec init --help
```

---

## Troubleshooting

### `command not found: mspec`

グローバルインストールのパスが通っていない可能性があります。

```bash
npm prefix -g   # グローバルインストール先を確認
export PATH="$(npm prefix -g)/bin:$PATH"
```

または npx を使うと PATH 設定なしで実行できます。

### `402 Payment Required` エラー（メンテナー向け）

スコープ付きパッケージ（`@mspec/cli`）の publish 時は `publishConfig.access: "public"` が `package.json` に必要です。

```json
"publishConfig": {
  "access": "public"
}
```

### `npx @mspec/cli` でコマンドが見つからない

ネットワーク環境によっては npm registry へのアクセスに時間がかかる場合があります。`--yes` フラグで確認プロンプトをスキップできます。

```bash
npx --yes @mspec/cli@beta init
```
