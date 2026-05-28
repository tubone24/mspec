// @mspec-delta 2026-05-27-000005-full-text-search/specs/search-index/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: full-text-search
// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/web-ui-search/spec.md
// Requirements implemented: FR-004
// Change: markdown-search-and-quick-access

import { useState, useEffect, useRef } from 'react';
import type MiniSearch from 'minisearch';
import { createSearchIndex, type SearchDocument } from '../lib/searchIndex.js';
import type { ChangeInfo, ArtifactFile } from '../api/client.js';

export interface SearchIndexState {
  index: MiniSearch<SearchDocument> | null;
  contentCache: Map<string, string>;
  isBuilding: boolean;
  error: Error | null;
}

const CONCURRENCY = 5;
const BASE = '/api';

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

async function buildIndex(
  changes: ChangeInfo[],
): Promise<{ index: MiniSearch<SearchDocument>; contentCache: Map<string, string> }> {
  const idx = createSearchIndex();
  const contentCache = new Map<string, string>();

  // Collect (changeId, artifact) pairs for markdown-only artifacts
  const pairs: Array<{ changeId: string; relativePath: string }> = [];
  for (const change of changes) {
    const artifacts = await fetchJson<ArtifactFile[]>(
      `${BASE}/changes/${change.id}/artifacts`,
    );
    for (const a of artifacts) {
      if (a.type === 'markdown') {
        pairs.push({ changeId: change.id, relativePath: a.relativePath });
      }
    }
  }

  // Fetch artifact content with concurrency limit (D-02)
  for (let i = 0; i < pairs.length; i += CONCURRENCY) {
    const batch = pairs.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ changeId, relativePath }) => {
        try {
          const content = await fetchText(
            `${BASE}/changes/${changeId}/artifacts/${relativePath}`,
          );
          const change = changes.find((c) => c.id === changeId)!;
          const doc: SearchDocument = {
            id: `${changeId}:${relativePath}`,
            changeId,
            name: change.name,
            title: change.title ?? change.name,
            summary: change.summary ?? '',
            tags: (change.tags ?? []).join(' '),
            content,
          };
          idx.add(doc);
          // accumulate content keyed by changeId for snippet extraction
          const existing = contentCache.get(changeId);
          contentCache.set(changeId, existing ? `${existing}\n${content}` : content);
        } catch {
          // Skip individual artifact fetch failures silently
        }
      }),
    );
  }

  return { index: idx, contentCache };
}

export function useSearchIndex(changes: ChangeInfo[]): SearchIndexState {
  const [state, setState] = useState<SearchIndexState>({
    index: null,
    contentCache: new Map(),
    isBuilding: true,
    error: null,
  });

  // D-06: stable key — only rebuild when the set of change IDs changes
  const changeIds = changes.map((c) => c.id).join(',');
  const prevIdsRef = useRef<string>('');

  useEffect(() => {
    if (changeIds === prevIdsRef.current) return; // same set — skip rebuild
    prevIdsRef.current = changeIds;

    if (changes.length === 0) {
      setState({ index: null, contentCache: new Map(), isBuilding: false, error: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, isBuilding: true, error: null }));

    buildIndex(changes)
      .then(({ index, contentCache }) => {
        if (!cancelled) setState({ index, contentCache, isBuilding: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({ index: null, contentCache: new Map(), isBuilding: false, error: err instanceof Error ? err : new Error(String(err)) });
      });

    return () => { cancelled = true; };
  }, [changeIds]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
