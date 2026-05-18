// @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: init-link-global-bin

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSpawnSync, mockAccess } = vi.hoisted(() => ({
  mockSpawnSync: vi.fn(),
  mockAccess: vi.fn(),
}));

vi.mock('node:child_process', () => ({ spawnSync: mockSpawnSync }));
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, access: mockAccess };
});

import { ensureGlobalLink } from './init.js';

describe('ensureGlobalLink', () => {
  beforeEach(() => {
    mockSpawnSync.mockReset();
    mockAccess.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('FR-001: dev-mode で npm run build → npm link を順番に実行する', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockSpawnSync.mockReturnValue({ status: 0, error: undefined });

    await ensureGlobalLink();

    expect(mockSpawnSync).toHaveBeenCalledTimes(2);
    expect(mockSpawnSync.mock.calls[0]![0]).toBe('npm');
    expect(mockSpawnSync.mock.calls[0]![1]).toEqual(['run', 'build']);
    expect(mockSpawnSync.mock.calls[1]![0]).toBe('npm');
    expect(mockSpawnSync.mock.calls[1]![1]).toEqual(['link']);
  });

  it('FR-001: npm link の後に成功メッセージを出力する', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockSpawnSync.mockReturnValue({ status: 0, error: undefined });

    await ensureGlobalLink();

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('✓'),
      'mspec linked globally',
    );
  });

  it('FR-002: tsconfig.json が存在しない場合は spawnSync を呼ばない', async () => {
    mockAccess
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('ENOENT'));

    await ensureGlobalLink();

    expect(mockSpawnSync).not.toHaveBeenCalled();
  });

  it('FR-002: package.json が存在しない場合は spawnSync を呼ばない', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    await ensureGlobalLink();

    expect(mockSpawnSync).not.toHaveBeenCalled();
  });

  it('FR-003: npm run build が失敗した場合は warn を出して npm link を呼ばない', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockSpawnSync.mockReturnValue({ status: 1, error: undefined });

    await ensureGlobalLink();

    expect(mockSpawnSync).toHaveBeenCalledTimes(1);
    expect(mockSpawnSync.mock.calls[0]![1]).toEqual(['run', 'build']);
    expect(console.warn).toHaveBeenCalled();
  });

  it('FR-003: npm link が失敗した場合は warn を出して処理を継続する', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockSpawnSync
      .mockReturnValueOnce({ status: 0, error: undefined })
      .mockReturnValueOnce({ status: 1, error: undefined });

    await ensureGlobalLink();

    expect(mockSpawnSync).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalled();
  });
});
