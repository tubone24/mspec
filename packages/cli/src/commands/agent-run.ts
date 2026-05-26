// @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
// Requirements implemented: FR-001, FR-002
// Change: agent-experience-manifest

import { projectPaths } from '../workflow/paths.js';
import { findChange } from '../lib/change-discovery.js';
import { appendAgentRun, type AgentRunEntry } from '../lib/agent-run-log.js';

export interface AgentRunRecordOptions {
  change?: string;
  bytes?: number;
  artifacts?: string[];
  edits?: number;
  cwd?: string;
}

export async function agentRunRecordCommand(
  stepId: string,
  opts: AgentRunRecordOptions,
): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const paths = projectPaths(cwd);

  const changeName = opts.change;
  if (!changeName) return;

  const change = await findChange(paths, changeName).catch(() => null);
  if (!change || change.isArchived) return;

  const entry: AgentRunEntry = {
    step: stepId,
    change: changeName,
    started_at: new Date().toISOString(),
    context_size_bytes: opts.bytes ?? null,
    context_size_tokens: null,
    required_artifacts: opts.artifacts ?? [],
    review_edits_count: opts.edits ?? null,
  };

  await appendAgentRun(paths, entry);
}
