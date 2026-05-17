---
doc_type: Tutorial
---

# Quickstart: fix-special-step-produces

## Prerequisites

- Node.js 18 以上
- mspec CLI ビルド済み（`packages/cli/dist/index.js` が存在すること）
- アクティブな change ディレクトリが存在すること（例: `changes/2026-05-14-XXXXXX-my-feature/`）

## Setup

```bash
# プロジェクトルートに移動
cd /path/to/your/mspec-project

# CLI をビルド（未ビルドの場合）
cd packages/cli && npm run build && cd ../..
```

## Try it — Golden Path

### 1. produces レスステップ（implement）を done にマークする

```bash
# implement ステップを完了としてマーク
mspec done implement --change 2026-05-14-XXXXXX-my-feature
```

実行後、`.mspec/cache/done-log.json` にエントリが追記される：

```json
{
  "2026-05-14-XXXXXX-my-feature": {
    "implement": {
      "done_at": "2026-05-14T13:19:06.000Z"
    }
  }
}
```

### 2. ステータスを確認する

```bash
mspec status --change 2026-05-14-XXXXXX-my-feature
```

期待出力：

```
implement   done    ✓
archive     ready
```

### 3. archive ステップを done にマークする

```bash
mspec done archive --change 2026-05-14-XXXXXX-my-feature
```

### 4. produces を持つステップへの誤用を確認する（ガード動作）

```bash
# proposal は produces: [proposal.md] を持つため拒否される
mspec done proposal --change 2026-05-14-XXXXXX-my-feature
# → Error: mspec done は produces が空のステップにのみ使用できます
```

## Verify

```bash
# done-log.json の内容を確認
cat .mspec/cache/done-log.json

# ステータスで done が正しく反映されているか確認
mspec status --change 2026-05-14-XXXXXX-my-feature --json | grep -A3 '"implement"'
# → "state": "done"
```

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `step "implement" is not found` | `--change` で指定した change 名が間違っている | `mspec status` でアクティブな change 名を確認 |
| `mspec done は produces が空のステップにのみ使用できます` | produces を持つステップに誤って実行した | `mspec done` は `implement`・`archive`・`self-review` 専用 |
| `implement` が `done` にならない | `mspec validate` でアンカー/E2E/TDD 証跡の不足 | `mspec validate` のエラーメッセージを確認して不足を解消 |
| `done-log.json` が存在しない | 初回実行前 | 正常。`mspec done` 実行時に自動生成される |
| `mspec done` が `mspec skip` と混同される | 設計上の懸念 | `done` = 作業完了、`skip` = 意図的省略。目的が異なる |
