// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md
// Requirements implemented: FR-018, FR-019, FR-020
// Change: lightweight-change-mode

const MODE_RE    = /^>\s*Mode:\s*(.+?)\s*$/m;
const REQUEST_RE = /^##\s+Request\s*\n([\s\S]*?)(?=\n##\s|\s*$)/m;
const TITLE_RE   = /^#\s+(.+?)\s*$/m;

/** Extract the `> Mode: <value>` blockquote field from readme.md content. */
export function parseMode(content: string): string | null {
  const m = MODE_RE.exec(content);
  return m ? m[1]! : null;
}

/** Extract the H1 heading from readme.md content as a human-readable title. */
export function parseTitle(content: string): string | null {
  const m = TITLE_RE.exec(content);
  return m ? m[1]! : null;
}

/** Extract the first paragraph of the `## Request` section as a summary. */
export function parseSummary(content: string): string | null {
  const m = REQUEST_RE.exec(content);
  if (!m) return null;
  const firstParagraph = m[1]!
    .trim()
    .split(/\n\n+/)[0]
    ?.trim()
    .replace(/\n+/g, ' ') ?? null;
  return firstParagraph || null;
}
