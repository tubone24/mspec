---
doc_type: Tutorial
---

# Quickstart: fix-archive-record-done

このガイドでは、`archive.ts` に `recordDone` 呼び出しを追加した修正が正しく動作することを確認する手順を示す。

## Prerequisites

- Node.js >= 18
- リポジトリのルートに `.mspec/workflow.yaml` が存在すること
- `npm run build`（または `tsup`）でビルド済みであること

## Setup

```bash
# プロジェクトルートに移動
cd /path/to/mspec

# ビルド（変更を反映）
cd packages/cli && npm run build && cd ../..
```

## Try it (Golden Path)

### 1. テスト用の change を用意する

```bash
node packages/cli/dist/index.js new test-archive-fix
# 生成された変更名を控えておく（例: 2026-05-16-000000-test-archive-fix）
```

必要な成果物を最低限用意して archive できる状態にする（または既存の完成済み change を使用する）。

### 2. `mspec archive` を実行する

```bash
node packages/cli/dist/index.js archive 2026-05-16-000000-test-archive-fix --yes
```

期待される出力例：
```
[archive] 2026-05-16-000000-test-archive-fix
  Capability: cli-core
    + ADDED:    1
    ...
  Moved: changes/2026-05-16-000000-test-archive-fix → changes/archive/2026-05-16-000000-test-archive-fix
```

### 3. done-log に記録されたことを確認する

```bash
cat .mspec/cache/done-log.json
```

期待される内容（修正後）：
```json
{
  "2026-05-16-000000-test-archive-fix": {
    "archive": {
      "done_at": "2026-05-16T..."
    }
  }
}
```

### 4. `mspec continue` が正しく応答することを確認する

```bash
node packages/cli/dist/index.js continue --change 2026-05-16-000000-test-archive-fix --json
```

期待される出力（修正後）：
```json
{
  "next_action": "complete"
}
```

修正前（バグあり）は `"next_action": "execute"` が返り続けていた。

## Verify

```bash
# 単体テストを実行して全ケースが green であることを確認
cd packages/cli && npm test -- archive
```

期待される出力：
```
✓ archiveCommand > records done-log after successful archive
```

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `done-log.json` に `archive` キーがない | ビルドが古い（修正前のコードが実行されている） | `npm run build` を再実行する |
| `next_action` が `"execute"` のまま | `done-log.json` が存在しないか書き込み権限なし | `.mspec/cache/` ディレクトリの権限を確認する |
| `recordDone` がエラーをスロー | `.mspec/cache/` ディレクトリが存在しない | `mkdir -p .mspec/cache` を実行してから再試行する |
