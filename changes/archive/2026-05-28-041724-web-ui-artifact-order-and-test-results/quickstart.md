---
doc_type: How-to
---

# Quickstart: web-ui-artifact-order-and-test-results

この変更で追加された3つの機能を素早く試すためのガイドです。

## Prerequisites

- mspec CLI がインストール済みであること
- Web UI サーバーが起動済みであること（`http://localhost:5173` でアクセス可能）
- チェンジに Playwright E2E テストが設定済みであること
- テスト名に `[FR-NNN]` プレフィックスが付いていること（例: `[FR-007] shows test results from agent JSON`）

## Setup

Web UI サーバーが起動していない場合は起動します:

```bash
mspec server start
```

## Try it: Golden Path

### 1. E2E テストを実行する

チェンジの E2E テストを実行し、Playwright の結果ファイルを生成します。Playwright の JSON レポーターは `PLAYWRIGHT_JSON_OUTPUT_NAME` 環境変数でファイルパスを指定します:

```bash
# JSON レポーターで e2e-results/results.json を出力する
PLAYWRIGHT_JSON_OUTPUT_NAME=changes/<change-id>/e2e-results/results.json \
  npx playwright test --reporter=json
```

または `playwright.config.ts` に以下を設定している場合はそのまま実行できます:

```bash
npx playwright test
```

いずれかの方法で `changes/<change-id>/e2e-results/results.json` が生成されます。

### 2. テストリザルトを変換する

新しい CLI コマンドで Playwright の結果を `test-results.json` 形式に変換します:

```bash
mspec test-results convert --change <change-id>
```

例:
```bash
mspec test-results convert --change 2026-05-28-041724-web-ui-artifact-order-and-test-results
```

これにより `changes/<change-id>/test-results.json` が生成されます。テスト名の `[FR-007]` のような FR 番号が自動的に `checklist_item_ids` として抽出されます。

### 3. Web UI でアーティファクト一覧を確認する

ブラウザでチェンジ詳細画面を開きます:

```
http://localhost:5173/changes/<change-id>
```

アーティファクトが **ワークフロー順**（readme.md → proposal.md → specs/ → research.md → design.md → quickstart.md → checklist.md → tasks.md）に並んで表示されることを確認します。

### 4. テストリザルトをチェックリスト紐づきで確認する

チェンジ詳細画面から「Test Results」をクリックします（または直接アクセス）:

```
http://localhost:5173/changes/<change-id>/test-results
```

各テストケースに以下が表示されます:
- 🟢 / 🔴 / ⬜ のステータスバッジ（green / red / skip）
- テストが紐づくチェックリスト項目の FR 番号バッジ（例: `FR-007` `FR-008`）
- 紐づきが壊れている場合は「チェックリスト項目：未解決」警告バッジ

## Verify

以下を確認してください:

- [ ] チェンジ詳細画面でアーティファクトがワークフロー順に並んでいる（readme.md が最上部）
- [ ] `test-results.json` が `changes/<change-id>/` に生成されている
- [ ] テストリザルト画面に FR 番号バッジが表示されている
- [ ] テスト名に `[FR-NNN]` が含まれるテストでチェックリスト項目が正しく紐づいている
- [ ] stack_trace に絶対パスが表示されず `[path]` にマスクされている

## Troubleshooting

### test-results.json が生成されない

`e2e-results/results.json` が存在するか確認してください:

```bash
ls changes/<change-id>/e2e-results/
```

Playwright の JSON レポーターが有効になっていない場合、`playwright.config.ts` に以下を追加してください:

```typescript
reporter: [['json', { outputFile: 'results.json' }]]
```

### FR 番号バッジが表示されない

テスト名に `[FR-NNN]` プレフィックスが含まれているか確認してください。正しい形式:

```
[FR-007] shows test results from agent JSON  ✅
shows test results from agent JSON           ❌ (プレフィックスなし)
```

### 「チェックリスト項目：未解決」警告が意図せず表示される

`checklist.md` に対応する `<!-- verify: fr-NNN -->` コメントが存在するか確認してください。
FR 番号の大文字/小文字の違いにより紐づきが失敗することがあります（`FR-007` ではなく `fr-007` を使用）。
