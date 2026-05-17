// @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-archive/spec.md
// Requirements implemented: FR-013
// Change: claude-core-completion

import { describe, it, expect } from 'vitest';
import { formatSummary } from './archive-summary.js';
import type { MergeSummary } from './archive-merger.js';

function summary(added: number, modified: number, removed: number, renamed: number): MergeSummary {
  return { added, modified, removed, renamed };
}

describe('formatSummary', () => {
  it('formats +a ~m -r ⇄n correctly for non-zero values', () => {
    const result = formatSummary([
      { capability: 'cli-anchor', summary: summary(2, 1, 0, 0) },
    ]);
    expect(result).toBe('cli-anchor: +2 ~1 -0 ⇄0');
  });

  it('formats multiple capabilities', () => {
    const result = formatSummary([
      { capability: 'cli-anchor', summary: summary(2, 1, 0, 0) },
      { capability: 'cli-archive', summary: summary(1, 0, 0, 0) },
    ]);
    expect(result).toBe('cli-anchor: +2 ~1 -0 ⇄0\ncli-archive: +1 ~0 -0 ⇄0');
  });

  it('sorts capabilities lexicographically regardless of input order', () => {
    const result = formatSummary([
      { capability: 'zzz-last', summary: summary(1, 0, 0, 0) },
      { capability: 'aaa-first', summary: summary(0, 1, 0, 0) },
    ]);
    const lines = result.split('\n');
    expect(lines[0]).toMatch(/^aaa-first:/);
    expect(lines[1]).toMatch(/^zzz-last:/);
  });

  it('shows zero counts explicitly in each slot', () => {
    const result = formatSummary([
      { capability: 'cap', summary: summary(0, 0, 0, 0) },
    ]);
    expect(result).toBe('cap: +0 ~0 -0 ⇄0');
  });

  it('handles renamed count', () => {
    const result = formatSummary([
      { capability: 'cap', summary: summary(0, 0, 0, 3) },
    ]);
    expect(result).toBe('cap: +0 ~0 -0 ⇄3');
  });

  it('is byte-identical on repeated calls with same input', () => {
    const input = [
      { capability: 'cli-anchor', summary: summary(2, 1, 0, 0) },
      { capability: 'cli-archive', summary: summary(1, 0, 0, 0) },
    ];
    expect(formatSummary(input)).toBe(formatSummary(input));
  });

  it('does not mutate the input array order', () => {
    const input = [
      { capability: 'zzz', summary: summary(1, 0, 0, 0) },
      { capability: 'aaa', summary: summary(0, 1, 0, 0) },
    ];
    formatSummary(input);
    expect(input[0]!.capability).toBe('zzz');
    expect(input[1]!.capability).toBe('aaa');
  });
});
