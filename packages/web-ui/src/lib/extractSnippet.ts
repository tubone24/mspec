// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/spec-viewer-search/spec.md
// Requirements implemented: FR-008, FR-009
// Change: markdown-search-and-quick-access

export function extractSnippet(
  content: string,
  query: string,
  context = 2,
): string | null {
  const firstToken = query.trim().split(/\s+/)[0];
  if (!firstToken) return null;

  const needle = firstToken.toLowerCase();
  const lines = content.split('\n');

  const hitIndex = lines.findIndex((line) => line.toLowerCase().includes(needle));
  if (hitIndex === -1) return null;

  const start = Math.max(0, hitIndex - context);
  const end = Math.min(lines.length, hitIndex + context + 1);
  return lines.slice(start, end).join('\n');
}
