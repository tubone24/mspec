---
doc_type: Quickstart
---

# Quickstart: init-link-global-bin

## Prerequisites

- Node.js 18.0.0 以上
- mspec リポジトリをクローン済み（`git clone` でソースがローカルにある状態）
- `packages/cli/` ディレクトリが存在すること

## Setup

```bash
# mspec リポジトリのルートに移動
cd /path/to/mspec

# プロジェクトの依存関係をインストール（初回のみ）
cd packages/cli && npm install && cd ../..
```

## Try it（Golden Path）

```bash
# プロジェクトルート（または任意のディレクトリ）で mspec init を実行
mspec init
```

実行すると以下の順序で処理が行われるわん：

1. 設定ファイルが配置される（`.mspec/config.yaml`、`.claude/commands/` 等）
2. **dev-mode が自動検出される**（`packages/cli/package.json` の存在確認）
3. `npm run build` が実行される（ビルド出力がリアルタイム表示）
4. `npm link` が実行されてグローバルコマンドが登録される

```
mspec init (root=/your/project)
test.command (e.g. "npm test --", press Enter to skip): ↵
  + .mspec/config.yaml
  + .mspec/workflow.yaml
  + memory/constitution.md
  + .claude/commands/mspec/...
dev-mode: building and linking mspec globally...
  [tsup build output...]
  ✓ mspec linked globally
mspec init: done.
next: run /mspec:new <feature>
```

## Verify

```bash
# グローバルコマンドが登録されていることを確認
which mspec
# e.g., /opt/homebrew/bin/mspec (macOS Homebrew) または $(npm config get prefix)/bin/mspec (Linux)

# バージョンを確認
mspec --version
# => 0.1.0-alpha.1

# 新しいプロジェクトディレクトリでも mspec が使えることを確認
mkdir /tmp/test-mspec && cd /tmp/test-mspec
mspec --version  # ← パスを変えても使える
```

## Troubleshooting

### `warn: build failed` が表示される

TypeScript コンパイルエラーが発生している可能性があるわん。手動でビルドして原因を確認するわん：

```bash
cd /path/to/mspec/packages/cli
npm run build
```

エラーを修正後、再度 `mspec init` を実行するか、以下で手動リンクするわん：

```bash
npm link
```

### `warn: npm link failed` が表示される

権限エラーの場合は `/opt/homebrew` への書き込み権限を確認するわん：

```bash
ls -la /opt/homebrew/bin/mspec  # 現在のリンク状態確認
cd /path/to/mspec/packages/cli
npm link  # 手動で実行
```

### `mspec: command not found`（non-dev-mode の場合）

`npm install -g @mspec/cli` でインストールした場合はグローバルリンク機能は動作しないわん。グローバルインストールされた mspec コマンドをそのまま使用するわん。
