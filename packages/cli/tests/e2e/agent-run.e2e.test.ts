// @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: agent-experience-manifest

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { agentRunRecordCommand } from '../../src/commands/agent-run.js';

const WORKFLOW_YAML = `version: 1
name: mspec-test
steps:
  - id: new
    command: /mspec:new
    skill: mspec-new
    produces: [readme.md]
    block: true
    removable: false
  - id: research
    command: /mspec:research
    skill: mspec-research
    produces: [research.md]
    subagent: true
    block: true
    removable: false
  - id: implement
    command: /mspec:implement
    skill: mspec-implement
    produces: []
    block: true
    removable: false
`;

async function setupProject(cwd: string, changeName: string): Promise<string> {
  await mkdir(join(cwd, '.mspec'), { recursive: true });
  await writeFile(join(cwd, '.mspec', 'workflow.yaml'), WORKFLOW_YAML);
  const changeDir = join(cwd, 'changes', changeName);
  await mkdir(changeDir, { recursive: true });
  await writeFile(join(changeDir, 'proposal.md'), '# Proposal\n\nContent.\n');
  return changeDir;
}

describe('agent-run record — FR-001: Subagent Run Logger Injection', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'mspec-agent-run-e2e-'));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it('FR-001 Scenario: 正常な subagent 実行後のログ追記', async () => {
    const changeDir = await setupProject(cwd, 'test-change');

    await agentRunRecordCommand('research', {
      change: 'test-change',
      bytes: 4821,
      artifacts: ['proposal.md'],
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

  it('FR-001 Scenario: change ディレクトリが存在しない場合のフォールバック', async () => {
    await setupProject(cwd, 'test-change');

    await expect(
      agentRunRecordCommand('research', {
        change: 'non-existent-change',
        bytes: 100,
        artifacts: [],
        cwd,
      }),
    ).resolves.not.toThrow();
  });
});

describe('agent-run record — FR-002: Log Entry Schema', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'mspec-agent-run-e2e-'));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it('FR-002 Scenario: 通常ステップのログエントリ（7フィールド + review_edits_count=null）', async () => {
    const changeDir = await setupProject(cwd, 'test-change');

    await agentRunRecordCommand('research', {
      change: 'test-change',
      bytes: 4821,
      artifacts: ['proposal.md'],
      cwd,
    });

    const entry = JSON.parse(
      (await readFile(join(changeDir, '.agent-runs.jsonl'), 'utf8')).trim(),
    ) as Record<string, unknown>;

    expect(entry['step']).toBe('research');
    expect(entry['change']).toBe('test-change');
    expect(entry['context_size_bytes']).toBe(4821);
    expect(entry['context_size_tokens']).toBeNull();
    expect(entry['review_edits_count']).toBeNull();
  });

  it('FR-002 Scenario: self-review ステップのログエントリ（review_edits_count に blocker 数）', async () => {
    const changeDir = await setupProject(cwd, 'test-change');

    await agentRunRecordCommand('self-review', {
      change: 'test-change',
      bytes: 22180,
      artifacts: ['design.md', 'tasks.md'],
      edits: 2,
      cwd,
    });

    const entry = JSON.parse(
      (await readFile(join(changeDir, '.agent-runs.jsonl'), 'utf8')).trim(),
    ) as Record<string, unknown>;

    expect(entry['step']).toBe('self-review');
    expect(entry['review_edits_count']).toBe(2);
  });
});

describe('agent-run record — FR-003: Log Sanitization', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'mspec-agent-run-e2e-'));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it('FR-003 Scenario: 許可されたフィールドのみが .agent-runs.jsonl に出力される', async () => {
    const changeDir = await setupProject(cwd, 'test-change');

    await agentRunRecordCommand('checklist', {
      change: 'test-change',
      bytes: 5000,
      artifacts: ['design.md'],
      cwd,
    });

    const entry = JSON.parse(
      (await readFile(join(changeDir, '.agent-runs.jsonl'), 'utf8')).trim(),
    ) as Record<string, unknown>;

    const allowedKeys = [
      'step',
      'change',
      'started_at',
      'context_size_bytes',
      'context_size_tokens',
      'required_artifacts',
      'review_edits_count',
    ];
    for (const key of Object.keys(entry)) {
      expect(allowedKeys).toContain(key);
    }
    expect(Object.keys(entry)).toHaveLength(allowedKeys.length);
  });
});
