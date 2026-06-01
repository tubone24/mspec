// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/cli-core/spec.md
// Requirements implemented: FR-008
// Change: web-ui-smart-launch

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock launchWebUiIfNeeded
const launchMock = vi.fn();
vi.mock('../../src/server/index.js', () => ({
  launchWebUiIfNeeded: launchMock,
}));

// Mock open-browser (cross-platform)
const openBrowserMock = vi.fn();
vi.mock('../../src/lib/open-browser.js', () => ({
  openBrowser: openBrowserMock,
}));

// Import AFTER mocks
const { openCommand } = await import('../../src/commands/open.js');

describe('mspec open command (FR-008 cli-core)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    tmpDir = await mkdtemp(join(tmpdir(), 'mspec-open-test-'));
    launchMock.mockResolvedValue({ url: 'http://localhost:3847', reused: false });
    openBrowserMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('calls launchWebUiIfNeeded and opens the browser URL', async () => {
    await openCommand({ root: tmpDir });

    expect(launchMock).toHaveBeenCalledWith(tmpDir, undefined);
    expect(openBrowserMock).toHaveBeenCalledWith('http://localhost:3847');
  });

  it('shows reuse message when Web UI already running', async () => {
    launchMock.mockResolvedValue({ url: 'http://localhost:3847', reused: true });

    await openCommand({ root: tmpDir });

    expect(launchMock).toHaveBeenCalledOnce();
    expect(openBrowserMock).toHaveBeenCalledWith('http://localhost:3847');
  });

  it('handles null result gracefully when web-ui is not installed', async () => {
    launchMock.mockResolvedValue(null);

    await expect(openCommand({ root: tmpDir })).resolves.not.toThrow();
    expect(openBrowserMock).not.toHaveBeenCalled();
  });
});
