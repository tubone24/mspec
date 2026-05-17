---
doc_type: Tasks
---

# Tasks: fix-archive-record-done

## Phase 1 — Setup

### TASK-001: ビルド確認

`packages/cli` のビルドが最新であることを確認する。

```bash
cd packages/cli && npm run build
```

- [x] `dist/index.js` がビルド済みであること

---

## Phase 2 — Foundational

_このバグ修正に新規インフラは不要。Phase 2 はスキップ。_

---

## Phase 3 — Tests First (Red → Green)

### TASK-002: [RED] FR-003 Scenario 1 — 正常アーカイブ後の done-log 記録テスト

`packages/cli/src/commands/archive.test.ts` の `describe('archiveCommand', ...)` ブロックに以下のテストケースを追加する。

```typescript
it('records done-log entry after successful archive', async () => {
  await archiveCommand({ change: env.change, yes: true, cwd: env.root });
  const logPath = join(env.root, '.mspec', 'cache', 'done-log.json');
  const raw = await readFile(logPath, 'utf8');
  const log = JSON.parse(raw);
  expect(log[env.change]).toBeDefined();
  expect(log[env.change]['archive']).toBeDefined();
  expect(typeof log[env.change]['archive']['done_at']).toBe('string');
});
```

このテストは修正前の状態で **失敗** することを確認する（Red）。

anchor:
```
@mspec-delta 2026-05-16-135317-fix-archive-record-done/specs/cli-core/spec.md
Requirements implemented: FR-003
Change: fix-archive-record-done
```

- [x] テストを追加した
- [x] `npm test -- archive` を実行して当該テストが Red（失敗）であることを確認した

---

### TASK-003: [RED] FR-003 Scenario 2 — rename 失敗時の recordDone 未呼び出しテスト

rename が失敗した場合に done-log が変更されないことを確認するテストを追加する。`vi.spyOn` または `vi.mock` で `node:fs/promises` の `rename` をスローさせる。

```typescript
it('does not record done-log when rename fails', async () => {
  const { rename: realRename } = await import('node:fs/promises');
  vi.spyOn(await import('node:fs/promises'), 'rename').mockRejectedValueOnce(
    new Error('rename failed')
  );
  await expect(
    archiveCommand({ change: env.change, yes: true, cwd: env.root })
  ).rejects.toThrow('rename failed');
  const logPath = join(env.root, '.mspec', 'cache', 'done-log.json');
  expect(await exists(logPath)).toBe(false);
});
```

（注: self-reviewer Warn #3 の指摘に対応。`fails when change is already archived` テストは別のパスのため流用不可。）

anchor:
```
@mspec-delta 2026-05-16-135317-fix-archive-record-done/specs/cli-core/spec.md
Requirements implemented: FR-003
Change: fix-archive-record-done
```

- [x] テストを追加した
- [x] `npm test -- archive` を実行して当該テストが Red であることを確認した

---

### TASK-004: [RED] FR-003 Scenario 3 — recordDone 例外のエラー伝播テスト

`recordDone` 内の `writeFile` が失敗した場合にエラーが伝播することを確認するテストを追加する。

```typescript
it('propagates error when recordDone fails', async () => {
  vi.spyOn(await import('node:fs/promises'), 'writeFile').mockRejectedValueOnce(
    new Error('disk full')
  );
  await expect(
    archiveCommand({ change: env.change, yes: true, cwd: env.root })
  ).rejects.toThrow('disk full');
});
```

anchor:
```
@mspec-delta 2026-05-16-135317-fix-archive-record-done/specs/cli-core/spec.md
Requirements implemented: FR-003
Change: fix-archive-record-done
```

- [x] テストを追加した
- [x] `npm test -- archive` を実行して当該テストが Red であることを確認した

---

### TASK-005: [GREEN] archive.ts に recordDone 呼び出しを追加

`packages/cli/src/commands/archive.ts` を以下の 2 箇所修正して全テストを Green にする。

**変更 1: import 追加（既存インポートの末尾に追加）**

```typescript
import { recordDone } from '../lib/done-log.js';
```

**変更 2: rename() 直後に recordDone を追加（L140 と L142 の間）**

```typescript
  await rename(change.dir, targetDir);
  await recordDone(paths, change.name, 'archive');   // ← 追加

  const moved = { from: change.dir, to: targetDir };
```

anchor:
```
@mspec-delta 2026-05-16-135317-fix-archive-record-done/specs/cli-core/spec.md
Requirements implemented: FR-003
Change: fix-archive-record-done
```

- [x] import を追加した
- [x] `await recordDone(...)` を挿入した
- [x] `npm test -- archive` を実行して TASK-002〜004 を含む全テストが Green であることを確認した

---

## Phase 4 — Polish

### TASK-006: フルテストスイートで回帰確認

```bash
cd packages/cli && npm test
```

- [x] 既存テスト（merge, dry-run, already-archived, new-spec, parse-warning）が全て Green のまま
- [x] TASK-002〜004 の新規テストが全て Green

### TASK-007: Quickstart Golden Path 確認

`quickstart.md` の手順に従い、実際に `mspec archive` → `done-log.json` 確認 → `mspec continue` の流れを実行する。

- [x] `done-log.json` に `archive: { done_at: ... }` が記録される
- [x] `mspec continue` が `"next_action": "complete"` を返す

---

## Constitution Check

> Step: tasks | Constitution Version: 1

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 各タスクは独立して実行可能、依存は Red→Green の順のみ |
| II. 決定論的マージ | ✅ | — | テストと実装の変更ファイルが明確に特定されている |
| III. 質問駆動の要件確定 | ✅ | — | 全要件はユーザー質問と self-review で確定済み |
| IV. 双方向アンカー | ✅ | — | TASK-002〜005 全てに FR-003 アンカーブロック付与 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | 実装は強制スコープ内（2行追加）のみ |

### Complexity Tracking

None
