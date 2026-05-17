// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-019, FR-020, FR-021
// Change: lightweight-change-mode

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { continueCommand } from '../../src/commands/continue.js';
import { skipCommand } from '../../src/commands/skip.js';

async function setupProject(readmeMode?: string): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-lwmode-e2e-'));
  await mkdir(join(cwd, '.mspec'), { recursive: true });

  const requiredSteps = [
    `  - id: new\n    command: /mspec:new\n    skill: mspec-new\n    produces: [readme.md]\n    block: true\n    removable: false`,
    `  - id: proposal\n    command: /mspec:proposal\n    skill: mspec-proposal\n    produces: [proposal.md]\n    block: true\n    removable: false\n    skippable: true`,
    `  - id: delta\n    command: /mspec:delta\n    skill: mspec-delta\n    produces: [specs/spec.md]\n    block: false\n    removable: false`,
    `  - id: research\n    command: /mspec:research\n    skill: mspec-research\n    produces: [research.md]\n    block: true\n    removable: true\n    skippable: true`,
    `  - id: tasks\n    command: /mspec:tasks\n    skill: mspec-tasks\n    produces: [tasks.md]\n    block: true\n    removable: false`,
    `  - id: implement\n    command: /mspec:implement\n    skill: mspec-implement\n    produces: []\n    block: true\n    removable: false`,
    `  - id: archive\n    command: /mspec:archive\n    skill: mspec-archive\n    produces: []\n    block: false\n    removable: false`,
  ].join('\n');

  await writeFile(
    join(cwd, '.mspec', 'workflow.yaml'),
    `version: 1\nname: test\nsteps:\n${requiredSteps}\nmodes:\n  typo:\n    skip: ['proposal']\n    force: []\n  bugfix:\n    skip: ['proposal']\n    force: ['research']`,
  );

  const changeDir = join(cwd, 'changes', '2026-01-01-test-change');
  await mkdir(changeDir, { recursive: true });
  const modeField = readmeMode ? `> Mode: ${readmeMode}\n` : '';
  await writeFile(
    join(changeDir, 'readme.md'),
    `# Test\n\n${modeField}> Status: active\n`,
  );

  return cwd;
}

describe('FR-019: モード由来スキップ (state-engine + continue)', () => {
  it('typo モードで proposal が state:skipped になり delta が current_step になる', async () => {
    const cwd = await setupProject('typo');
    let capturedJson = '';
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array) => {
      if (typeof chunk === 'string') capturedJson += chunk;
      return true;
    };

    try {
      await continueCommand({ change: '2026-01-01-test-change', json: true, cwd });
    } finally {
      process.stdout.write = origWrite;
    }

    const result = JSON.parse(capturedJson);
    expect(result.current_step).toBe('delta');
    expect(result.upstream_skipped).not.toContain('proposal');
  });

  it('FR-020: モード未指定で proposal が ready になる（後方互換）', async () => {
    const cwd = await setupProject(); // no mode
    let capturedJson = '';
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array) => {
      if (typeof chunk === 'string') capturedJson += chunk;
      return true;
    };

    try {
      await continueCommand({ change: '2026-01-01-test-change', json: true, cwd });
    } finally {
      process.stdout.write = origWrite;
    }

    const result = JSON.parse(capturedJson);
    expect(result.current_step).toBe('proposal');
  });
});

describe('FR-021: force チェック (skip コマンド)', () => {
  it('bugfix モードで research スキップが拒否される', async () => {
    const cwd = await setupProject('bugfix');

    await expect(
      skipCommand('research', {
        change: '2026-01-01-test-change',
        reason: 'trying to skip force step in bugfix mode',
        cwd,
      }),
    ).rejects.toThrow('bugfix');
  });

  it('非 force ステップは bugfix モードでもスキップ可能', async () => {
    const cwd = await setupProject('bugfix');

    await expect(
      skipCommand('proposal', {
        change: '2026-01-01-test-change',
        reason: 'proposal is not in force list for bugfix',
        cwd,
      }),
    ).resolves.not.toThrow();
  });
});
