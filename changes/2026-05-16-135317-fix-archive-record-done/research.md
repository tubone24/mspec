---
doc_type: Research
---

# Research: fix-archive-record-done

## Decisions

### D-001 — archive.ts への `recordDone` 挿入箇所

`await recordDone(paths, change.name, 'archive')` の挿入位置は `/Users/kagadminmac/project/mspec/packages/cli/src/commands/archive.ts` の `await rename(change.dir, targetDir)` 直後（現行 L140）、`return` 文（L144）の前。これにより rename 完了後のみ done-log に記録される。

`recordDone` は `'../lib/done-log.js'` からインポートする必要がある（archive.ts に未存在）。

### D-002 — `recordDone` 周囲に try/catch は不要

`recordDone` は内部で `writeFile` を catch しないため、I/O 失敗時に自然にスローする。`await` で呼べば Node.js の非同期エラー伝播が動き、try/catch なしで FR-003 の「呼び出し元への伝播」要件を満たせる。既存の `done.ts` L45 も裸の `await` のみで同じパターン。

### D-003 — テストファイルの場所とパターン

既存テスト `/Users/kagadminmac/project/mspec/packages/cli/src/commands/archive.test.ts` の `describe('archiveCommand', ...)` ブロックに追加。成功ケース後に `.mspec/cache/done-log.json` が存在し、変更名のキーに `archive: { done_at: <string> }` が含まれることをアサートする。

## Web References

N/A — 外部依存なし、ローカルコード修正のみ。

## Codebase Findings

### F-001 — `archive.ts` は `recordDone` を import も呼び出しもしていない

`/Users/kagadminmac/project/mspec/packages/cli/src/commands/archive.ts` L1–13 のインポートに `done-log` は存在しない。`rename()` は L140、`return` は L144。この間に done-log への書き込みは一切ない。

### F-002 — `archive` ステップは `produces: []` のため file-existence チェックがバイパスされる

`state-engine.ts` L104–106 で `produces: []` のステップは `isDone(doneLog, ...)` のみで完了判定される。`recordDone` 未呼び出しにより `isDone` が常に `false` を返し、ステップが `ready` のまま留まる。

### F-003 — `isDone` / `recordDone` API

`/Users/kagadminmac/project/mspec/packages/cli/src/lib/done-log.ts`:
- `recordDone(paths, changeName, stepId): Promise<void>` — ログを upsert して `<cacheDir>/done-log.json` に書き込む。I/O 失敗時はスロー（内部 catch なし）。
- `isDone(log, changeName, stepId): boolean` — `Boolean(log[changeName]?.[stepId])` の純粋関数。
- `cacheDir` = `<root>/.mspec/cache/done-log.json`（`paths.ts` L25）。

### F-004 — `done.ts` の recordDone 呼び出しパターン

`/Users/kagadminmac/project/mspec/packages/cli/src/commands/done.ts` L45: `await recordDone(paths, change.name, stepId)` — 裸の `await`、try/catch なし。これがコードベースの確立されたパターン。

### F-005 — `ArchiveResult` 型の変更は不要

`ArchiveResult`（archive.ts L34–40）に `donedAt` 相当フィールドはなく、今回も追加不要。done-log への副作用のみで十分。

## Open Choices

### OC-001 — `recordDone` 失敗時にディレクトリ rename をロールバックすべきか？

Resolved: **ロールバックしない。** 根拠:

1. この時点では rename と SoT spec マージは完了済み。ロールバック用の第2 `rename()` 自体が失敗するリスクがあり、状態がさらに曖昧になる。
2. 復旧は手動で `mspec done archive --change <name>` 相当を実行すれば済む（`done.ts` が `recordDone` を直接呼ぶため）。
3. 既存コード（`done.ts`）にもロールバック処理はなく、提案の Non-Goals でも新たなロールバック機構の導入は除外している。

## Constitution Check

> Step: research | Constitution Version: 1

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | `archive.ts` のみへの最小変更、他コマンドに影響なし |
| II. 決定論的マージ | ✅ | — | import 追加 1 行 + await 1 行の追加のみ、競合なし |
| III. 質問駆動の要件確定 | ✅ | — | OC-001 をリサーチで解決、ユーザー確認済み |
| IV. 双方向アンカー | — | — | design/tasks ステップ以降で評価 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | archive は強制ステップ、変更は最小限 |

### Complexity Tracking

None
