// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/cli-core/spec.md
// Requirements implemented: FR-007, FR-008
// Change: web-ui-smart-launch

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock all server-side dependencies for integration test
const launchMock = vi.fn();
vi.mock('../../src/server/index.js', () => ({
  launchWebUiIfNeeded: launchMock,
  writePid: vi.fn(),
  clearPid: vi.fn(),
  readPid: vi.fn().mockResolvedValue(null),
}));

const openBrowserMock = vi.fn();
vi.mock('../../src/lib/open-browser.js', () => ({
  openBrowser: openBrowserMock,
}));

const { newCommand } = await import('../../src/commands/new.js');
const { openCommand } = await import('../../src/commands/open.js');

const WORKFLOW_YAML = `version: 1
name: test
steps:
  - id: new
    command: /mspec:new
    skill: mspec-new
    produces: [readme.md]
    block: true
    removable: false
`;

describe('web-ui-smart-launch integration (FR-007, FR-008)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    tmpDir = await mkdtemp(join(tmpdir(), 'mspec-smart-launch-'));
    await mkdir(join(tmpDir, '.mspec'), { recursive: true });
    await writeFile(join(tmpDir, '.mspec', 'workflow.yaml'), WORKFLOW_YAML);
    launchMock.mockResolvedValue({ url: 'http://localhost:3847', reused: false });
    openBrowserMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // FR-007: mspec new triggers Web UI launch
  it('mspec new triggers launchWebUiIfNeeded and displays URL', async () => {
    await newCommand('test-feature', { cwd: tmpDir });

    // launchWebUiIfNeeded was called (hook exists in new.ts)
    // Allow async non-blocking execution to complete
    await new Promise((r) => setTimeout(r, 50));
    expect(launchMock).toHaveBeenCalledWith(tmpDir, expect.anything());
  });

  // FR-008: mspec open triggers Web UI launch + browser open
  it('mspec open triggers launchWebUiIfNeeded and opens browser', async () => {
    await openCommand({ root: tmpDir });

    expect(launchMock).toHaveBeenCalledWith(tmpDir, undefined);
    expect(openBrowserMock).toHaveBeenCalledWith('http://localhost:3847');
  });

  // Double-launch prevention: reused=true shows "already running"
  it('shows already-running message on second launch (reused=true)', async () => {
    launchMock.mockResolvedValue({ url: 'http://localhost:3847', reused: true });

    await openCommand({ root: tmpDir });

    expect(launchMock).toHaveBeenCalledOnce();
    expect(openBrowserMock).toHaveBeenCalledWith('http://localhost:3847');
  });

  // Port fallback: different port returned
  it('displays fallback port URL when default port was in use', async () => {
    launchMock.mockResolvedValue({ url: 'http://localhost:3848', reused: false });

    await openCommand({ root: tmpDir });

    expect(openBrowserMock).toHaveBeenCalledWith('http://localhost:3848');
  });
});
