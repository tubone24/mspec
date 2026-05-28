// @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
// Requirements implemented: FR-002
// Change: spec-viewer-fulltext-search
// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/spec-viewer-search/spec.md
// Requirements implemented: FR-008
// Change: markdown-search-and-quick-access

import { useState, useEffect, useRef } from 'react';
import type MiniSearch from 'minisearch';
import { createSpecSearchIndex, type SpecSearchDocument } from '../lib/specSearchIndex.js';
import type { SpecCapability } from '../api/client.js';

export interface SpecSearchIndexState {
  index: MiniSearch<SpecSearchDocument> | null;
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

async function buildSpecIndex(
  capabilities: SpecCapability[],
): Promise<{ index: MiniSearch<SpecSearchDocument>; contentCache: Map<string, string> }> {
  const idx = createSpecSearchIndex();
  const contentCache = new Map<string, string>();

  for (let i = 0; i < capabilities.length; i += CONCURRENCY) {
    const batch = capabilities.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ capability }) => {
        try {
          const content = await fetchText(`${BASE}/specs/${capability}`);
          idx.add({ id: capability, capability, content });
          contentCache.set(capability, content);
        } catch {
          // skip individual fetch failures silently
        }
      }),
    );
  }

  return { index: idx, contentCache };
}

export function useSpecSearchIndex(capabilities: SpecCapability[]): SpecSearchIndexState {
  const [state, setState] = useState<SpecSearchIndexState>({
    index: null,
    contentCache: new Map(),
    isBuilding: true,
    error: null,
  });

  const capabilityIds = capabilities.map((c) => c.capability).join(',');
  const prevIdsRef = useRef<string>('');

  useEffect(() => {
    if (capabilityIds === prevIdsRef.current) return;
    prevIdsRef.current = capabilityIds;

    if (capabilities.length === 0) {
      setState({ index: null, contentCache: new Map(), isBuilding: false, error: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, isBuilding: true, error: null }));

    buildSpecIndex(capabilities)
      .then(({ index, contentCache }) => {
        if (!cancelled) setState({ index, contentCache, isBuilding: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({ index: null, contentCache: new Map(), isBuilding: false, error: err instanceof Error ? err : new Error(String(err)) });
      });

    return () => { cancelled = true; };
  }, [capabilityIds]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
