---
doc_type: How-to
---

# Quickstart: 複数テストランナーの設定

バックエンドとフロントエンドのように、異なるテストフレームワークを使うプロジェクトで mspec の TDD 証跡を両方に適用する方法を説明します。

## Prerequisites

- mspec CLI がインストール済み（`mspec --version` で確認）
- プロジェクトに `.mspec/config.yaml` が存在する（`mspec init` 実行済み）
- 各テストランナーのコマンドが単体で動作することを事前に確認しておく

## Setup: `.mspec/config.yaml` に runners を追加する

### Before（単一ランナー）

```yaml
test:
  command: "pnpm --dir packages/web-ui exec playwright test tests/e2e/"
  expect_red_on_exit: [1, 2]
  expect_green_on_exit: [0]
  results_src: "packages/web-ui/test-results/results.json"
```

### After（複数ランナー）

`test.command` の代わりに `test.runners` 配列を使います。各ランナーに `name`・`command`・`cwd` を設定します。

```yaml
test:
  runners:
    - name: cli-unit
      command: "pnpm test"
      cwd: "packages/cli"          # コマンドの作業ディレクトリ（省略時はプロジェクトルート）
      expect_red_on_exit: [1, 2]
      expect_green_on_exit: [0]

    - name: web-ui-e2e
      command: "pnpm exec playwright test tests/e2e/"
      cwd: "packages/web-ui"
      expect_red_on_exit: [1, 2]
      expect_green_on_exit: [0]
      results_src: "test-results/results.json"
      # 結果ファイルのコピー先: e2e-results/web-ui-e2e/results.json
```

> **ポイント**: `cwd` を使うと `pnpm --dir <絶対パス>` のような長いコマンドが不要になります。
>
> **後方互換**: `runners` がない場合は既存の `test.command` がそのまま動作します。移行は任意のタイミングで行えます。

## Try it: Golden Path

### 1. TDD レッドフェーズ（テストが失敗することを記録する）

```bash
mspec test --expect-red T001
```

実行すると `cli-unit` → `web-ui-e2e` の順に逐次実行されます。

```
[cli-unit] $ pnpm test
[cli-unit] exit: 1
[web-ui-e2e] $ pnpm exec playwright test tests/e2e/
[web-ui-e2e] exit: 1
✓ evidence saved: .mspec/cache/red-evidence/<change>__T001.json
```

**いずれかのランナーが想定外の結果（例: red フェーズなのに exit 0）だった場合**、そのランナー名を表示して中断します:

```
[cli-unit] $ pnpm test
[cli-unit] exit: 0
✗ runner "cli-unit" failed with exit code 0
```

### 2. 実装後のグリーンフェーズ（全ランナーが成功することを記録する）

```bash
mspec test --expect-green T001
```

**全ランナーが成功した場合のみ**証跡が保存されます:

```
[cli-unit] $ pnpm test
[cli-unit] exit: 0
[web-ui-e2e] $ pnpm exec playwright test tests/e2e/
[web-ui-e2e] exit: 0
  test results → e2e-results/web-ui-e2e/results.json
✓ evidence saved: .mspec/cache/green-evidence/<change>__T001.json
```

## Verify: 証跡の確認

証跡 JSON にはすべてのランナーの実行結果が記録されています:

```bash
cat .mspec/cache/green-evidence/<change>__T001.json
```

```json
{
  "task_id": "T001",
  "change": "2026-05-27-...",
  "expect": "green",
  "command": ["pnpm test", "pnpm exec playwright test tests/e2e/"],
  "exit_code": 0,
  "runners": [
    { "name": "cli-unit", "exit_code": 0 },
    { "name": "web-ui-e2e", "exit_code": 0 }
  ],
  "recorded_at": "2026-05-27T...",
  "ok": true
}
```

## Troubleshooting

| 症状 | 原因 | 対処法 |
|------|------|--------|
| `runner "X" failed with exit code N` | N 番のランナーが期待外の終了コードを返した | `command` を単体で実行して失敗原因を確認する |
| `test.command must be set` エラー | `runners` が空配列かつ `command` も未設定で、対話プロンプトを空 Enter で抜けた | 再実行してプロンプトでコマンドを入力するか、`runners` に 1 つ以上のランナーを追加する |
| `cwd` を指定したがコマンドが見つからない | 相対パスが間違っている | `cwd` はプロジェクトルートからの相対パス。`ls packages/cli` 等で確認する |
| 旧設定（`test.command`）で動かなくなった | `runners` と `command` が両方存在する | `runners` が優先されます。`command` キーを削除するか `runners` だけを残す |
