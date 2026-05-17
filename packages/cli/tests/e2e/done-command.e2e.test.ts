// @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
// Requirements implemented: FR-003, FR-004
// Change: fix-special-step-produces

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { projectPaths } from '../../src/workflow/paths.js';
import { doneCommand } from '../../src/commands/done.js';
import { loadDoneLog } from '../../src/lib/done-log.js';

const WORKFLOW_YAML = `version: 1
name: mspec-test
description: test workflow for done command
steps:
  - id: new
    command: /mspec:new
    skill: mspec-new
    produces: [readme.md]
    block: true
    removable: false

  - id: proposal
    command: /mspec:proposal
    skill: mspec-proposal
    produces: [proposal.md]
    block: true
    removable: false

  - id: delta
    command: /mspec:delta
    skill: mspec-delta
    produces: ["specs/*/spec.md"]
    block: false
    removable: false

  - id: tasks
    command: /mspec:tasks
    skill: mspec-tasks
    produces: [tasks.md]
    block: true
    removable: false

  - id: implement
    command: /mspec:implement
    skill: mspec-implement
    produces: []
    block: true
    removable: false
    enforce_anchor: true
    enforce_tdd: false
    enforce_e2e: false

  - id: archive
    command: /mspec:archive
    skill: mspec-archive
    produces: []
    block: false
    removable: false
`;

interface Env {
  root: string;
  changeName: string;
}

async function setupProject(): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-done-cmd-'));
  const changeName = '2026-05-14-000000-test-done-cmd';

  await mkdir(join(root, '.mspec', 'cache'), { recursive: true });
  await writeFile(join(root, '.mspec', 'workflow.yaml'), WORKFLOW_YAML, 'utf8');
  await mkdir(join(root, 'changes', changeName), { recursive: true });
  await writeFile(join(root, 'changes', changeName, 'readme.md'), '# test\n', 'utf8');

  return { root, changeName };
}

describe('done command — FR-003: produces ガード', () => {
  let env: Env;

  beforeEach(async () => { env = await setupProject(); });
  afterEach(async () => { await rm(env.root, { recursive: true, force: true }); });

  // T110: FR-003 — produces を持つステップへの誤用は拒否される
  it('T110: produces を持つステップに doneCommand を実行するとエラーメッセージが throw される', async () => {
    const paths = projectPaths(env.root);

    await expect(
      doneCommand('proposal', { change: env.changeName, cwd: env.root }),
    ).rejects.toThrow('mspec done は produces が空のステップにのみ使用できます');
  });

  // T111: FR-003 — done-log はガードエラー時にバイト同一性を保つ
  it('T111: ガードエラー後に done-log.json が変更されない', async () => {
    const paths = projectPaths(env.root);

    // Pre-populate done-log
    const preContent = JSON.stringify(
      { [env.changeName]: { archive: { done_at: '2026-05-14T00:00:00.000Z' } } },
      null,
      2,
    ) + '\n';
    await writeFile(join(env.root, '.mspec', 'cache', 'done-log.json'), preContent, 'utf8');

    await expect(
      doneCommand('proposal', { change: env.changeName, cwd: env.root }),
    ).rejects.toThrow();

    const postContent = await readFile(
      join(env.root, '.mspec', 'cache', 'done-log.json'),
      'utf8',
    );
    expect(postContent).toBe(preContent);
  });
});

describe('done command — FR-004: implement ステップの validate 連携', () => {
  let env: Env;

  beforeEach(async () => { env = await setupProject(); });
  afterEach(async () => { await rm(env.root, { recursive: true, force: true }); });

  // T112: FR-004 — validate 成功時に done-log.json が書き込まれる
  it('T112: enforce_anchor が満たされた状態で doneCommand("implement") が done-log を保存する', async () => {
    const paths = projectPaths(env.root);

    // Place a source file with a valid @mspec-delta anchor for this change
    const srcDir = join(env.root, 'src');
    await mkdir(srcDir, { recursive: true });
    await writeFile(
      join(srcDir, 'impl.ts'),
      `// @mspec-delta ${env.changeName}/specs/test-cap/spec.md\n// Requirements implemented: FR-001\n// Change: test\nexport const x = 1;\n`,
      'utf8',
    );

    await doneCommand('implement', { change: env.changeName, cwd: env.root });

    const log = await loadDoneLog(paths);
    expect(log[env.changeName]?.['implement']).toBeDefined();
    expect(log[env.changeName]!['implement']!.done_at).toMatch(/^\d{4}/);
  });

  // T113: FR-004 — validate 失敗時に done-log.json は更新されない
  it('T113: enforce_anchor が未満足の状態で doneCommand("implement") がエラーを throw し done-log を更新しない', async () => {
    const paths = projectPaths(env.root);

    await expect(
      doneCommand('implement', { change: env.changeName, cwd: env.root }),
    ).rejects.toThrow();

    const log = await loadDoneLog(paths);
    expect(log[env.changeName]?.['implement']).toBeUndefined();
  });
});
