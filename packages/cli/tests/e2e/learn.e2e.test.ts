// @mspec-delta 2026-05-26-131825-p4-learn-command/specs/cli-core/spec.md
// Requirements implemented: FR-006
// Change: p4-learn-command

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { learnCommand } from '../../src/commands/learn.js';
import type { AgentRunEntry } from '../../src/lib/agent-run-log.js';

interface Env {
  root: string;
}

async function setupArchive(
  changes: Record<string, { agentRuns?: AgentRunEntry[]; checklistMd?: string }>,
): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-learn-'));
  const archiveDir = join(root, 'changes', 'archive');
  await mkdir(archiveDir, { recursive: true });

  for (const [changeName, data] of Object.entries(changes)) {
    const changeDir = join(archiveDir, changeName);
    await mkdir(changeDir, { recursive: true });

    if (data.agentRuns && data.agentRuns.length > 0) {
      const lines = data.agentRuns.map((r) => JSON.stringify(r)).join('\n') + '\n';
      await writeFile(join(changeDir, '.agent-runs.jsonl'), lines, 'utf8');
    }
    if (data.checklistMd) {
      await writeFile(join(changeDir, 'checklist.md'), data.checklistMd, 'utf8');
    }
  }

  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(join(root, '.mspec', 'config.yaml'), 'locale: ja\n', 'utf8');
  return { root };
}

const AGENT_RUN_WITH_EDITS: AgentRunEntry = {
  step: 'self-review',
  change: '2026-05-01-000000-test-change',
  started_at: '2026-05-01T00:00:00Z',
  context_size_bytes: 12000,
  context_size_tokens: null,
  required_artifacts: ['design.md', 'checklist.md'],
  review_edits_count: 3,
};

const AGENT_RUN_NO_EDITS: AgentRunEntry = {
  step: 'checklist',
  change: '2026-05-01-000000-test-change',
  started_at: '2026-05-01T01:00:00Z',
  context_size_bytes: 8000,
  context_size_tokens: null,
  required_artifacts: ['design.md'],
  review_edits_count: 0,
};

const CHECKLIST_WITH_UNCHECKED_HUMAN = `# Checklist

- [x] FR-001 実装完了 <!-- verify: fr-001 -->
- [ ] FR-002 セキュリティレビュー <!-- verify: human -->
- [x] FR-003 動作確認 <!-- verify: fr-003 -->
- [ ] FR-004 エッジケース確認 <!-- verify: human -->
`;

const CHECKLIST_ALL_CHECKED = `# Checklist

- [x] FR-001 実装完了 <!-- verify: fr-001 -->
- [x] FR-002 セキュリティレビュー <!-- verify: human -->
`;

describe('FR-006: mspec learn コマンド', () => {
  let env: Env;

  beforeEach(async () => {
    env = await setupArchive({});
    vi.spyOn(process, 'cwd').mockReturnValue(env.root);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('Scenario 3: archive が空の場合は patterns: [] を出力して exit 0', async () => {
    const lines: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((data) => {
      lines.push(typeof data === 'string' ? data : data.toString());
      return true;
    });

    await learnCommand({});

    const output = JSON.parse(lines.join('')) as { patterns: unknown[] };
    expect(output.patterns).toHaveLength(0);
    expect(process.exitCode).not.toBe(1);
  });

  it('Scenario 1: review_edits_count > 0 のエントリから review-blocker パターンを抽出する', async () => {
    await rm(env.root, { recursive: true, force: true });
    env = await setupArchive({
      '2026-05-01-000000-test-change': {
        agentRuns: [AGENT_RUN_WITH_EDITS, AGENT_RUN_NO_EDITS],
      },
    });
    vi.spyOn(process, 'cwd').mockReturnValue(env.root);

    const lines: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((data) => {
      lines.push(typeof data === 'string' ? data : data.toString());
      return true;
    });

    await learnCommand({});

    const output = JSON.parse(lines.join('')) as {
      patterns: Array<{ type: string; change: string; step: string; edits: number }>;
    };
    const blockers = output.patterns.filter((p) => p.type === 'review-blocker');
    expect(blockers).toHaveLength(1);
    expect(blockers[0]?.change).toBe('2026-05-01-000000-test-change');
    expect(blockers[0]?.step).toBe('self-review');
    expect(blockers[0]?.edits).toBe(3);
  });

  it('Scenario 2: verify: human 未チェック項目から unchecked-human-verify パターンを抽出する', async () => {
    await rm(env.root, { recursive: true, force: true });
    env = await setupArchive({
      '2026-05-02-000000-test-change-b': {
        checklistMd: CHECKLIST_WITH_UNCHECKED_HUMAN,
      },
      '2026-05-03-000000-test-change-c': {
        checklistMd: CHECKLIST_ALL_CHECKED,
      },
    });
    vi.spyOn(process, 'cwd').mockReturnValue(env.root);

    const lines: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((data) => {
      lines.push(typeof data === 'string' ? data : data.toString());
      return true;
    });

    await learnCommand({});

    const output = JSON.parse(lines.join('')) as {
      patterns: Array<{ type: string; change: string; items: string[] }>;
    };
    const humanVerify = output.patterns.filter((p) => p.type === 'unchecked-human-verify');
    expect(humanVerify).toHaveLength(1);
    expect(humanVerify[0]?.change).toBe('2026-05-02-000000-test-change-b');
    expect(humanVerify[0]?.items).toHaveLength(2);
  });
});
