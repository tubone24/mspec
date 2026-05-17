import { describe, it, expect } from 'vitest';
import { blankOutFences, blankOutHtmlComments } from './text-mask.js';

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
