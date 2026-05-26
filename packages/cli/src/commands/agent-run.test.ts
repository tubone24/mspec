// @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
// Requirements implemented: FR-001, FR-002
// Change: agent-experience-manifest

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { agentRunRecordCommand } from './agent-run.js';

async function setupProject(cwd: string): Promise<string> {
  await mkdir(join(cwd, '.mspec'), { recursive: true });
  await writeFile(
    join(cwd, '.mspec', 'workflow.yaml'),
    `version: 1\nname: test\nsteps:\n  - id: new\n    command: /mspec:new\n    skill: mspec-new\n    produces: [readme.md]\n    block: true\n    removable: false\n`,
  );
  const changeDir = join(cwd, 'changes', 'test-change');
  await mkdir(changeDir, { recursive: true });
  await writeFile(join(changeDir, 'proposal.md'), '# Test\n\nContent here.\n');
  return changeDir;
}

describe('agentRunRecordCommand', () => {
  let cwd: string;
  let changeDir: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'mspec-agent-run-test-'));
    changeDir = await setupProject(cwd);
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it('T101: appends one JSONL line to .agent-runs.jsonl (FR-001)', async () => {
    await agentRunRecordCommand('research', {
      change: 'test-change',
      bytes: 100,
      artifacts: ['proposal.md'],
      edits: undefined,
      cwd,
    });

    const jsonlPath = join(changeDir, '.agent-runs.jsonl');
    const content = await readFile(jsonlPath, 'utf8');
    const lines = content
      .trim()
      .split('\n')
      .filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);
  });

  it('T102: graceful skip when change dir not found (FR-001)', async () => {
    await expect(
      agentRunRecordCommand('research', {
        change: 'non-existent-change',
        bytes: 100,
        artifacts: ['proposal.md'],
        edits: undefined,
        cwd,
      }),
    ).resolves.not.toThrow();

    const jsonlPath = join(changeDir, '.agent-runs.jsonl');
    const exists = await readFile(jsonlPath, 'utf8')
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it('T103: log entry schema has all 7 fields with correct types (FR-002)', async () => {
    await agentRunRecordCommand('research', {
      change: 'test-change',
      bytes: 4821,
      artifacts: ['proposal.md', 'specs/agent-runner/spec.md'],
      edits: undefined,
      cwd,
    });

    const jsonlPath = join(changeDir, '.agent-runs.jsonl');
    const content = await readFile(jsonlPath, 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;

    expect(entry['step']).toBe('research');
    expect(entry['change']).toBe('test-change');
    expect(typeof entry['started_at']).toBe('string');
    expect(entry['context_size_bytes']).toBe(4821);
    expect(entry['context_size_tokens']).toBeNull();
    expect(entry['required_artifacts']).toEqual(['proposal.md', 'specs/agent-runner/spec.md']);
    expect(entry['review_edits_count']).toBeNull();
  });

  it('T104: review_edits_count records blocker count for self-review (FR-002)', async () => {
    await agentRunRecordCommand('self-review', {
      change: 'test-change',
      bytes: 22180,
      artifacts: ['proposal.md', 'design.md'],
      edits: 3,
      cwd,
    });

    const jsonlPath = join(changeDir, '.agent-runs.jsonl');
    const content = await readFile(jsonlPath, 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;

    expect(entry['step']).toBe('self-review');
    expect(entry['review_edits_count']).toBe(3);
  });

  it('T304: context_size_bytes equals the --bytes argument (FR-002)', async () => {
    const expectedBytes = 9999;
    await agentRunRecordCommand('checklist', {
      change: 'test-change',
      bytes: expectedBytes,
      artifacts: ['proposal.md'],
      edits: undefined,
      cwd,
    });

    const jsonlPath = join(changeDir, '.agent-runs.jsonl');
    const content = await readFile(jsonlPath, 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;

    expect(entry['context_size_bytes']).toBe(expectedBytes);
  });
});
