// @mspec-delta 2026-05-18-120853-fix-anchor-change-dir-lookup/specs/cli-anchor/spec.md
// Requirements implemented: FR-018
// Change: fix-anchor-change-dir-lookup
import { describe, it, expect } from 'vitest';
import { blankOutFences, blankOutHtmlComments, blankOutStringLiterals } from './text-mask.js';

describe('blankOutFences', () => {
  it('blanks backtick fenced block including fence lines', () => {
    const input = 'before\n```\ncode here\n```\nafter';
    const result = blankOutFences(input);
    expect(result).toBe('before\n   \n         \n   \nafter');
  });

  it('blanks tilde fenced block', () => {
    const input = 'a\n~~~\ncontent\n~~~\nb';
    const result = blankOutFences(input);
    expect(result).toBe('a\n   \n       \n   \nb');
  });

  it('preserves text outside fences unchanged', () => {
    const input = 'hello world\n```\nignored\n```\ngoodbye';
    const result = blankOutFences(input);
    expect(result.split('\n')[0]).toBe('hello world');
    expect(result.split('\n')[4]).toBe('goodbye');
  });

  it('blanks fenced block with language hint', () => {
    const input = '```typescript\nconst x = 1;\n```';
    const result = blankOutFences(input);
    // ```typescript = 13 chars, const x = 1; = 12 chars, ``` = 3 chars
    expect(result).toBe('             \n            \n   ');
  });

  it('preserves line count (linear in lines)', () => {
    const input = 'a\n```\nb\nc\n```\nd';
    const result = blankOutFences(input);
    expect(result.split('\n').length).toBe(input.split('\n').length);
  });

  it('handles multiple fenced blocks', () => {
    const input = '```\nfirst\n```\nmiddle\n~~~\nsecond\n~~~';
    const result = blankOutFences(input);
    const lines = result.split('\n');
    expect(lines[1]).toBe('     '); // "first" blanked
    expect(lines[3]).toBe('middle'); // preserved
    expect(lines[5]).toBe('      '); // "second" blanked
  });

  it('does not blank mismatched fence type (backtick open, tilde close leaves open)', () => {
    // backtick opened, tilde appears inside → not a close, stays in fence
    const input = '```\ninside\n~~~\nstill inside\n```\noutside';
    const result = blankOutFences(input);
    expect(result.split('\n')[5]).toBe('outside');
  });
});

describe('blankOutHtmlComments', () => {
  it('blanks inline HTML comment', () => {
    const input = 'before <!-- comment --> after';
    const result = blankOutHtmlComments(input);
    // '<!-- comment -->' = 16 chars → 16 spaces
    expect(result).toBe('before                  after');
  });

  it('preserves line count for multiline comment', () => {
    const input = '<!-- \nline1\nline2\n-->';
    const result = blankOutHtmlComments(input);
    expect(result.split('\n').length).toBe(input.split('\n').length);
  });

  it('preserves text outside comments', () => {
    const input = 'keep <!-- remove --> keep';
    const result = blankOutHtmlComments(input);
    expect(result.startsWith('keep ')).toBe(true);
    expect(result.endsWith(' keep')).toBe(true);
  });

  it('blanks multiple comments in one string', () => {
    const input = '<!-- a --> text <!-- b -->';
    const result = blankOutHtmlComments(input);
    expect(result.includes('text')).toBe(true);
    expect(result.indexOf('a')).toBe(-1);
    expect(result.indexOf('b')).toBe(-1);
  });

  it('preserves newlines within comment body', () => {
    const input = 'x\n<!-- multi\nline -->\ny';
    const result = blankOutHtmlComments(input);
    expect(result.split('\n').length).toBe(4);
    expect(result.split('\n')[0]).toBe('x');
    expect(result.split('\n')[3]).toBe('y');
  });
});

describe('blankOutStringLiterals', () => {
  it('blanks @mspec-delta inside backtick template literal', () => {
    const input =
      'const src = `\n@mspec-delta foo/specs/bar/spec.md\nRequirements implemented: FR-001\n`;\n';
    const result = blankOutStringLiterals(input);
    expect(result).not.toContain('@mspec-delta');
    expect(result.split('\n').length).toBe(input.split('\n').length);
  });

  it('does NOT mask @mspec-delta in a line comment', () => {
    const input = '// @mspec-delta foo/specs/bar/spec.md\n';
    const result = blankOutStringLiterals(input);
    expect(result).toBe(input);
  });

  it('preserves newlines inside template literal', () => {
    const input = '`\nline1\nline2\n`';
    const result = blankOutStringLiterals(input);
    expect(result.split('\n').length).toBe(input.split('\n').length);
  });

  it('handles escaped backtick inside template literal without closing it', () => {
    const input = '`hello \\` world` after';
    const result = blankOutStringLiterals(input);
    // everything between the outer backticks is masked; 'after' is outside
    expect(result.endsWith(' after')).toBe(true);
    expect(result).not.toContain('hello');
    expect(result).not.toContain('world');
  });

  it('preserves text outside template literals unchanged', () => {
    const input = 'before `masked` after';
    const result = blankOutStringLiterals(input);
    expect(result.startsWith('before ')).toBe(true);
    expect(result.endsWith(' after')).toBe(true);
  });
});
