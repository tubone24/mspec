// @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
// Requirements implemented: FR-003
// Change: agent-experience-manifest

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sanitizeEntry, type AgentRunEntry } from './agent-run-log.js';

describe('sanitizeEntry', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'mspec-agent-run-log-test-'));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it('T201: strips prompt_body, secrets, env_vars from entry (FR-003)', () => {
    const dirty = {
      step: 'research',
      change: 'my-change',
      started_at: '2026-05-26T03:00:00.000Z',
      context_size_bytes: 100,
      context_size_tokens: null,
      required_artifacts: ['proposal.md'],
      review_edits_count: null,
      prompt_body: 'SECRET PROMPT TEXT — MUST NOT BE LOGGED',
      secrets: 'my-api-key-abc123',
      env_vars: 'SECRET=super-secret',
    } as unknown as AgentRunEntry & Record<string, unknown>;

    const sanitized = sanitizeEntry(dirty) as Record<string, unknown>;

    expect(sanitized['prompt_body']).toBeUndefined();
    expect(sanitized['secrets']).toBeUndefined();
    expect(sanitized['env_vars']).toBeUndefined();
  });

  it('T202: output keys are exactly the 7 allowed fields (FR-003)', () => {
    const entry: AgentRunEntry = {
      step: 'research',
      change: 'my-change',
      started_at: '2026-05-26T03:00:00.000Z',
      context_size_bytes: 100,
      context_size_tokens: null,
      required_artifacts: ['proposal.md'],
      review_edits_count: null,
    };

    const sanitized = sanitizeEntry(entry);
    const allowedKeys = [
      'step',
      'change',
      'started_at',
      'context_size_bytes',
      'context_size_tokens',
      'required_artifacts',
      'review_edits_count',
    ];
    const actualKeys = Object.keys(sanitized);

    for (const key of actualKeys) {
      expect(allowedKeys).toContain(key);
    }
    expect(actualKeys.length).toBe(allowedKeys.length);
  });
});
