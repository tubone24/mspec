// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/spec-viewer-search/spec.md
// Requirements implemented: FR-008
// Change: markdown-search-and-quick-access

import { describe, it, expect } from 'vitest';
import { extractSnippet } from './extractSnippet.js';

describe('extractSnippet', () => {
  const content = [
    'line 0',
    'line 1',
    'line 2',
    'This line has the KEYWORD in it',
    'line 4',
    'line 5',
    'line 6',
  ].join('\n');

  it('returns matched line ± 2 lines context when keyword found', () => {
    const result = extractSnippet(content, 'KEYWORD');
    expect(result).not.toBeNull();
    const lines = result!.split('\n');
    // Should include lines 1,2,3,4,5 (hitIndex=3, context=2)
    expect(lines).toHaveLength(5);
    expect(lines[2]).toBe('This line has the KEYWORD in it');
  });

  it('returns null when no match', () => {
    const result = extractSnippet(content, 'nonexistent');
    expect(result).toBeNull();
  });

  it('is case-insensitive', () => {
    const result1 = extractSnippet(content, 'keyword');
    const result2 = extractSnippet(content, 'KEYWORD');
    const result3 = extractSnippet(content, 'Keyword');
    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result3).not.toBeNull();
    expect(result1).toBe(result2);
    expect(result1).toBe(result3);
  });

  it('handles multi-token query using first token to find hit line', () => {
    const result = extractSnippet(content, 'KEYWORD extratoken');
    expect(result).not.toBeNull();
    expect(result).toContain('This line has the KEYWORD in it');
  });

  it('clips context at document boundaries (hit near top)', () => {
    const result = extractSnippet(content, 'line 0');
    expect(result).not.toBeNull();
    const lines = result!.split('\n');
    // hitIndex=0, context=2 → slice(-2, 3) → only lines 0,1,2
    expect(lines[0]).toBe('line 0');
    expect(lines).toHaveLength(3);
  });

  it('clips context at document boundaries (hit near bottom)', () => {
    const result = extractSnippet(content, 'line 6');
    expect(result).not.toBeNull();
    const lines = result!.split('\n');
    // hitIndex=6, context=2 → slice(4, 9) → lines 4,5,6
    expect(lines[lines.length - 1]).toBe('line 6');
    expect(lines).toHaveLength(3);
  });

  it('respects custom context parameter', () => {
    const result = extractSnippet(content, 'KEYWORD', 1);
    expect(result).not.toBeNull();
    const lines = result!.split('\n');
    // hitIndex=3, context=1 → lines 2,3,4
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe('This line has the KEYWORD in it');
  });
});
