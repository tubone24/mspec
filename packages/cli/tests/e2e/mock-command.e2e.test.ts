// @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-core/spec.md
// Requirements implemented: FR-004
// Change: ui-visual-mock-workflow

// @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: rename-visual-mock-to-prototype

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { prototypeCommand } from '../../src/commands/prototype.js';

const CHANGE = '2026-01-01-test-mock-change';
const MIN_WORKFLOW = `version: 1\nname: test\nsteps:\n  - id: new\n    command: /mspec:new\n    skill: mspec-new\n    produces: [readme.md]\n    block: true\n    removable: false\n  - id: proposal\n    command: /mspec:proposal\n    skill: mspec-proposal\n    produces: [proposal.md]\n    block: true\n    removable: false\n  - id: delta\n    command: /mspec:delta\n    skill: mspec-delta\n    produces: [specs/spec.md]\n    block: false\n    removable: false\n  - id: tasks\n    command: /mspec:tasks\n    skill: mspec-tasks\n    produces: [tasks.md]\n    block: true\n    removable: false\n  - id: implement\n    command: /mspec:implement\n    skill: mspec-implement\n    produces: []\n    block: true\n    removable: false\n  - id: archive\n    command: /mspec:archive\n    skill: mspec-archive\n    produces: []\n    block: false\n    removable: false`;

async function setupProject(opts: { withProposal: boolean }): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-mock-test-'));
  await mkdir(join(cwd, '.mspec'), { recursive: true });
  await writeFile(join(cwd, '.mspec', 'workflow.yaml'), MIN_WORKFLOW);

  const changeDir = join(cwd, 'changes', CHANGE);
  await mkdir(changeDir, { recursive: true });
  await writeFile(join(changeDir, 'readme.md'), '# Test\n\n> Status: active\n');

  if (opts.withProposal) {
    await writeFile(
      join(changeDir, 'proposal.md'),
      '# Proposal\n\n## Goals\n\nBuild a UI component for user management.\n',
    );
  }

  return cwd;
}

// FR-004 Scenario: mspec mock の正常実行
describe('TASK-010: FR-004 — mspec mock normal execution flow', () => {
  it('outputs server URL and feedback prompt when run with a valid change', async () => {
    const cwd = await setupProject({ withProposal: true });

    let outputLines: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array): boolean => {
      if (typeof chunk === 'string') outputLines.push(chunk);
      return true;
    };

    let threw = false;
    try {
      await prototypeCommand({ change: CHANGE, cwd });
    } catch {
      threw = true;
    } finally {
      process.stdout.write = origWrite;
    }

    const output = outputLines.join('');
    expect(threw).toBe(false);
    expect(output).toMatch(/localhost:\d+/);
    expect(output).toMatch(/feedback/i);
  });
});

// @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
// Requirements implemented: FR-001, FR-002
// Change: rename-visual-mock-to-prototype

// T101/T102: FR-001/FR-002 — prototypeCommand creates prototype/ directory and shows "prototype" in server URL
describe('T101: FR-001/FR-002 — prototypeCommand creates prototype/ directory', () => {
  it('prototype server output contains "prototype" and localhost URL', async () => {
    const { prototypeCommand } = await import('../../src/commands/prototype.js');
    const cwd = await setupProject({ withProposal: true });

    let outputLines: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array): boolean => {
      if (typeof chunk === 'string') outputLines.push(chunk);
      return true;
    };

    let threw = false;
    try {
      await (prototypeCommand as (opts: { change: string; cwd: string }) => Promise<void>)({
        change: CHANGE,
        cwd,
      });
    } catch {
      threw = true;
    } finally {
      process.stdout.write = origWrite;
    }

    const output = outputLines.join('');
    expect(threw).toBe(false);
    expect(output).toMatch(/prototype/i);
    expect(output).toMatch(/localhost:\d+/);
  });
});

// FR-004 Scenario: active change が存在しない場合のエラー
describe('TASK-011: FR-004 — mspec mock no active change error', () => {
  it('exits with non-zero and stderr contains "no active change found" when changes/ is empty', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'mspec-mock-nochange-'));
    await mkdir(join(cwd, '.mspec'), { recursive: true });
    await writeFile(join(cwd, '.mspec', 'workflow.yaml'), MIN_WORKFLOW);
    await mkdir(join(cwd, 'changes'), { recursive: true });

    let stderrOutput = '';
    const origStderrWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk: string | Uint8Array): boolean => {
      if (typeof chunk === 'string') stderrOutput += chunk;
      return true;
    };

    let threw = false;
    let exitCode: number | undefined;
    const origExit = process.exit.bind(process);
    (process as NodeJS.Process & { exit: (code?: number) => never }).exit = (code?: number): never => {
      exitCode = code;
      threw = true;
      throw new Error(`process.exit(${code})`);
    };

    try {
      await prototypeCommand({ cwd });
    } catch {
      // expected
    } finally {
      process.stderr.write = origStderrWrite;
      (process as NodeJS.Process & { exit: (code?: number) => never }).exit = origExit;
    }

    expect(threw).toBe(true);
    expect(exitCode).not.toBe(0);
    expect(stderrOutput).toMatch(/no active change/i);
  });
});
