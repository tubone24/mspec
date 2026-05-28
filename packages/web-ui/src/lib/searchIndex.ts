// @mspec-delta 2026-05-27-000005-full-text-search/specs/full-text-search/spec.md
// Requirements implemented: FR-001, FR-002
// Change: full-text-search

import MiniSearch from 'minisearch';

export interface SearchDocument {
  id: string;       // `${changeId}:${relativePath}`
  changeId: string;
  name: string;
  title: string;
  summary: string;
  tags: string;     // space-joined tag list
  content: string;  // artifact body text
}

const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });

export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const s of segmenter.segment(text)) {
    if (!s.isWordLike) continue;
    const word = s.segment.toLowerCase();
    tokens.push(word);
    // Also split on hyphens so "full-text-search" → ["full", "text", "search"]
    if (word.includes('-')) {
      for (const part of word.split('-')) {
        if (part.length > 0) tokens.push(part);
      }
    }
  }
  return tokens;
}

export function createSearchIndex(): MiniSearch<SearchDocument> {
  return new MiniSearch<SearchDocument>({
    fields: ['name', 'title', 'summary', 'tags', 'content'],
    storeFields: ['changeId'],
    tokenize,
    searchOptions: {
      tokenize,
      boost: { name: 3, title: 3, summary: 2, tags: 2, content: 1 },
    },
  });
}
