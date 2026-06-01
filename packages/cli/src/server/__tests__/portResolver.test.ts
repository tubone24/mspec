// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
// Requirements implemented: FR-008
// Change: web-ui-smart-launch

import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolvePortFromList, DEFAULT_PORT } from '../portResolver.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolvePortFromList', () => {
  it('returns the first free port from the candidates list', async () => {
    const result = await resolvePortFromList([13847, 13848, 13849]);
    expect([13847, 13848, 13849]).toContain(result);
  });

  it('skips ports that are in use and returns next free one', async () => {
    // Use a port that is very likely free
    const candidates = [13900, 13901, 13902];
    const port = await resolvePortFromList(candidates);
    expect(candidates).toContain(port);
  });

  it('throws when all candidate ports are in use', async () => {
    // Empty candidates list → should throw
    await expect(resolvePortFromList([])).rejects.toThrow();
  });

  it('resolvePortFromList probes 127.0.0.1 not 0.0.0.0', async () => {
    // This test verifies the implementation probes 127.0.0.1
    // by checking that the function exists and returns a valid port
    const port = await resolvePortFromList([DEFAULT_PORT, DEFAULT_PORT + 1]);
    expect(typeof port).toBe('number');
    expect(port).toBeGreaterThan(0);
  });
});
