// @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
// Requirements implemented: FR-001, FR-002
// Change: fix-special-step-produces

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { projectPaths } from '../../src/workflow/paths.js';
import { loadDoneLog, recordDone, isDone } from '../../src/lib/done-log.js';

describe('done-log.ts — FR-001/FR-002', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'mspec-done-log-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  // T101: FR-001 — initial write creates nested entry
  it('T101: done-log.json が存在しない状態で recordDone が新規エントリを作成する', async () => {
    const paths = projectPaths(root);
    const changeName = '2026-05-14-test-change';

    await recordDone(paths, changeName, 'implement');

    const log = await loadDoneLog(paths);
    expect(log[changeName]).toBeDefined();
    expect(log[changeName]!['implement']).toBeDefined();
    expect(log[changeName]!['implement']!.done_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  // T102: FR-001 — idempotency: second write overwrites timestamp
  it('T102: 同一ステップへの 2 回目実行でタイムスタンプが上書きされる', async () => {
    const paths = projectPaths(root);
    const changeName = '2026-05-14-test-change';

    await recordDone(paths, changeName, 'implement');
    const log1 = await loadDoneLog(paths);
    const firstAt = log1[changeName]!['implement']!.done_at;

    await new Promise((r) => setTimeout(r, 10));
    await recordDone(paths, changeName, 'implement');
    const log2 = await loadDoneLog(paths);
    const secondAt = log2[changeName]!['implement']!.done_at;

    expect(secondAt).not.toBe(firstAt);
    expect(Object.keys(log2[changeName]!)).toEqual(['implement']);
  });

  // T103: FR-002 — schema is nested object symmetric with skip-log
  it('T103: loadDoneLog が Record<string, Record<string, { done_at }>> のネスト形式を返す', async () => {
    const paths = projectPaths(root);
    const changeName = 'test-change';

    await recordDone(paths, changeName, 'archive');

    const log = await loadDoneLog(paths);
    expect(typeof log).toBe('object');
    expect(typeof log[changeName]).toBe('object');
    expect(typeof log[changeName]!['archive']).toBe('object');
    expect(typeof log[changeName]!['archive']!.done_at).toBe('string');

    expect(isDone(log, changeName, 'archive')).toBe(true);
    expect(isDone(log, changeName, 'implement')).toBe(false);
    expect(isDone(log, 'other-change', 'archive')).toBe(false);
  });
});
