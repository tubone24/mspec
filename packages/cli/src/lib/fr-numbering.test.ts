import { describe, it, expect } from 'vitest';
import { scanFrIdsFromContents, nextFrId } from './fr-numbering.js';

describe('scanFrIdsFromContents', () => {
  it('finds all FR-NNN headings', () => {
    const src = `# Spec

### Requirement: FR-001 — A
text
### Requirement: FR-005 — B
text
### Requirement: FR-003 — C
`;
    const { maxId, ids } = scanFrIdsFromContents(src);
    expect(ids).toEqual(['FR-001', 'FR-005', 'FR-003']);
    expect(maxId).toBe(5);
  });

  it('returns 0/[] for empty input', () => {
    expect(scanFrIdsFromContents('')).toEqual({ maxId: 0, ids: [] });
  });

  it('ignores non-Requirement H3 headings', () => {
    const src = `### Some other heading
### Requirement: FR-002 — X
`;
    const { maxId, ids } = scanFrIdsFromContents(src);
    expect(ids).toEqual(['FR-002']);
    expect(maxId).toBe(2);
  });
});

describe('nextFrId', () => {
  it('formats FR with 3-digit zero-padding', () => {
    expect(nextFrId(0)).toBe('FR-001');
    expect(nextFrId(4)).toBe('FR-005');
    expect(nextFrId(99)).toBe('FR-100');
  });
});
