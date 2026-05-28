---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: multi-test-runner-support

## Summary

`packages/cli/src/types/config.ts` に `RunnerSchema` を追加して `TestConfigSchema` を拡張し、
`packages/cli/src/commands/test.ts` の `runTestEvidence` を複数ランナーの逐次実行に対応するよう改修する。
変更ファイルは 2 つのみ。`enforce.ts` や証跡ファイル命名規則（FR-008）への変更は不要。

## Technical Context

- 現行 `runTestEvidence`（test.ts:24-75）は `cfg.test?.command` を単一文字列として `runShell` に渡す。
- `TestConfigSchema`（types/config.ts:7-23）は Zod で定義された型安全スキーマ。
- 証跡ファイルパスは `.mspec/cache/{red,green}-evidence/<change>__<task-id>.json`（FR-008 確定済み）。
- `enforce.ts:51-71` の `checkEnforceTdd` はファイル名のみを検査するためランナー数に依存しない。

## Project Structure

```
packages/cli/src/
  types/
    config.ts          # RunnerSchema 追加、TestConfigSchema に runners フィールド追加
  commands/
    test.ts            # runTestEvidence 改修、resolveRunners 追加、copyTestResults 更新
```

## Decisions

### Decision 1: RunnerSchema の型定義

`types/config.ts` に追加する Zod スキーマ:

```typescript
export const RunnerSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  cwd: z.string().optional(),
  expect_red_on_exit: z.array(z.number().int()).optional(),   // 省略時は親 test.expect_red_on_exit を使用
  expect_green_on_exit: z.array(z.number().int()).optional(), // 省略時は親 test.expect_green_on_exit を使用
  results_src: z.string().optional(),
});

// TestConfigSchema に追加するフィールド:
runners: z.array(RunnerSchema).optional(),
```

個別ランナーの `expect_*` が省略された場合は、トップレベルの `test.expect_red_on_exit` / `test.expect_green_on_exit` をデフォルト値として使用する。

受け入れ基準（FR-010 Scenario 対応）:
- GIVEN `test.runners` に 2 要素の配列が定義されている
- WHEN `mspec test --expect-green T001` を実行する
- THEN 各要素が独立したランナー定義として認識される

### Decision 2: resolveRunners() による実行モード切り替え

`runTestEvidence` の冒頭に `resolveRunners(cfg)` を追加する。この関数が「使用するランナーの正規化済み配列」を返すことで、後続コードは single/multi の区別を意識しない:

```typescript
interface ResolvedRunner {
  name: string;
  command: string;
  cwd?: string;
  expectRedOnExit: number[];
  expectGreenOnExit: number[];
  resultsSrc?: string;
}

function resolveRunners(cfg: Config): ResolvedRunner[] {
  const test = cfg.test;
  if (test?.runners && test.runners.length > 0) {
    // multi-runner mode: runners 優先、command は無視
    return test.runners.map(r => ({
      name: r.name,
      command: r.command,
      cwd: r.cwd,
      expectRedOnExit: r.expect_red_on_exit ?? test.expect_red_on_exit ?? [1, 2],
      expectGreenOnExit: r.expect_green_on_exit ?? test.expect_green_on_exit ?? [0],
      resultsSrc: r.results_src,
    }));
  }
  // legacy single-runner mode: 既存の test.command を使用（FR-013）
  return [{
    name: '__default__',
    command: test?.command ?? '',
    expectRedOnExit: test?.expect_red_on_exit ?? [1, 2],
    expectGreenOnExit: test?.expect_green_on_exit ?? [0],
    resultsSrc: test?.results_src,
  }];
}
```

`runners: []`（空配列）は `runners.length > 0` チェックで legacy モードに落ちる（エラーにしない）。

受け入れ基準（FR-013 Scenario 対応）:
- GIVEN `test.runners` が存在しない `.mspec/config.yaml`
- WHEN `mspec test --expect-red T001` を実行する
- THEN legacy 単一コマンドモードで動作し警告が出ない

### Decision 3: fail-fast 実行ループとエラー出力

`runTestEvidence` の実行部分をランナーループに変更する:

```typescript
// runners が存在する場合は ensureTestCommand プロンプトをスキップする。
// legacy モード（runners.length === 0）の場合のみ ensureTestCommand を呼び出す。
const runners = resolveRunners(cfg);
if (runners.length === 1 && runners[0]!.name === '__default__') {
  runners[0]!.command = await ensureTestCommand(paths.configFile, runners[0]!.command);
}
const results: RunnerResult[] = [];

for (const runner of runners) {
  console.log(`${pc.gray(`[${runner.name}] $`)} ${runner.command}`);
  const exitCode = await runShell(runner.command, runner.cwd);
  console.log(`${pc.gray(`[${runner.name}] exit:`)} ${exitCode}`);

  const matchedRed = runner.expectRedOnExit.includes(exitCode);
  const matchedGreen = runner.expectGreenOnExit.includes(exitCode);
  const ok = (expect === 'red' && matchedRed) || (expect === 'green' && matchedGreen);

  results.push({ name: runner.name, command: runner.command, exit_code: exitCode, ok });

  if (!ok) {
    // fail-fast: 失敗ランナー名を stderr に出力して即時中断（FR-012）
    console.error(`${pc.red('✗')} runner "${runner.name}" failed with exit code ${exitCode}`);
    process.exitCode = 1;
    return; // 証跡を保存せず終了
  }

  if (runner.resultsSrc) {
    // ランナー名サブディレクトリにコピー（e2e-results/<runner-name>/<basename>）
    await copyTestResults(process.cwd(), runner.resultsSrc, change.dir, runner.name);
  }
}
// 全ランナー成功 → 証跡保存（FR-011）
```

