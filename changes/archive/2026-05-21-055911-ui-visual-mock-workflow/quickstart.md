---
doc_type: Tutorial
---

# Quickstart: ui-visual-mock-workflow

このガイドでは `mspec mock` コマンドと `visual-mock` ワークフローステップの使い方を説明します。

---

## Prerequisites

- Node.js 18 以上
- `mspec` CLI がインストール済み（`mspec --version` で確認）
- mspec change が作成済みで `proposal.md` が存在すること

---

## Setup

1. プロジェクトルートに移動する

```bash
cd /path/to/your/project
```

2. アクティブな change を確認する

```bash
mspec status
```

`proposal.md` が `done` になっていれば `visual-mock` ステップが実行可能です。

---

## Try it (Golden Path)

### パターン A: ワークフロー経由（推奨）

proposal ステップ完了後、`mspec continue` を実行すると `visual-mock` ステップに到達します。

```bash
mspec continue
```

Claude Code が自動的に `mspec-visual-mock` スキルを呼び出して以下を実行します：

1. `proposal.md` と `package.json` からプロジェクト情報を読み取る
2. CSS フレームワーク（Tailwind / MUI / Bootstrap など）を自動検出
3. `changes/<change>/mock/index.html` に HTML モックを生成
4. ローカルサーバーを起動（デフォルト: `http://localhost:3737`）

ブラウザで確認後、ターミナルでフィードバックを入力して **Enter** → **空行** で確定します。

```
フィードバックを入力してください（空行で完了）:
> ログインボタンを右上に移動してほしい
> カラーテーマをダークモードにしたい
>
```

フィードバックは `changes/<change>/mock-feedback.md` に保存されます。

---

### パターン B: 直接実行

```bash
mspec mock --change <change-dir>
```

ポートを指定する場合:

```bash
mspec mock --change <change-dir> --port 8080
```

`--change` を省略するとアクティブな change を自動解決します:

```bash
mspec mock
```

---

### visual-mock をスキップする場合

ビジュアルモックが不要な場合はスキップできます:

```bash
mspec skip visual-mock --reason "シンプルなバグ修正のため不要"
```

スキップ後は次のステップ（`delta`）に自動で進みます。

---

## Verify

以下を確認してください：

- [ ] `changes/<change>/mock/index.html` が生成されている
- [ ] `http://localhost:3737`（または指定ポート）でモックページが表示される
- [ ] フィードバック入力後に `mock-feedback.md` が生成されている
- [ ] （`delta` 完了後）`mspec tasks` 実行時にフィードバックの内容が `tasks.md` に反映されている

```bash
# mock-feedback.md の確認
cat changes/<change>/mock-feedback.md

# ステータス確認
mspec status --change <change>
```

---

## Troubleshooting

### ポートが既に使用中

`3737` 番ポートが占有されている場合、`mspec mock` は自動的に `3738`、`3739`… と空きポートを探します。  
それでも失敗する場合は明示的に指定してください：

```bash
mspec mock --port 9000
```

### `no active change found` エラー

`--change` を省略した場合にアクティブな change が検出できないときに発生します。

```bash
# 利用可能な change 一覧を確認
mspec list

# 明示的に指定して実行
mspec mock --change <change-dir>
```

### HTML モックが空白または崩れている

`proposal.md` の `## Goals` セクションが具体的でない場合、生成品質が低下することがあります。  
Goals に UI の画面構成・主要機能を箇条書きで記載してから再実行してください：

```bash
mspec mock --change <change-dir>
```

### `mock-feedback.md` が上書きされてしまった

2 回目の `mspec mock` 実行で前回のフィードバックが上書きされます。  
保存が必要な場合は事前に別ファイルへコピーしてください。
