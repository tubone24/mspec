// @mspec-delta 2026-05-18-125018-cli-upgrade/specs/version-check/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: cli-upgrade
// @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: cli-upgrade
// @mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md
// Requirements implemented: FR-002, FR-004
// Change: cli-output-english
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLatestVersion, getCurrentVersion, upgradeCommand } from './upgrade.js';
import type { UpgradeOptions } from './upgrade.js';

// --- helpers ---

function makeFetch(version: string): typeof fetch {
  return vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ version }),
  } as unknown as Response);
}

function makeFailFetch(error: Error): typeof fetch {
  return vi.fn().mockRejectedValue(error);
}

function makeSpawn(status: number = 0): ReturnType<typeof vi.fn> {
  return vi.fn().mockReturnValue({ status });
}

// --- T-004: version-check FR-001 — fetch success (RED until fetchLatestVersion exists) ---

describe('fetchLatestVersion', () => {
  it('returns version string from npm registry response (FR-001)', async () => {
    const mockFetch = makeFetch('1.0.0');
    const result = await fetchLatestVersion(mockFetch);
    expect(result).toBe('1.0.0');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://registry.npmjs.org/@mspec/cli/latest',
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  // T-008: version-check FR-003 — pre-release excluded via latest tag
  it('uses /latest endpoint to exclude pre-release versions (FR-003)', async () => {
    const mockFetch = makeFetch('1.0.0');
    await fetchLatestVersion(mockFetch);
    const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain('/latest');
    expect(url).not.toContain('next');
    expect(url).not.toContain('beta');
  });
});

// --- T-006: version-check FR-002 — network error → stderr + exit 1 (RED) ---

describe('upgradeCommand network error (FR-002)', () => {
  beforeEach(() => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  it('writes error to stderr and calls process.exit(1) on fetch failure', async () => {
    const mockFetch = makeFailFetch(new Error('fetch failed'));
    await upgradeCommand({ fetchFn: mockFetch, yes: true });
    expect(process.stderr.write).toHaveBeenCalledWith(
      expect.stringContaining('Failed to fetch version info'),
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

// --- T-009/T-010: cli-upgrade FR-001/FR-002 — command recognized + version display (RED) ---

describe('upgradeCommand version display (FR-001, FR-002)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('displays current and latest version (FR-002)', async () => {
    const mockFetch = makeFetch('99.0.0');
    const mockSpawn = makeSpawn();
    await upgradeCommand({ fetchFn: mockFetch, spawnFn: mockSpawn as never, yes: true });
    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls.map((c) =>
      c.join(''),
    );
    expect(calls.some((line) => line.includes('Current version:'))).toBe(true);
    expect(calls.some((line) => line.includes('Latest version:'))).toBe(true);
  });
});

// --- T-012: cli-upgrade FR-004 — already up-to-date (RED) ---

describe('upgradeCommand already up-to-date (FR-004)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('shows already up-to-date message and skips npm install when versions match', async () => {
    const currentVersion = getCurrentVersion();
    const mockFetch = makeFetch(currentVersion);
    const mockSpawn = makeSpawn();
    await upgradeCommand({ fetchFn: mockFetch, spawnFn: mockSpawn as never, yes: false });
    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls.map((c) =>
      c.join(''),
    );
    expect(calls.some((line) => line.includes('Already up to date'))).toBe(true);
    expect(calls.some((line) => line.includes(currentVersion))).toBe(true);
    expect(mockSpawn).not.toHaveBeenCalled();
  });
});

// --- T-014: cli-upgrade FR-003 — upgrade execution (RED) ---

describe('upgradeCommand upgrade execution (FR-003)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('runs npm install when --yes flag is set and newer version exists', async () => {
    const mockFetch = makeFetch('99.0.0');
    const mockSpawn = makeSpawn(0);
    await upgradeCommand({ fetchFn: mockFetch, spawnFn: mockSpawn as never, yes: true });
    expect(mockSpawn).toHaveBeenCalledWith(
      'npm',
      ['install', '-g', '@mspec/cli@latest'],
      expect.objectContaining({ stdio: 'inherit' }),
    );
  });

  it('cancels when answer is not y or Y (non-TTY returns empty string)', async () => {
    const mockFetch = makeFetch('99.0.0');
    const mockSpawn = makeSpawn(0);
    // Simulate non-TTY: ask() returns '' → should cancel
    await upgradeCommand({
      fetchFn: mockFetch,
      spawnFn: mockSpawn as never,
      yes: false,
    });
    // In test environment stdin is not a TTY, so ask() returns '' → cancel
    expect(mockSpawn).not.toHaveBeenCalled();
  });
});
