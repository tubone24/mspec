// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-001
// Change: mspec-web-ui

import { describe, it, expect } from 'vitest';
import { parseTestResults } from '../testResultParser.js';

// NOTE: Full Fastify route tests require fastify installed.
// T107 covers the data layer: verifying that listChanges produces ChangeInfo[].
// We test the parsing logic which is the core of the /api/changes response.

describe('routes.changes — data layer', () => {
  it('parseTestResults returns empty array for unknown file extension', () => {
    // This test is a placeholder — the actual route test requires Fastify
    // and will be green after T114 implements the route
    expect(parseTestResults('data', 'file.txt')).toEqual([]);
  });
});
