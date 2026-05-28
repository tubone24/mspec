// @mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
// Requirements implemented: FR-011, FR-012, FR-013
// Change: multi-test-runner-support

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveRunners, buildMultiRunnerEvidence, type RunnerResult } from './test.js';
import type { Config } from '../types/config.js';

async function makeTmpDir(): Promise<string> {
  const d = join(tmpdir(), `mspec-test-${Date.now()}`);
  await mkdir(d, { recursive: true });
  return d;
}

describe('resolveRunners — FR-013 legacy fallback', () => {
  it('runners が未設定の場合は test.command を単一ランナーとして返す', () => {
    const cfg: Config = {
      version: 1,
      test: {
        command: 'npm test',
        expect_red_on_exit: [1, 2],
        expect_green_on_exit: [0],
      },
    };
    const runners = resolveRunners(cfg);
    expect(runners).toHaveLength(1);
    expect(runners[0]!.name).toBe('__default__');
    expect(runners[0]!.command).toBe('npm test');
    expect(runners[0]!.expectRedOnExit).toEqual([1, 2]);
    expect(runners[0]!.expectGreenOnExit).toEqual([0]);
  });

  it('runners が空配列の場合も legacy モードにフォールバックする', () => {
    const cfg: Config = {
      version: 1,
      test: {
        command: 'npm test',
        expect_red_on_exit: [1, 2],
        expect_green_on_exit: [0],
        runners: [],
      },
    };
    const runners = resolveRunners(cfg);
    expect(runners).toHaveLength(1);
    expect(runners[0]!.name).toBe('__default__');
  });

  it('runners が未設定で test 自体が未設定の場合は空コマンドで返す', () => {
    const cfg: Config = { version: 1 };
    const runners = resolveRunners(cfg);
    expect(runners).toHaveLength(1);
    expect(runners[0]!.command).toBe('');
  });
});

describe('resolveRunners — FR-010 multi-runner mode', () => {
  it('runners 配列が存在する場合は各ランナーを返す', () => {
    const cfg: Config = {
      version: 1,
      test: {
        command: 'ignored',
        expect_red_on_exit: [1, 2],
        expect_green_on_exit: [0],
        runners: [
          { name: 'backend', command: 'pytest -x' },
          { name: 'frontend', command: 'pnpm test', cwd: 'packages/web-ui' },
        ],
      },
    };
    const runners = resolveRunners(cfg);
    expect(runners).toHaveLength(2);
    expect(runners[0]!.name).toBe('backend');
    expect(runners[0]!.command).toBe('pytest -x');
    expect(runners[1]!.name).toBe('frontend');
    expect(runners[1]!.cwd).toBe('packages/web-ui');
  });

  it('ランナーの expect_* が省略された場合はトップレベルのデフォルトを使用する', () => {
    const cfg: Config = {
      version: 1,
      test: {
        expect_red_on_exit: [1, 2, 3],
        expect_green_on_exit: [0],
        runners: [{ name: 'backend', command: 'pytest' }],
      },
    };
    const runners = resolveRunners(cfg);
    expect(runners[0]!.expectRedOnExit).toEqual([1, 2, 3]);
    expect(runners[0]!.expectGreenOnExit).toEqual([0]);
  });

  it('ランナー個別の expect_* が最優先される', () => {
    const cfg: Config = {
      version: 1,
      test: {
        expect_red_on_exit: [1],
        expect_green_on_exit: [0],
        runners: [
          { name: 'backend', command: 'pytest', expect_red_on_exit: [1, 2], expect_green_on_exit: [0] },
        ],
      },
    };
    const runners = resolveRunners(cfg);
    expect(runners[0]!.expectRedOnExit).toEqual([1, 2]);
  });

  it('runners モードでは command フィールドは無視される', () => {
    const cfg: Config = {
      version: 1,
      test: {
        command: 'should-be-ignored',
        runners: [{ name: 'only', command: 'real-command' }],
      },
    };
    const runners = resolveRunners(cfg);
    expect(runners).toHaveLength(1);
    expect(runners[0]!.command).toBe('real-command');
  });
});

describe('buildMultiRunnerEvidence — FR-011', () => {
  it('全ランナー成功時に正しい payload を生成する', () => {
    const results: RunnerResult[] = [
      { name: 'backend', command: 'pytest -x', exit_code: 0, ok: true },
      { name: 'frontend', command: 'pnpm test', exit_code: 0, ok: true },
    ];
    const ev = buildMultiRunnerEvidence('T005', 'test-change', 'green', results);
    expect(ev.task_id).toBe('T005');
    expect(ev.change).toBe('test-change');
    expect(ev.expect).toBe('green');
    expect(ev.command).toEqual(['pytest -x', 'pnpm test']);
    expect(ev.runners).toEqual([
      { name: 'backend', exit_code: 0 },
      { name: 'frontend', exit_code: 0 },
    ]);
    expect(ev.ok).toBe(true);
    expect(typeof ev.recorded_at).toBe('string');
  });

  it('単一ランナー (__default__) の場合は legacy 形式 (command: string) を生成する', () => {
    const results: RunnerResult[] = [
      { name: '__default__', command: 'npm test', exit_code: 0, ok: true },
    ];
    const ev = buildMultiRunnerEvidence('T005', 'test-change', 'green', results);
    expect(typeof ev.command).toBe('string');
    expect(ev.command).toBe('npm test');
    expect('runners' in ev).toBe(false);
    expect('matched_green' in ev || 'matched_red' in ev).toBe(true);
  });
});

describe('buildMultiRunnerEvidence — FR-012 fail-fast', () => {
  it('失敗したランナーが含まれる場合は ok が false', () => {
    const results: RunnerResult[] = [
      { name: 'backend', command: 'pytest', exit_code: 1, ok: false },
    ];
    const ev = buildMultiRunnerEvidence('T007', 'test-change', 'green', results);
    expect(ev.ok).toBe(false);
  });
});
