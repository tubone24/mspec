// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-001, FR-002
// Change: mspec-web-ui
// @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/change-dashboard/spec.md
// Requirements implemented: FR-007
// Change: web-ui-viewer-improvements
// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
// Requirements implemented: FR-008, FR-009
// Change: web-ui-enhancements
// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/artifact-preview/spec.md
// Requirements implemented: FR-011
// Change: web-ui-enhancements

import { useQuery } from '@tanstack/react-query';

export interface StepState {
  id: string;
  state: 'done' | 'ready' | 'blocked' | 'skipped' | 'invalid';
}

export interface ChangeInfo {
  id: string;
  name: string;
  createdAt: string;
  mode: 'typo' | 'minor' | 'bugfix' | 'full';
  currentStep: string;
  steps: StepState[];
  isArchived: boolean;
}

export interface ArtifactFile {
  name: string;
  relativePath: string;
  type: 'markdown' | 'html' | 'json' | 'xml' | 'other';
  docType?: 'Reference' | 'Explanation' | 'How-to' | 'Tutorial';
}

export interface SpecCapability {
  capability: string;
}

export interface TestCase {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
}

export interface TestSuite {
  suiteName: string;
  format: 'playwright-json' | 'junit-xml';
  tests: TestCase[];
}

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export function useChanges(showArchived = false) {
  return useQuery<ChangeInfo[]>({
    queryKey: ['changes', showArchived],
    queryFn: () => get(`/changes${showArchived ? '?includeArchived=true' : ''}`),
    refetchInterval: 2000,
  });
}

export function useSpecs() {
  return useQuery<SpecCapability[]>({
    queryKey: ['specs'],
    queryFn: () => get('/specs'),
  });
}

export function useSpecContent(capability: string) {
  return useQuery<string>({
    queryKey: ['spec-content', capability],
    queryFn: async () => {
      const res = await fetch(`${BASE}/specs/${capability}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    },
    enabled: !!capability,
  });
}

export function useChange(id: string) {
  return useQuery<ChangeInfo>({
    queryKey: ['changes', id],
    queryFn: () => get(`/changes/${id}`),
    refetchInterval: 2000,
  });
}

export function useArtifacts(changeId: string) {
  return useQuery<ArtifactFile[]>({
    queryKey: ['artifacts', changeId],
    queryFn: () => get(`/changes/${changeId}/artifacts`),
  });
}

export function useArtifactContent(changeId: string, relativePath: string) {
  return useQuery<string>({
    queryKey: ['artifact-content', changeId, relativePath],
    queryFn: async () => {
      const res = await fetch(`${BASE}/changes/${changeId}/artifacts/${relativePath}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    },
    enabled: !!relativePath,
  });
}

export function useTestResults(changeId: string) {
  return useQuery<TestSuite[]>({
    queryKey: ['test-results', changeId],
    queryFn: () => get(`/changes/${changeId}/test-results`),
  });
}
