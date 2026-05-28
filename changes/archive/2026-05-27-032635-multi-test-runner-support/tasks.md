---
doc_type: How-to
---

# Tasks: multi-test-runner-support

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I ステップ独立性 | ✅ cli-test-tdd のみを拡張。enforce.ts・他 capability への変更なし |
| II 決定論的マージ | ✅ TestConfigSchema への additive 追加のみ |
| III 質問駆動の要件確定 | ✅ proposal〜research で全設計判断が確定済み |
| IV 双方向アンカー | ✅ 全実装タスクに anchor ブロックを付与 |
| V 強制/拡張ステップ分離 | ✅ enforce.ts 変更なし、証跡命名規則変更なし |
| VI Security by Default | ✅ cwd は spawn オプションの内部利用のみ |

<!-- @mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md -->
<!-- Requirements implemented: FR-010, FR-011, FR-012, FR-013 -->
<!-- Change: multi-test-runner-support -->

---

## Phase 1 — Setup: スキーマ拡張

### ~~T001~~ ✅ — [E2E] `RunnerSchema` バリデーションのユニットテスト

<!-- verify: fr-010 -->

`packages/cli/src/types/config.ts` に追加する `RunnerSchema` が以下を正しく検証することをテストする:
- `name: ""` → バリデーションエラー（`.min(1)` 制約）
- `command: ""` → バリデーションエラー（`.min(1)` 制約）
- `cwd`・`expect_red_on_exit`・`results_src` が省略可能であること
- 有効な runners 配列が `TestConfigSchema.runners` で受け入れられること

```anchor
@mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
Requirements implemented: FR-010
Change: multi-test-runner-support
```

### ~~T002~~ ✅ — [Impl] `RunnerSchema` 追加と `TestConfigSchema` 拡張

`packages/cli/src/types/config.ts`:
- `RunnerSchema` を定義（`name: z.string().min(1)`, `command: z.string().min(1)`, `cwd?: z.string()`, `expect_red_on_exit?: z.array(z.number().int())`, `expect_green_on_exit?: z.array(z.number().int())`, `results_src?: z.string()`）
- `TestConfigSchema` に `runners: z.array(RunnerSchema).optional()` を追加

```anchor
@mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
Requirements implemented: FR-010
Change: multi-test-runner-support
```

---

## Phase 2 — Foundational: 実行基盤

### T003 — [E2E] legacy フォールバック動作テスト（FR-013 + regression）

`test.runners` が未設定の場合、`mspec test --expect-red/--expect-green` が既存の FR-001〜FR-004 と同一の動作を示すことをテストする:
- `test.command` のみが設定されている config で `--expect-red` を実行 → red 証跡が保存される
- `test.command` のみが設定されている config で `--expect-green` を実行 → green 証跡が保存される
- 証跡 JSON に `matched_red`・`matched_green`・`command: string` フィールドが存在する（legacy payload 形式）
- `runners: []` 空配列の場合も legacy モードにフォールバックする

```anchor
@mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
Requirements implemented: FR-013
Change: multi-test-runner-support
```

### T004 — [Impl] `resolveRunners(cfg)` 実装 + `runShell` への `cwd` 追加

`packages/cli/src/commands/test.ts`:
- `resolveRunners(cfg: Config): ResolvedRunner[]` を実装
  - `cfg.test?.runners` が存在し length > 0 → multi-runner モード（各ランナーの `expect_*` が省略時は `test.expect_red_on_exit` / `test.expect_green_on_exit` をデフォルト使用）
  - それ以外 → legacy モード（`name: '__default__'`、`test.command` を使用）
- `runShell(command: string, cwd?: string): Promise<number>` の `cwd` オプションを追加
- `runTestEvidence` の冒頭: `resolveRunners(cfg)` を呼び出し、legacy モードの場合のみ `ensureTestCommand` を呼ぶ

```anchor
@mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
Requirements implemented: FR-013
Change: multi-test-runner-support
```

---

## Phase 3 — User Story: マルチランナー主機能

### T005 — [E2E] 全ランナー逐次実行と証跡保存テスト（FR-011）

