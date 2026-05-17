// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md
// Requirements implemented: FR-018, FR-019, FR-020
// Change: lightweight-change-mode

import { describe, it, expect } from 'vitest';
import { parseMode } from './readme-parser.js';

describe('parseMode', () => {
  it('extracts mode from > Mode: typo line', () => {
    const content = '# Change\n\n> Mode: typo\n> Status: active\n';
    expect(parseMode(content)).toBe('typo');
  });

  it('extracts mode from > Mode: minor', () => {
    expect(parseMode('> Mode: minor\n')).toBe('minor');
  });

  it('extracts mode from > Mode: bugfix', () => {
    expect(parseMode('> Mode: bugfix\n')).toBe('bugfix');
  });

  it('returns null when no Mode field', () => {
    const content = '# Change\n\n> Status: active\n> Created: 2026-05-16\n';
    expect(parseMode(content)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseMode('')).toBeNull();
  });

  it('trims whitespace around mode value', () => {
    expect(parseMode('> Mode:  typo  \n')).toBe('typo');
  });

  it('is case-sensitive (returns as-is)', () => {
    expect(parseMode('> Mode: Typo\n')).toBe('Typo');
  });
});
