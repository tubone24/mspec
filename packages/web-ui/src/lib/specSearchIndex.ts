// @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
// Requirements implemented: FR-002
// Change: spec-viewer-fulltext-search

import MiniSearch from 'minisearch';
import { tokenize } from './searchIndex.js';

export interface SpecSearchDocument {
  id: string;         // capability name (unique key)
  capability: string;
  content: string;    // full spec.md text
}

export function createSpecSearchIndex(): MiniSearch<SpecSearchDocument> {
  return new MiniSearch<SpecSearchDocument>({
    fields: ['capability', 'content'],
    storeFields: ['capability'],
    tokenize,
    searchOptions: {
      tokenize,
      boost: { capability: 3, content: 1 },
    },
  });
}
