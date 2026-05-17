// @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-016
// Change: claude-core-completion

export interface Principle {
  id: string;
  name: string;
}

const PRINCIPLE_H3_RE = /^###\s+((?:I{1,3}|IV|V|VI{0,3}|IX|X))\.\s+(.+)$/;

/**
 * Extract `### <Roman>. <Name>` H3 headings from a constitution file.
 * Returns them in document order as `{ id, name }` pairs.
 * Separated from `commands/constitution.ts` to keep this helper LLM-free (D4).
 */
export function extractPrinciples(contents: string): Principle[] {
  const results: Principle[] = [];
  for (const line of contents.split('\n')) {
    const m = PRINCIPLE_H3_RE.exec(line.trim());
    if (m) {
      results.push({ id: m[1]!, name: m[2]!.trim() });
    }
  }
  return results;
}
