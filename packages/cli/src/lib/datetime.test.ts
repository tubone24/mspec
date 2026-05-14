import { describe, it, expect } from 'vitest';
import { changeDirStamp, makeChangeDirName } from './datetime.js';

describe('changeDirStamp', () => {
  it('produces YYYY-MM-DD-HHMMSS in UTC', () => {
    const d = new Date('2026-05-14T09:30:15.123Z');
    expect(changeDirStamp(d)).toBe('2026-05-14-093015');
  });

  it('pads single-digit time components', () => {
    const d = new Date('2026-01-02T03:04:05Z');
    expect(changeDirStamp(d)).toBe('2026-01-02-030405');
  });
});

describe('makeChangeDirName', () => {
  it('appends feature-kebab', () => {
    const d = new Date('2026-05-14T09:30:15Z');
    expect(makeChangeDirName('apply-css', d)).toBe('2026-05-14-093015-apply-css');
  });
});
