// @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-archive/spec.md
// Requirements implemented: FR-013
// Change: claude-core-completion

import type { MergeSummary } from './archive-merger.js';

export interface SummaryEntry {
  capability: string;
  summary: MergeSummary;
}

/**
 * Format a list of capability merge summaries as `+a ~m -r ⇄n` lines.
 * Capabilities are sorted lexicographically so output is byte-identical across
 * repeated calls with the same input (P2: deterministic, LLM-free).
 */
export function formatSummary(entries: SummaryEntry[]): string {
  return [...entries]
    .sort((a, b) => a.capability.localeCompare(b.capability))
    .map(({ capability, summary: s }) =>
      `${capability}: +${s.added} ~${s.modified} -${s.removed} ⇄${s.renamed}`,
    )
    .join('\n');
}
