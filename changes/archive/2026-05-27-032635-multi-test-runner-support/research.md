---
doc_type: Reference
---

# Research: multi-test-runner-support

## Decisions

| 質問 | 決定 | 根拠 |
|------|------|------|
| 証跡ファイルの形状 | 単一 JSON ファイル + payload 拡張（`command` を文字列配列化、`runners[]` フィールド追加） | Delta Spec FR-011 の設計方針。ファイル命名規則（FR-008 依存）を壊さないための決定 |
| 実行順序 | 逐次（宣言順） | proposal.md Non-Goals に「並列実行は今回スコープ外」と明記 |
| 失敗時の挙動 | fail-fast（最初の失敗で後続ランナーを中断） | FR-012 で確定 |
| 後方互換 | `runners` 未指定時は既存 `test.command` フォールバック | FR-013 で確定 |
| `runners` と `command` の共存 | `runners` を優先し `command` は無視する | ユーザー決定。シンプルな優先ルールで実装コストを抑える |
| `results_src` のコピー先 | ランナー名サブディレクトリ（`e2e-results/<runner-name>/<basename>`） | ユーザー決定。各ランナーの結果を分離して管理できる |
| `cwd` フィールド | 各ランナーにオプションフィールドとして含める | ユーザー決定。`pnpm --dir` 等の inline 指定が不要になりコマンドがシンプルになる |
| `enforce_tdd` との互換 | 変更不要 | `checkEnforceTdd`（enforce.ts:51-71）はファイル名のみ確認するためランナー数に依存しない |
| Zod スキーマ拡張方式 | `TestConfigSchema` に `runners: z.array(RunnerSchema).optional()` を追記 | Zod `.optional()` は additive で後方互換 |

## Web References

| URL | 要点 |
|-----|------|
| [Jest — Configuring Jest: projects](https://jestjs.io/docs/configuration#projects-arraystring--projectconfig) | `projects` 配列に `displayName` を持つ設定オブジェクトを並べるパターンが、`runners[].name` の命名フィールド設計の直接的な先行事例 |
| [Cargo Book — cargo-test](https://doc.rust-lang.org/cargo/commands/cargo-test.html) | Cargo は複数テストバイナリを逐次実行するのがデフォルト。ランナーをまたいだ逐次実行が正規のパターンである根拠 |
| [Zod — Defining schemas: optional](https://zod.dev/api) | `z.array(...).optional()` でフィールド追加が後方互換になることを公式ドキュメントが保証 |
| [Node.js — child_process docs](https://nodejs.org/api/child_process.html) | `spawn` の `exit` / `close` イベント仕様。現行 `runShell` の実装をそのまま各ランナーのループ内で再利用可能 |

## Codebase Findings

### cli-test-tdd 現状分析

- `packages/cli/src/commands/test.ts:24-75` — `runTestEvidence` が単一コマンドを実行して証跡を書く現行実装。`runners` 対応では、この関数をランナー配列のループに分解する必要がある。証跡書き込みはループ完走後のみに移動する。
- `packages/cli/src/commands/test.ts:31` — `cfg.test?.command ?? ''` でコマンドを取得している。`runners` 優先の分岐はこの行の前に挿入する形が自然。
- `packages/cli/src/commands/test.ts:77-91` — `ensureTestCommand` が `command` フィールドの空チェックと対話プロンプトを担う。`runners[]` が存在する場合のロジックを別パスで扱う必要がある。
- `packages/cli/src/commands/test.ts:110-122` — `copyTestResults` が `results_src` を `<changeDir>/e2e-results/<basename>` にコピーする。ランナーごとに `results_src` を持たせると、コピー先を `e2e-results/<runner-name>/<basename>` に変更する必要がある（決定済み）。
- `packages/cli/src/types/config.ts:7-23` — `TestConfigSchema` が変更対象。ここに `RunnerSchema` と `runners` フィールドを追加する。
- `packages/cli/src/lib/enforce.ts:51-71` — `checkEnforceTdd` は `<change>__<task-id>.json` ファイルの存在のみを検証するため、ランナー数に無関係。証跡ファイル名規則を変えない限り、このファイルへの変更は不要。

### .mspec/config.yaml 現状スキーマ

```yaml
test:
  command: "pnpm --dir ... exec playwright test tests/e2e/"
  expect_red_on_exit: [1, 2]
  expect_green_on_exit: [0]
  results_src: "packages/web-ui/test-results/results.json"
```

`runners` キーなし。FR-013 の後方互換フォールバックが正しく機能すれば、このファイルはそのまま動作し続ける。これがマルチランナー導入後の後方互換確認の実地テストケースになる。

### 提案スキーマ（更新版）

```yaml
# .mspec/config.yaml — 拡張後のイメージ（全決定事項反映）
test:
  # legacy フォールバック（runners 未指定時のみ有効）
  command: "npm test"
  expect_red_on_exit: [1, 2]
  expect_green_on_exit: [0]

  runners:
    - name: backend
      command: "pytest -x"
      cwd: "packages/backend"          # 新フィールド（オプション）
      expect_red_on_exit: [1, 2]
      expect_green_on_exit: [0]
    - name: frontend
      command: "playwright test"
      cwd: "packages/web-ui"           # cwd でコマンドをシンプルに
      expect_red_on_exit: [1, 2]
      expect_green_on_exit: [0]
      results_src: "test-results/results.json"  # コピー先: e2e-results/frontend/results.json
```

## Open Choices

- [x] **`runners` と `command` の共存**: `runners` を優先し `command` は無視する → **決定済み**
- [x] **`results_src` のコピー先**: `e2e-results/<runner-name>/<basename>` のサブディレクトリ形式 → **決定済み**
- [x] **`cwd` フィールドのスコープ**: 今回含める → **決定済み**
- [ ] **`runners: []`（空配列）の扱い**: `runners` キーが存在するが空配列の場合、エラーにするか `command` フォールバックに落とすかが未定。design ステップで決定。
- [ ] **`mspec init` での複数ランナー設定**: 対話で複数ランナーを設定できるようにするか、手動編集のみとするか。design ステップで決定。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | ✅ research は読み取り＋Web 検索のみ。コードを変更しない | — |
| II 決定論的マージ | ✅ 設計判断はすべて Decisions テーブルに記録済み | — |
| III 質問駆動の要件確定 | ✅ Open Choices 3 問についてユーザーに確認済み | — |
| IV 双方向アンカー | ✅ proposal.md・Delta Spec の FR 番号を参照している | — |
| V 強制/拡張ステップ分離 | ✅ research は拡張ステップ。強制ステップ（implement）に干渉しない | — |
| VI Security by Default | ✅ ファイルシステム外へのアクセスなし | — |
