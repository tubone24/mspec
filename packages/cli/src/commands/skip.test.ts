// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-021
// Change: lightweight-change-mode

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { skipCommand } from './skip.js';

async function setupProject(opts: {
  readmeMode?: string;
  workflowModes?: Record<string, { skip: string[]; force: string[] }>;
}): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-skip-test-'));
  await mkdir(join(cwd, '.mspec'), { recursive: true });

  const modes = opts.workflowModes
    ? `\nmodes:\n${Object.entries(opts.workflowModes)
        .map(
          ([k, v]) =>
            `  ${k}:\n    skip: [${v.skip.map((s) => `'${s}'`).join(', ')}]\n    force: [${v.force.map((s) => `'${s}'`).join(', ')}]`,
        )
        .join('\n')}`
    : '';

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
    `version: 1\nname: test\nsteps:\n${requiredSteps}\n${modes}`,
  );

  const changeDir = join(cwd, 'changes', '2026-01-01-test-change');
  await mkdir(changeDir, { recursive: true });
  const modeField = opts.readmeMode ? `> Mode: ${opts.readmeMode}\n` : '';
  await writeFile(
    join(changeDir, 'readme.md'),
    `# Test\n\n${modeField}> Status: active\n`,
  );

  return cwd;
}

describe('skipCommand — force チェック', () => {
  it('bugfix モードで force リストのステップ (research) のスキップを拒否する', async () => {
    const cwd = await setupProject({
      readmeMode: 'bugfix',
      workflowModes: {
        bugfix: { skip: [], force: ['research'] },
      },
    });

    await expect(
      skipCommand('research', {
        change: '2026-01-01-test-change',
        reason: 'trying to skip research in bugfix mode',
        cwd,
      }),
    ).rejects.toThrow('bugfix');
  });

  it('typo モードでは force チェックなしにスキップを許可する', async () => {
    const cwd = await setupProject({
      readmeMode: 'typo',
      workflowModes: {
        typo: { skip: ['research'], force: [] },
      },
    });

    // research is skippable=true in our setup
    await expect(
      skipCommand('research', {
        change: '2026-01-01-test-change',
        reason: 'typo mode allows skipping research step',
        cwd,
      }),
    ).resolves.not.toThrow();
  });

  it('モード未指定の場合は force チェックなしに通常動作する', async () => {
    const cwd = await setupProject({
      workflowModes: {
        bugfix: { skip: [], force: ['research'] },
      },
    });

    // no mode set → no force check, skippable=true so skip is allowed
    await expect(
      skipCommand('research', {
        change: '2026-01-01-test-change',
        reason: 'no mode set so force check is skipped entirely',
        cwd,
      }),
    ).resolves.not.toThrow();
  });
});
