// @mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
// Requirements implemented: FR-010
// Change: multi-test-runner-support

import { describe, it, expect } from 'vitest';
import { RunnerSchema, TestConfigSchema } from './config.js';

describe('RunnerSchema — FR-010', () => {
  it('name が空文字列の場合バリデーションエラーになる', () => {
    const result = RunnerSchema.safeParse({ name: '', command: 'npm test' });
    expect(result.success).toBe(false);
  });

  it('command が空文字列の場合バリデーションエラーになる', () => {
    const result = RunnerSchema.safeParse({ name: 'backend', command: '' });
    expect(result.success).toBe(false);
  });

  it('有効なランナー定義を受け入れる', () => {
    const result = RunnerSchema.safeParse({ name: 'backend', command: 'pytest -x' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('backend');
      expect(result.data.command).toBe('pytest -x');
    }
  });

  it('cwd・expect_red_on_exit・expect_green_on_exit・results_src は省略可能', () => {
    const result = RunnerSchema.safeParse({
      name: 'backend',
      command: 'pytest -x',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cwd).toBeUndefined();
      expect(result.data.expect_red_on_exit).toBeUndefined();
      expect(result.data.results_src).toBeUndefined();
    }
  });

  it('全フィールドを指定した場合も正しく解析される', () => {
    const result = RunnerSchema.safeParse({
      name: 'frontend',
      command: 'pnpm test',
      cwd: 'packages/web-ui',
      expect_red_on_exit: [1, 2],
      expect_green_on_exit: [0],
      results_src: 'test-results/results.json',
    });
    expect(result.success).toBe(true);
  });
});

describe('TestConfigSchema.runners — FR-010', () => {
  it('runners フィールドは省略可能', () => {
    const result = TestConfigSchema.safeParse({ command: 'npm test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.runners).toBeUndefined();
    }
  });

  it('runners に有効な配列を渡せる', () => {
    const result = TestConfigSchema.safeParse({
      runners: [
        { name: 'backend', command: 'pytest -x' },
        { name: 'frontend', command: 'pnpm test', cwd: 'packages/web-ui' },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.runners).toHaveLength(2);
    }
  });

  it('runners 配列内にバリデーションエラーがあると失敗する', () => {
    const result = TestConfigSchema.safeParse({
      runners: [{ name: '', command: 'npm test' }],
    });
    expect(result.success).toBe(false);
  });
});
