---
doc_type: Design
---

# Design: fix-archive-record-done

## Summary

`packages/cli/src/commands/archive.ts` に2行を追加する最小修正。

1. `import { recordDone } from '../lib/done-log.js'` をインポートリストに追加する。
2. `await rename(change.dir, targetDir)` 直後（L140 と L142 `const moved = ...` の間）に `await recordDone(paths, change.name, 'archive')` を追加する。

これにより `archive` ステップの done-log 記録が行われ、`mspec continue` が次回から正しく `next_action: "complete"` を返す。

## Technical Context

### done-log の仕組み

`produces: []` のステップ（`archive`, `implement`, `self-review`）は生成ファイルが存在しないため、`state-engine.ts` はファイル存在チェックをバイパスし、`isDone(doneLog, changeName, stepId)` のみで完了を判定する。

```
isDone → log[changeName]?.[stepId]  // falsy → ready のまま
```

`recordDone(paths, changeName, stepId)` は `<root>/.mspec/cache/done-log.json` を読み込み、`log[changeName][stepId] = { done_at: ISO_STRING }` を upsert して書き込む。

### 現行 archive.ts の制御フロー (抜粋)

```
// step 7: merged source specs を書き込む (L132-135)
// step 8: change dir を archive/ に移動 (L137-140)
await rename(change.dir, targetDir);                 // ← ここ以降に追加
// ★ ここに recordDone を追加する (L141)

const moved = { from: change.dir, to: targetDir };  // L142
return { ... };                                      // L144
```

### `recordDone` API（done-log.ts）

```typescript
recordDone(paths: ProjectPaths, changeName: string, stepId: string): Promise<void>
```

- 内部 catch なし — I/O 失敗はスローする
- 同じ stepId で複数回呼んでも安全（upsert）
- `done.ts` L45 が先例: 裸の `await`、try/catch なし

## Decisions

### DEC-001 — 挿入位置は `rename()` 直後、`const moved = ...` の前

**根拠**: rename が完了した時点で archive の責務は果たされている。done-log は副作用として記録するだけなので、`moved` 変数の構築前に実行しても問題ない。rename 失敗時はここに到達しないため、条件分岐が不要。

**受け入れ基準 (→ FR-003 Scenario: 正常アーカイブ後の done-log 記録)**:
- GIVEN archive を実行
- WHEN rename 成功
- THEN done-log に `archive: { done_at: <string> }` が記録される

### DEC-002 — try/catch なし、エラー自然伝播

**根拠**: `recordDone` の I/O 失敗は `await` を通じてそのままスローされる。これは `done.ts` の確立されたパターンと一致し、余分なラッパーを避ける。

**受け入れ基準 (→ FR-003 Scenario: recordDone 例外のエラー伝播)**:
- GIVEN rename 成功後に recordDone が例外をスロー
- WHEN archiveCommand が await で呼び出す
- THEN 例外は呼び出し元に伝播し、プロセスは非ゼロ終了

### DEC-003 — `ArchiveResult` 型変更なし

**根拠**: done-log 書き込みは副作用であり、戻り値に反映する情報ではない。`moved` フィールドで rename の成否は表現できる。

### DEC-004 — ロールバックなし

**根拠**: ユーザー確認済み（OC-001）。rename 済みディレクトリの逆 rename はそれ自体が失敗するリスクがあり、状態をさらに曖昧にする。操作者は `mspec done archive --change <name>` で手動復旧できる。

## Project Structure

変更対象ファイル：

| ファイル | 変更内容 |
|---------|---------|
| `packages/cli/src/commands/archive.ts` | import 追加 1 行、`await recordDone(...)` 追加 1 行 |
| `packages/cli/src/commands/archive.test.ts` | done-log 記録を検証するテストケース 1 件追加 |

## Constitution Check

> Step: design | Constitution Version: 1

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | archive.ts のみ変更、他コマンド・ステップに波及なし |
| II. 決定論的マージ | ✅ | ✅ | import 1 行 + await 1 行の追加のみ、競合なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | Non-Goals・完了条件・OC-001 をユーザーへの質問で確定 |
| IV. 双方向アンカー | — | ✅ | DEC-001/002 を FR-003 Scenario に対応付け済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | archive は強制ステップ、追加コードは最小限 |

### Complexity Tracking

None

## Self-Review

> Reviewed by: mspec-self-reviewer | Date: 2026-05-17

### Verdict: PASS

### Findings

| # | Artifact | Finding | Severity | Action |
|---|----------|---------|----------|--------|
| 1 | `design.md` | 挿入位置「L140 と L142 の間」は `archive.ts` 実コードと一致。設計と実装が整合している。 | Info | No action |
| 2 | `quickstart.md` | Step 1 の「必要な成果物を最低限用意」手順が省略されている。 | Nit | 省略手順をコメントで補足すれば十分 |
| 3 | `checklist.md` | FR-003 Scenario 2（rename 失敗時）のテスト計画が既存テスト `fails when change is already archived` の派生と記載されているが、そのテストは `findChange` 早期エラーであり rename 失敗ではない。別途 `rename()` mock テストが必要。 | Warn | implement ステップで rename mock テストを独立追加すること |
| 4 | `spec.md` | Scenario 2「rename 失敗時」に対応する DEC が design.md に独立していないが、DEC-001 本文内で言及済み。実害なし。 | Nit | No action |
| 5 | `checklist.md` | `recordDone` が L40 で `mkdir({ recursive: true })` を自前実行する分析は done-log.ts の実装と一致して正確。 | Info | No action |
| 6 | proposal Goals → design Decisions | 全 5 Goals が DEC-001〜004 にカバーされている。 | Info | No action |

### Summary

全 5 つの proposal Goals は design.md・spec.md・checklist.md で網羅されており、挿入位置（L140 直後）は実コードと一致している。Warn 1 件（checklist.md の rename 失敗テスト計画の記述）は implement ステップで rename mock テストを追加することで解消される。blocker 相当の問題はなく、PASS と判定する。
