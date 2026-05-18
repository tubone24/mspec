// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-019, FR-020
// Change: lightweight-change-mode

// @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/language-config/spec.md
// Requirements implemented: FR-006
// Change: fix-locale-spec-language

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { continueCommand } from './continue.js';

async function setupProject(opts: {
  readmeContent?: string;
  workflowModes?: Record<string, { skip: string[]; force: string[] }>;
  configYaml?: string;
}): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-continue-test-'));

  // Create .mspec directory
  await mkdir(join(cwd, '.mspec'), { recursive: true });

  if (opts.configYaml !== undefined) {
    await writeFile(join(cwd, '.mspec', 'config.yaml'), opts.configYaml);
  }

  // Write minimal workflow.yaml
  const modes = opts.workflowModes
    ? `\nmodes:\n${Object.entries(opts.workflowModes)
        .map(([k, v]) => `  ${k}:\n    skip: [${v.skip.map((s) => `'${s}'`).join(', ')}]\n    force: [${v.force.map((s) => `'${s}'`).join(', ')}]`)
        .join('\n')}`
    : '';
  const requiredSteps = [
    `  - id: new\n    command: /mspec:new\n    skill: mspec-new\n    produces: [readme.md]\n    block: true\n    removable: false`,
    `  - id: proposal\n    command: /mspec:proposal\n    skill: mspec-proposal\n    produces: [proposal.md]\n    block: true\n    removable: false\n    skippable: true`,
    `  - id: delta\n    command: /mspec:delta\n    skill: mspec-delta\n    produces: [specs/spec.md]\n    block: false\n    removable: false`,
    `  - id: tasks\n    command: /mspec:tasks\n    skill: mspec-tasks\n    produces: [tasks.md]\n    block: true\n    removable: false`,
    `  - id: implement\n    command: /mspec:implement\n    skill: mspec-implement\n    produces: []\n    block: true\n    removable: false`,
    `  - id: archive\n    command: /mspec:archive\n    skill: mspec-archive\n    produces: []\n    block: false\n    removable: false`,
  ].join('\n');
  await writeFile(
    join(cwd, '.mspec', 'workflow.yaml'),
    `version: 1\nname: test\nsteps:\n${requiredSteps}\n${modes}`,
  );

  // Create changes directory and a change with readme.md
  const changeDir = join(cwd, 'changes', '2026-01-01-test-change');
  await mkdir(changeDir, { recursive: true });
  await writeFile(
    join(changeDir, 'readme.md'),
    opts.readmeContent ?? '# Test\n\n> Status: active\n',
  );

  return cwd;
}

describe('continueCommand — mode-driven skip', () => {
  it('returns skipped state for proposal in typo mode', async () => {
    const cwd = await setupProject({
      readmeContent: '# Test\n\n> Mode: typo\n> Status: active\n',
      workflowModes: {
        typo: { skip: ['proposal'], force: [] },
      },
    });

    const output: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    let capturedJson = '';
    process.stdout.write = (chunk: string | Uint8Array) => {
      if (typeof chunk === 'string') capturedJson += chunk;
      return true;
    };

    try {
      await continueCommand({
        change: '2026-01-01-test-change',
        json: true,
        cwd,
      });
    } finally {
      process.stdout.write = origWrite;
    }

    const result = JSON.parse(capturedJson);
    // proposal is skipped, so first ready step would be delta (not tasks)
    expect(result.current_step).toBe('delta');
  });

  it('returns proposal as ready when no mode set', async () => {
    const cwd = await setupProject({
      readmeContent: '# Test\n\n> Status: active\n',
      workflowModes: {
        typo: { skip: ['proposal'], force: [] },
      },
    });

    let capturedJson = '';
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array) => {
      if (typeof chunk === 'string') capturedJson += chunk;
      return true;
    };

    try {
      await continueCommand({
        change: '2026-01-01-test-change',
        json: true,
        cwd,
      });
    } finally {
      process.stdout.write = origWrite;
    }

    const result = JSON.parse(capturedJson);
    expect(result.current_step).toBe('proposal');
  });
});

describe('continueCommand — locale フィールド (FR-006)', () => {
  it('JSON 出力に "locale": "ja" が含まれる（config.yaml に locale: ja 設定時）', async () => {
    const cwd = await setupProject({
      readmeContent: '# Test\n\n> Status: active\n',
      configYaml: 'version: 1\nlocale: "ja"\n',
    });

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
    expect(result).toHaveProperty('locale', 'ja');
  });
});
