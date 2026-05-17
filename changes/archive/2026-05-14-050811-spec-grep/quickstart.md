# Quickstart: spec grep/list サブコマンド

## Prerequisites

- mspec CLI が使用可能な状態（`node packages/cli/dist/index.js --version` で確認）
- `specs/` 配下に 1 つ以上の capability ディレクトリ（`spec.md` を含む）が存在する mspec プロジェクト

## Setup

この変更のビルドが必要な場合（実装完了後）：

```sh
cd packages/cli
npm run build
```

ローカルで `mspec` コマンドとして実行するには：

```sh
alias mspec="node /path/to/packages/cli/dist/index.js"
```

または `packages/cli/` 直下から：

```sh
node dist/index.js spec --help
```

## Try it (Golden Path)

### capability 一覧を確認する

```sh
mspec spec list-capabilities
```

出力例：
```
cli-delta
cli-spec-lint
workflow-core
```

機械読み取り可能な JSON で取得：

```sh
mspec spec list-capabilities --json
```

```json
{
  "command": "list-capabilities",
  "results": [
    { "capability": "cli-delta" },
    { "capability": "cli-spec-lint" },
    { "capability": "workflow-core" }
  ],
  "meta": { "specsDir": "specs/", "count": 3 }
}
```

### 全 Requirement を capability ごとに一覧表示する

```sh
mspec spec list-requirements
```

出力例：
```
## cli-spec-lint
  FR-001  3 カテゴリ分類の禁止語彙リンタ
  FR-002  安定したルール識別子と修正ヒント
  ...

## workflow-core
  FR-001  ...
```

特定の capability だけに絞る（glob 指定）：

```sh
mspec spec list-requirements "cli-*"
```

JSON 出力で AI エージェントに渡す：

```sh
mspec spec list-requirements --json
```

### FR-ID でブロックを検索する

```sh
mspec spec grep FR-011
```

出力例（SoT + Delta Spec 両方を検索）：
```
## changes/2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md

### Requirement: FR-011 — `mspec spec list-requirements` コマンド
システムは `mspec spec list-requirements [glob]` サブコマンドを提供し...
```

`--json` フラグで構造化出力：

```sh
mspec spec grep FR-011 --json
```

```json
{
  "command": "spec-grep",
  "results": [
    {
      "fr_id": "FR-011",
      "file": "changes/2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md",
      "block": "### Requirement: FR-011 — ..."
    }
  ],
  "meta": { "query": "FR-011", "count": 1 }
}
```

## Verify

以下を確認することで各コマンドが正しく動作していることを検証できる：

```sh
# 1. list-capabilities が spec.md 存在 capability のみ返す
mspec spec list-capabilities --json | node -e \
  "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
   if (!Array.isArray(d.results)) { console.error('FAIL: results は配列でなければならない'); process.exit(1); } \
   console.log('✓ list-capabilities OK:', d.meta.count, 'capabilities')"

# 2. list-requirements が fr_id・capability・title を持つ配列を返す
mspec spec list-requirements --json | node -e \
  "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
   const r=d.results[0]; \
   if (!r || !r.fr_id || !r.capability || !r.title) { console.error('FAIL: results 要素に必須フィールドがない'); process.exit(1); } \
   console.log('✓ list-requirements OK:', d.meta.count, 'requirements')"

# 3. spec grep が存在する FR-ID を見つける
mspec spec grep FR-001 --json | node -e \
  "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
   if (d.results.length === 0) { console.error('FAIL: FR-001 が見つからない'); process.exit(1); } \
   console.log('✓ spec grep OK: found', d.meta.count, 'result(s)')"

# 4a. 不正な形式の ID（INVALID-ID）は exit 1 になる
mspec spec grep INVALID-ID; echo "exit: $?  （期待値: 1 — 不正フォーマット）"

# 4b. 有効な形式だが存在しない FR-ID（FR-999）は exit 0 で空結果を返す
mspec spec grep FR-999 --json | node -e \
  "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
   if (d.results.length !== 0) { console.error('FAIL: 存在しない FR-999 が結果を返した'); process.exit(1); } \
   console.log('✓ spec grep no-match OK: exit 0, results:', d.results.length)"
```

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `command not found: mspec` | CLI が PATH にない | `node packages/cli/dist/index.js` で直接実行 / alias を設定 |
| `mspec spec grep FR-001` が 0 件を返す | `specs/` に `spec.md` が存在しないか FR-001 が SoT にも Delta にもない | `mspec spec list-capabilities` で capability を確認してから再実行 |
| `specs/ does not exist` エラー | `specs/` ディレクトリが存在しない | `mspec init` を実行して mspec プロジェクトを初期化 |
| `Invalid FR-ID format` エラー | `FR-NNN` 形式以外の引数を渡した | 正しい形式（例: `FR-011`）で再実行 |
| `--json` 出力が空の `results: []` | 該当する FR が存在しない | 正しい FR-ID を `mspec spec list-requirements --json` で確認してから再実行 |
