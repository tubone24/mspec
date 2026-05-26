// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: mspec-web-ui

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { readPid, writePid, clearPid, isAlive, pidFilePath } from '../pidManager.js';

const tmpDir = join(tmpdir(), `mspec-test-${Date.now()}`);

describe('pidManager', () => {
  beforeEach(async () => {
    await mkdir(join(tmpDir, '.mspec'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // T102: FR-002 — プロセス再利用
  it('readPid returns null when PID file does not exist', async () => {
    const result = await readPid(tmpDir);
    expect(result).toBeNull();
  });

  it('writePid creates PID file with pid:port format', async () => {
    await writePid(tmpDir, { pid: 12345, port: 3847 });
    const result = await readPid(tmpDir);
    expect(result).toEqual({ pid: 12345, port: 3847 });
  });

  it('readPid returns entry when valid PID file exists', async () => {
    await writeFile(pidFilePath(tmpDir), '99999:3847\n', 'utf8');
    const result = await readPid(tmpDir);
    expect(result).toEqual({ pid: 99999, port: 3847 });
  });

  // T103: FR-003 — ゾンビPIDのクリーンアップ
  it('clearPid removes the PID file', async () => {
    await writePid(tmpDir, { pid: 12345, port: 3847 });
    await clearPid(tmpDir);
    const result = await readPid(tmpDir);
    expect(result).toBeNull();
  });

  it('clearPid is idempotent when file does not exist', async () => {
    await expect(clearPid(tmpDir)).resolves.not.toThrow();
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