受け入れ基準（FR-012 Scenario 対応）:
- GIVEN `runners` に backend・frontend の順で定義されている
- WHEN backend が失敗する
- THEN frontend は実行されず、`runner "backend" failed` を含むメッセージが stderr に出力される

### Decision 4: 証跡 JSON payload の拡張

モードによって証跡 payload を分岐させ、FR-013 の後方互換を完全に保証する:

**Legacy モード**（`runners` 未設定、`name === '__default__'`）: FR-009 の既存フィールドを**そのまま維持**する。
```typescript
// legacy mode: FR-009 完全互換
const evidence = {
  task_id: taskId,
  change: change.name,
  expect,
  command,                // string のまま（型変更なし）
  exit_code: exitCode,
  matched_red: matchedRed,     // 保持
  matched_green: matchedGreen, // 保持
  recorded_at: new Date().toISOString(),
  ok,
};
```

**Multi-runner モード**（`runners` 配列あり）: `command` を配列化し、`runners` フィールドを追加する。`matched_red`/`matched_green` はランナーごとの概念になるため省略する。
```typescript
// multi-runner mode: FR-011 準拠
const evidence = {
  task_id: taskId,
  change: change.name,
  expect,
  command: results.map(r => r.command),  // string[]
  exit_code: results[results.length - 1]?.exit_code ?? -1,
  runners: results.map(r => ({ name: r.name, exit_code: r.exit_code })),
  recorded_at: new Date().toISOString(),
  ok: true,
};
```

`enforce.ts` はファイル名のみを検査するため、payload の追加フィールドへの影響はない。

受け入れ基準（FR-011 Scenario 対応）:
- GIVEN 全ランナーが成功した
- WHEN 証跡ファイルを読み込む
- THEN `command` フィールドが配列、`runners` フィールドに全ランナーの name と exit_code が含まれる

### Decision 5: copyTestResults のランナー名サブディレクトリ対応

```typescript
async function copyTestResults(
  cwd: string,
  resultsSrc: string,
  changeDir: string,
  runnerName?: string,  // 追加: ランナー名（省略時は legacy モード）
): Promise<void> {
  const src = join(cwd, resultsSrc);
  // ...
  const destDir = runnerName && runnerName !== '__default__'
    ? join(changeDir, 'e2e-results', runnerName)   // e2e-results/<runner-name>/
    : join(changeDir, 'e2e-results');               // legacy: e2e-results/ （FR-013互換）
  // ...
}
```

### Decision 6: runShell への cwd オプション追加

```typescript
function runShell(command: string, cwd?: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, stdio: 'inherit', cwd });
    child.on('exit', (code) => resolve(code ?? -1));
    child.on('error', () => resolve(-1));
  });
}
```

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ cli-test-tdd のみを拡張。他 capability への影響なし | ✅ 変更ファイルは 2 つのみ。enforce.ts・archive 等は無変更 |
| II 決定論的マージ | ✅ runners は既存 TestConfigSchema への additive 追加 | ✅ Zod .optional() により既存スキーマと衝突しない |
| III 質問駆動の要件確定 | ✅ proposal・research 全フェーズで確定済み | ✅ runners/command 共存・results_src・cwd すべて決定済み |
| IV 双方向アンカー | ✅ FR-010〜FR-013 をカバー | ✅ Decision ごとに FR 番号と Scenario を対応付け |
| V 強制/拡張ステップ分離 | ✅ implement ステップへの影響は config スキーマ拡張のみ | ✅ enforce.ts 変更なし、TDD 証跡命名規則変更なし |
| VI Security by Default | ✅ ファイルシステム外へのアクセスなし | ✅ cwd は spawn オプションの内部利用のみ。コマンドインジェクションリスク変化なし |

### Complexity Tracking

None

## Self-Review

### Summary

設計は FR-010〜FR-013 を Decision-Scenario 対応で網羅しており、アーキテクチャ図も完備している。self-reviewer が 3 件の blocker を検出し、いずれも本 design.md 上で修正済み。主な修正点は (1) 架空関数 `resolveRunners_withEnsure` の除去、(2) legacy/multi-runner モードでの証跡 payload 型分岐の明示、(3) `RunnerSchema` への `.min(1)` 制約追加。

### Findings（修正済み）

- [blocker → 修正済] Decision 3 が未定義の `resolveRunners_withEnsure(paths, cfg)` を参照していた → `resolveRunners(cfg)` に修正し、`ensureTestCommand` のスキップ条件を明示した。
- [blocker → 修正済] `matched_red`/`matched_green` フィールドの扱いが未定義だった → legacy モードはこれらを保持（FR-013 完全互換）、multi-runner モードは省略すると Decision 4 に明記した。
- [blocker → 修正済] legacy モードの `command` 型（string vs string[]）が未定義だった → legacy モードは `string` のまま、multi-runner モードは `string[]` と Decision 4 に明記した。
- [warning → 修正済] `ensureTestCommand` が runners 存在時にも呼ばれていた → Decision 3 で legacy モード時のみ呼び出すよう明示した。
- [warning → 修正済] `RunnerSchema.name`・`command` に `.min(1)` が欠けていた → Decision 1 に追加済み。
- [warning] `RunnerSchema.name` 重複時の `copyTestResults` 上書き衝突 → 設計上の制限としてドキュメントに残す（tasks.md でテストケースを追加推奨）。
- [note] `__default__` を runner name に指定した場合の衝突リスク → 低リスクとして現状許容。

### Verdict

PASS WITH NOTES

<!-- LEARNING: design.md の Decision セクションでは FR 番号と Scenario を直接対応付けることで、checklist・tasks.md へのトレーサビリティが自動的に確保される | source: FR-010 | confidence: high -->