<!-- verify: fr-011 -->

2 つのランナーを持つ config で以下を検証するテストを書く:
- 両ランナーが宣言順に実行されること（ログ順序で確認）
- 全ランナー成功時のみ `green-evidence/<change>__<task-id>.json` が保存される
- 証跡 JSON に `command: string[]`（全コマンドの配列）・`runners: [{name, exit_code}]` が含まれる
- `results_src` を持つランナーの結果ファイルが `e2e-results/<runner-name>/<basename>` にコピーされる

```anchor
@mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
Requirements implemented: FR-011
Change: multi-test-runner-support
```

### T006 — [Impl] `runTestEvidence` マルチランナーループ改修 + `copyTestResults` 更新

`packages/cli/src/commands/test.ts`:
- `runTestEvidence` をランナーループに改修（`resolveRunners(cfg)` で取得した配列を逐次実行）
- 全ランナー成功後に multi-runner 形式の証跡 JSON を保存（`command: string[]`, `runners: [...]`）
- legacy モードでは従来の証跡 JSON（`command: string`, `matched_red`, `matched_green` 付き）を保存
- `copyTestResults(cwd, resultsSrc, changeDir, runnerName?)` を更新:
  - `runnerName` が `'__default__'` 以外 → `e2e-results/<runnerName>/<basename>`
  - legacy → `e2e-results/<basename>`（既存パス）

```anchor
@mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
Requirements implemented: FR-011
Change: multi-test-runner-support
```

### T007 — [E2E] fail-fast と失敗ランナー名エラー出力テスト（FR-012）

<!-- verify: fr-012 -->

先行ランナーが失敗するシナリオで以下を検証するテストを書く:
- 先行ランナー失敗時に後続ランナーが実行されないこと
- stderr に `runner "<name>" failed with exit code <N>` を含むメッセージが出力されること
- 証跡ファイルが生成されないこと
- プロセスの終了コードが非ゼロであること

```anchor
@mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
Requirements implemented: FR-012
Change: multi-test-runner-support
```

### T008 — [Impl] fail-fast ロジック実装

`packages/cli/src/commands/test.ts` のランナーループ内:
- いずれかのランナーが期待外の終了コードを返した場合、`process.exitCode = 1` を設定
- stderr に失敗ランナー名を含むメッセージを出力（`console.error`）
- 証跡を保存せずに即時 `return`
- 後続ランナーを実行しない

```anchor
@mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
Requirements implemented: FR-012
Change: multi-test-runner-support
```

---

## Phase 4 — Polish: 後方互換とエッジケース確認

### T009 — [E2E] FR-002・FR-004 regression テスト（legacy モード reject ロジック）

legacy モードで、期待外の終了コードが観測された場合の reject 動作が FR-002・FR-004 と同一であることを確認:
- `--expect-red` 実行時に `expect_green_on_exit` の終了コード → 非ゼロ終了・証跡未保存
- `--expect-green` 実行時に `expect_red_on_exit` の終了コード → 非ゼロ終了・証跡未保存

```anchor
@mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
Requirements implemented: FR-013
Change: multi-test-runner-support
```

### T010 — [E2E] ドッグフーディング確認（mspec プロジェクト本体）

`.mspec/config.yaml` を以下の multi-runner 設定に更新して `mspec test --expect-green` が両ランナーで機能することを手動確認:

```yaml
test:
  runners:
    - name: cli-unit
      command: "pnpm test"
      cwd: "packages/cli"
      expect_red_on_exit: [1, 2]
      expect_green_on_exit: [0]
    - name: web-ui-e2e
      command: "pnpm exec playwright test tests/e2e/"
      cwd: "packages/web-ui"
      expect_red_on_exit: [1, 2]
      expect_green_on_exit: [0]
      results_src: "test-results/results.json"
```

確認後は元の設定に戻すか、この設定を本採用として維持する。

<!-- LEARNING: tasks.md の Phase 4 にドッグフーディングタスクを含めることで、実装の実地検証を構造化できる | source: FR-013 | confidence: medium -->
