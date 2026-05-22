// @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: cli-upgrade
// @mspec-delta 2026-05-18-125018-cli-upgrade/specs/version-check/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: cli-upgrade
// @mspec-delta 2026-05-21-215113-fix-upgrade-package-json-path/specs/upgrade-command/spec.md
// Requirements implemented: FR-001, FR-002
// Change: fix-upgrade-package-json-path
import { describe, it, expect } from 'vitest';
import { upgradeCommand, fetchLatestVersion, getCurrentVersion } from '../../src/commands/upgrade.js';
import { vi, beforeEach } from 'vitest';


describe('upgrade command e2e (FR-001, FR-002, FR-003, FR-004)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('FR-001: upgradeCommand export exists and is callable', () => {
    expect(typeof upgradeCommand).toBe('function');
  });

  it('FR-002: displays current and latest version lines to stdout', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ version: '99.0.0' }),
    } as unknown as Response);
    const mockSpawn = vi.fn().mockReturnValue({ status: 0 });

    await upgradeCommand({ fetchFn: mockFetch, spawnFn: mockSpawn as never, yes: true });

    const lines = logSpy.mock.calls.map((c) => c.join(''));
    expect(lines.some((l) => l.includes('現在のバージョン:'))).toBe(true);
    expect(lines.some((l) => l.includes('最新バージョン:'))).toBe(true);
  });

  it('FR-003: runs npm install -g when newer version and --yes flag set', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ version: '99.0.0' }),
    } as unknown as Response);
    const mockSpawn = vi.fn().mockReturnValue({ status: 0 });

    await upgradeCommand({ fetchFn: mockFetch, spawnFn: mockSpawn as never, yes: true });

    expect(mockSpawn).toHaveBeenCalledWith(
      'npm',
      ['install', '-g', '@mspec/cli@latest'],
      expect.objectContaining({ stdio: 'inherit' }),
    );
  });

  it('FR-004: shows already up-to-date message when versions match', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const current = getCurrentVersion();
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ version: current }),
    } as unknown as Response);
    const mockSpawn = vi.fn().mockReturnValue({ status: 0 });

    await upgradeCommand({ fetchFn: mockFetch, spawnFn: mockSpawn as never });

    const lines = logSpy.mock.calls.map((c) => c.join(''));
    expect(lines.some((l) => l.includes('すでに最新バージョンです'))).toBe(true);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('version-check FR-001: fetchLatestVersion returns version string', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ version: '2.0.0' }),
    } as unknown as Response);
    const result = await fetchLatestVersion(mockFetch);
    expect(result).toBe('2.0.0');
  });

  it('version-check FR-002: exits non-zero on fetch failure', async () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const mockFetch = vi.fn().mockRejectedValue(new Error('network error'));

    await upgradeCommand({ fetchFn: mockFetch, yes: true });

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('version-check FR-003: uses /latest endpoint to exclude pre-release', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ version: '1.0.0' }),
    } as unknown as Response);
    await fetchLatestVersion(mockFetch);
    const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toMatch(/\/latest$/);
  });
});
