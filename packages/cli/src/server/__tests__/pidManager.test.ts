// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: mspec-web-ui

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';

// We temporarily override PID_FILE to a temp location
const tmpDir = join(tmpdir(), `mspec-test-${Date.now()}`);
const testPidFile = join(tmpDir, '.mspec', 'ui.pid');

vi.mock('node:os', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:os')>();
  return { ...original, homedir: () => tmpDir };
});

const { readPid, writePid, clearPid, isAlive } = await import('../pidManager.js');

describe('pidManager', () => {
  beforeEach(async () => {
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // T102: FR-002 — プロセス再利用
  it('readPid returns null when PID file does not exist', async () => {
    const result = await readPid();
    expect(result).toBeNull();
  });

  it('writePid creates PID file with pid:port format', async () => {
    await writePid({ pid: 12345, port: 3847 });
    const result = await readPid();
    expect(result).toEqual({ pid: 12345, port: 3847 });
  });

  it('readPid returns entry when valid PID file exists', async () => {
    await mkdir(join(tmpDir, '.mspec'), { recursive: true });
    await writeFile(testPidFile, '99999:3847\n', 'utf8');
    const result = await readPid();
    expect(result).toEqual({ pid: 99999, port: 3847 });
  });

  // T103: FR-003 — ゾンビPIDのクリーンアップ
  it('clearPid removes the PID file', async () => {
    await writePid({ pid: 12345, port: 3847 });
    await clearPid();
    const result = await readPid();
    expect(result).toBeNull();
  });

  it('clearPid is idempotent when file does not exist', async () => {
    await expect(clearPid()).resolves.not.toThrow();
  });

  // T101: FR-001 — isAlive check
  it('isAlive returns true for current process', () => {
    expect(isAlive(process.pid)).toBe(true);
  });

  it('isAlive returns false for non-existent PID', () => {
    // PID 9999999 is very unlikely to exist
    expect(isAlive(9999999)).toBe(false);
  });
});
