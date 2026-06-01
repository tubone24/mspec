// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
// Requirements implemented: FR-009, FR-010, FR-014
// Change: web-ui-smart-launch

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Fixed token for deterministic tests
const FIXED_TOKEN = 'fixed-test-token-uuid';

// Mock node:crypto randomUUID
vi.mock('node:crypto', () => ({ randomUUID: () => FIXED_TOKEN }));

// Mock child_process.spawn
const spawnMock = vi.fn(() => ({ unref: vi.fn(), pid: 1234 }));
vi.mock('node:child_process', () => ({ spawn: spawnMock }));

// Mock pidManager
const readPidMock = vi.fn();
const writePidMock = vi.fn();
const clearPidMock = vi.fn();
vi.mock('../pidManager.js', () => ({
  readPid: readPidMock,
  writePid: writePidMock,
  clearPid: clearPidMock,
  isAlive: vi.fn(() => true),
}));

// Mock portResolver
const resolvePortFromListMock = vi.fn(async () => 3847);
vi.mock('../portResolver.js', () => ({
  resolvePortFromList: resolvePortFromListMock,
  resolveConfigPort: vi.fn(async () => undefined),
  DEFAULT_PORT_CANDIDATES: [3847, 3848, 3849, 3850, 3851],
  DEFAULT_PORT: 3847,
}));

// Mock @mspec/web-ui resolution
vi.mock('node:module', () => ({
  createRequire: () => {
    const req = (id: string) => {
      if (id === '@mspec/web-ui/dist/index.html') return '/mock/dist/index.html';
      throw Object.assign(new Error('not found'), { code: 'MODULE_NOT_FOUND' });
    };
    req.resolve = (id: string) => {
      if (id === '@mspec/web-ui/dist/index.html') return '/mock/dist/index.html';
      throw Object.assign(new Error('not found'), { code: 'MODULE_NOT_FOUND' });
    };
    return req;
  },
}));

// Import after mocks
const { launchWebUiIfNeeded } = await import('../index.js');

const ROOT = '/test/project';

describe('launchWebUiIfNeeded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no PID file
    readPidMock.mockResolvedValue(null);
    writePidMock.mockResolvedValue(undefined);
    clearPidMock.mockResolvedValue(undefined);
    resolvePortFromListMock.mockResolvedValue(3847);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // T201: FR-009 — PID + HTTP dual check: reuse when health check succeeds and identity matches
  it('reuses existing server when PID file exists and health check passes with matching identity', async () => {
    const token = 'test-token-123';
    readPidMock.mockResolvedValue({ pid: 99999, port: 3847, projectRoot: ROOT, token });

    // Mock fetch to return matching identity
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projectRoot: ROOT, token, port: 3847, pid: 99999 }),
    } as Response);

    const result = await launchWebUiIfNeeded(ROOT);
    expect(result?.reused).toBe(true);
    expect(result?.url).toBe('http://localhost:3847');
    expect(spawnMock).not.toHaveBeenCalled();
  });

  // T201: FR-009 — no PID file → new launch
  it('spawns new server when no PID file exists', async () => {
    readPidMock.mockResolvedValue(null);
    writePidMock.mockResolvedValue(undefined);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projectRoot: ROOT, token: FIXED_TOKEN, port: 3847, pid: 1234 }),
    } as Response);

    const result = await launchWebUiIfNeeded(ROOT);
    expect(result?.reused).toBe(false);
    expect(spawnMock).toHaveBeenCalledOnce();
    // FR-014: shell: false must be explicit
    const spawnOpts = spawnMock.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(spawnOpts?.['shell']).toBe(false);
  });

  // T201: FR-010 — stale PID: HTTP fails → clearPid + new launch
  it('clears stale PID and relaunches when health check fails', async () => {
    readPidMock.mockResolvedValue({ pid: 88888, port: 3847, projectRoot: ROOT, token: 'old-token' });

    // First call (stale check): fail. Subsequent calls (waitForHealth): succeed with FIXED_TOKEN
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) throw new Error('connection refused');
      return {
        ok: true,
        json: async () => ({ projectRoot: ROOT, token: FIXED_TOKEN, port: 3847, pid: 1234 }),
      } as Response;
    });

    await launchWebUiIfNeeded(ROOT);
    expect(clearPidMock).toHaveBeenCalledWith(ROOT);
    expect(spawnMock).toHaveBeenCalledOnce();
  });

  // T202: FR-014 — spawn uses shell: false explicitly
  it('spawns server with shell: false explicitly set', async () => {
    readPidMock.mockResolvedValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projectRoot: ROOT, token: FIXED_TOKEN, port: 3847, pid: 1234 }),
    } as Response);

    await launchWebUiIfNeeded(ROOT);

    expect(spawnMock).toHaveBeenCalledOnce();
    const opts = spawnMock.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(opts?.['shell']).toBe(false);
  });

  // T202: FR-014 — port is passed as integer-validated string
  it('validates port as integer before passing to spawn', async () => {
    readPidMock.mockResolvedValue(null);
    resolvePortFromListMock.mockResolvedValue(3848);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projectRoot: ROOT, token: FIXED_TOKEN, port: 3848, pid: 1234 }),
    } as Response);

    await launchWebUiIfNeeded(ROOT);

    const args = spawnMock.mock.calls[0]?.[1] as string[];
    // argv[1] is portNum (positional), argv[2] is root, etc.
    const portArg = args?.[1]; // [serverModule, portNum, root, distPath, token, projectRoot]
    expect(portArg).toBe('3848');
  });
});
