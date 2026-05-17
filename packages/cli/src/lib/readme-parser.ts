// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md
// Requirements implemented: FR-018, FR-019, FR-020
// Change: lightweight-change-mode

const MODE_RE = /^>\s*Mode:\s*(.+?)\s*$/m;

/** Extract the `> Mode: <value>` blockquote field from readme.md content. */
export function parseMode(content: string): string | null {
  const m = MODE_RE.exec(content);
  return m ? m[1]! : null;
}
