// @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: agent-experience-manifest

import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ProjectPaths } from '../workflow/paths.js';

export interface AgentRunEntry {
  step: string;
  change: string;
  started_at: string;
  context_size_bytes: number | null;
  context_size_tokens: null;
  required_artifacts: string[];
  review_edits_count: number | null;
}

const ALLOWED_KEYS: readonly (keyof AgentRunEntry)[] = [
  'step',
  'change',
  'started_at',
  'context_size_bytes',
  'context_size_tokens',
  'required_artifacts',
  'review_edits_count',
];

export function sanitizeEntry(entry: AgentRunEntry): AgentRunEntry {
  const safe: Partial<AgentRunEntry> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in entry) {
      (safe as Record<string, unknown>)[key] = (entry as Record<string, unknown>)[key];
    }
  }
  return safe as AgentRunEntry;
}

export function agentRunLogPath(paths: ProjectPaths, changeName: string): string {
  return join(paths.changesDir, changeName, '.agent-runs.jsonl');
}

export async function appendAgentRun(
  paths: ProjectPaths,
  entry: AgentRunEntry,
): Promise<void> {
  const sanitized = sanitizeEntry(entry);
  const p = agentRunLogPath(paths, entry.change);
  await mkdir(dirname(p), { recursive: true });
  await appendFile(p, JSON.stringify(sanitized) + '\n', 'utf8');
}
