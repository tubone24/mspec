---
doc_type: Explanation
---

# Research: fix-special-step-produces

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| done-log のストレージ形式と配置 | `JSON` + `.mspec/cache/done-log.json` | YAML + tracked path | skip-log.json と完全対称。gitignore 済み cache dir に保存。実装コスト最小 |
| `mspec done` の guard | `produces.length > 0` ならエラー拒否 (FR-003) | 常に許可 | produces-full ステップは artifact 検査で自動 done 遷移するため `mspec done` は不要かつ混乱の元 |
| `implement` enforce フラグとの連携 | `mspec done implement` 実行時に `mspec validate` を内部実行し、anchor / E2E / TDD 証跡を確認してから done 遷移 | 警告のみ表示 | enforce_anchor / enforce_e2e / enforce_tdd フラグの形骸化を防ぎ、強制ステップとしての意味を維持する |
| idempotency | 同一 step-id への 2 回実行でタイムスタンプを上書き | no-op / エラー | 再完了の記録として自然。CI 等での再実行時にエラーにならない |
| `--reason` フラグ | 不要（任意オプションとして追加しない） | skip と対称に必須化 | 完了宣言に理由は本質的でない。skip（意図的省略）とは動機が異なる |
| readme.md への `## Done Steps` 追記 | 行わない | skip と対称に追記 | 強制ステップの完了は当然であり追記は noise になる |
| `skippable: true` 削除対象 | `implement`・`archive`・`self-review` の 3 ステップ | 残す | `skippable` は `commands/skip.ts:23` の一箇所でのみ参照。削除後も research・quickstart・checklist の `skippable: true` は維持 |

## Web References

- [Symfony Workflows and State Machines](https://symfony.com/doc/current/workflow/workflow-and-state-machine.html) — ステップが「外部イベント」によって done に遷移する設計。`mspec done` コマンドはこの "external event" に相当
- [Nextflow — Caching and resuming](https://www.nextflow.io/docs/latest/cache-and-resume.html) — タスク実行結果をキャッシュ dir に key-value で記録し再実行時にスキップ判定するパターン。done-log と skip-log の設計思想と一致
- [Prefect Task Caching](https://docs.prefect.io/v3/develop/task-caching) — Cached / Skipped 状態の分離と idempotency の重要性を解説。done と skipped を混同しないことがワークフロー可読性に直結

## Codebase Findings

### state-engine.ts — BUG 箇所
- `packages/cli/src/lib/state-engine.ts:14-18` — `ComputeStatusInput` に `skipLog: SkipLog` がある。並走して `doneLog: DoneLog` を追加する
- `packages/cli/src/lib/state-engine.ts:63-78` — `evaluateStep` の `produces.length === 0` ブランチが常に `'ready'` を返す。`isDone(doneLog, change.name, step.id)` を先に確認する分岐を差し込む
- `packages/cli/src/lib/state-engine.ts:41` — `prevReady = state === 'done' || state === 'skipped'` — `'done'` は既に連鎖条件に含まれており変更不要

### skip-log.ts — 実装テンプレート
- `packages/cli/src/lib/skip-log.ts:1-48` — `done-log.ts` の実装テンプレート
  - `SkipEntry` → `DoneEntry`（`reason` フィールドなし、`done_at` のみ）
  - `skip-log.json` → `done-log.json`
  - `recordSkip` → `recordDone`（上書き動作）
  - `isSkipped` → `isDone`

### commands/skip.ts — mspec done の雛形
- `packages/cli/src/commands/skip.ts:23-24` — `skippable` フラグの唯一の参照。`done` コマンドでは逆条件（`produces.length > 0` ならエラー）を採用
- `packages/cli/src/commands/skip.ts:34-43` — produces がある場合に placeholder MD を生成するロジック。`done` コマンドでは不要
- `packages/cli/src/commands/skip.ts:65-81` — `appendSkipToReadme` — `done` コマンドでは readme への追記を行わない（決定済み）

### コマンド登録・呼び出し箇所
- `packages/cli/src/index.ts:67-71` — `skip <step-id>` の登録箇所。`done <step-id>` を同パターンで追加
- `packages/cli/src/commands/status.ts:17-25` — `loadSkipLog` → `computeStatus` の流れ。`loadDoneLog` を並走追加
- `packages/cli/src/commands/continue.ts:43-49` — 同上

### 型定義
- `packages/cli/src/types/workflow.ts:18` — `skippable: z.boolean().default(false)` 定義済み。`implement`・`archive`・`self-review` の workflow.yaml エントリから `skippable: true` を削除するが、型スキーマ自体は残す（他 3 ステップが使用継続）

### workflow.yaml — 変更対象行
- `.mspec/workflow.yaml:82-87` — `self-review` の `skippable: true` を削除
- `.mspec/workflow.yaml:99-110` — `implement` の `skippable: true` を削除（`enforce_anchor`・`enforce_e2e`・`enforce_tdd` は維持）
- `.mspec/workflow.yaml:112-119` — `archive` の `skippable: true` を削除

### paths.ts — ファイル配置
- `packages/cli/src/workflow/paths.ts:9` — `cacheDir: join(r, '.mspec', 'cache')` — `done-log.json` はここに配置

### テストカバレッジ
- `state-engine.test.ts` が存在しない — `produces: []` のケースは現在テストカバレッジなし。新規作成が必要

## Constitution Check

> Step: research | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | `done-log.ts` は `skip-log.ts` と並走する独立モジュール。`computeStatus` の署名変更は後方互換な追加のみ |
| II. 決定論的マージ | ✅ | — | `done-log.json` はキャッシュであり archive のマージ対象外。マージロジックに影響なし |
| III. 質問駆動の要件確定 | ✅ | — | 全 Open Choices を AskUserQuestion で確定。決定根拠を本 research.md に追跡可能な形で記録 |
| IV. 双方向アンカー | — | — | アンカーロジックへの影響なし（`implement` の enforce_anchor チェックは `mspec validate` 内で既存ロジックが担当） |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | `skippable: true` を強制ステップ (removable:false) から除去することで分離がより明確になる |

### Complexity Tracking

None
