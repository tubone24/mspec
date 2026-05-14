import { describe, it, expect } from 'vitest';
import { parseAnchors } from './anchor.js';

describe('parseAnchors', () => {
  it('parses a 3-line TypeScript docstring anchor', () => {
    const src = `/**
 * @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
 * Requirements implemented: FR-005, FR-007
 * Change: apply-css
 */
export function applyCss() {}
`;
    const { anchors, warnings } = parseAnchors(src, 'src/applyCss.ts');
    expect(warnings).toEqual([]);
    expect(anchors).toHaveLength(1);
    expect(anchors[0]).toMatchObject({
      change_dir: '2026-05-14-093015-apply-css',
      capability: 'theme-engine',
      requirements: ['FR-005', 'FR-007'],
      change: 'apply-css',
      source_file: 'src/applyCss.ts',
      source_line: 2,
    });
    expect(anchors[0]?.delta_spec_path).toBe(
      '2026-05-14-093015-apply-css/specs/theme-engine/spec.md',
    );
  });

  it('parses a Python triple-quoted docstring anchor', () => {
    const src = `"""
@mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
Requirements implemented: FR-005
Change: apply-css
"""
def apply_css(): pass
`;
    const { anchors, warnings } = parseAnchors(src, 'apply_css.py');
    expect(warnings).toEqual([]);
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.requirements).toEqual(['FR-005']);
  });

  it('parses Rust/Go line-comment anchors', () => {
    const src = `// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
// Requirements implemented: FR-005
// Change: apply-css
fn apply_css() {}
`;
    const { anchors } = parseAnchors(src, 'apply_css.rs');
    expect(anchors).toHaveLength(1);
  });

  it('reports a truncated anchor (only 2 of 3 lines)', () => {
    const src = `// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
// Requirements implemented: FR-005
fn apply_css() {}
`;
    const { anchors, warnings } = parseAnchors(src, 'apply_css.rs');
    expect(anchors).toHaveLength(0);
    expect(warnings[0]).toMatch(/incomplete anchor block/);
  });

  it('ignores anchors past the first 30 lines', () => {
    const filler = Array.from({ length: 31 }, () => '// filler').join('\n');
    const src = `${filler}
// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
// Requirements implemented: FR-005
// Change: apply-css
fn apply_css() {}
`;
    const { anchors } = parseAnchors(src, 'apply_css.rs');
    expect(anchors).toHaveLength(0);
  });

  it('rejects malformed change_dir without HHMMSS', () => {
    const src = `// @mspec-delta 2026-05-14-apply-css/specs/theme-engine/spec.md
// Requirements implemented: FR-005
// Change: apply-css
`;
    const { anchors, warnings } = parseAnchors(src, 'x.ts');
    expect(anchors).toHaveLength(0);
    expect(warnings[0]).toMatch(/malformed/);
  });

  it('supports multiple anchor blocks in the same head window', () => {
    const src = `/**
 * @mspec-delta 2026-05-14-093015-feature-a/specs/cap-a/spec.md
 * Requirements implemented: FR-001
 * Change: feature-a
 *
 * @mspec-delta 2026-05-14-093015-feature-a/specs/cap-b/spec.md
 * Requirements implemented: FR-002
 * Change: feature-a
 */
`;
    const { anchors } = parseAnchors(src, 'multi.ts');
    expect(anchors).toHaveLength(2);
    expect(anchors[0]?.capability).toBe('cap-a');
    expect(anchors[1]?.capability).toBe('cap-b');
  });
});
