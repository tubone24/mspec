// @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-state-engine/spec.md
// Requirements implemented: FR-001, FR-002
// Change: fix-special-step-produces

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { projectPaths } from '../../src/workflow/paths.js';
import { computeStatus } from '../../src/lib/state-engine.js';
import { recordDone } from '../../src/lib/done-log.js';
import type { Workflow } from '../../src/types/index.js';

const MINIMAL_WORKFLOW: Workflow = {
  version: 1,
  name: 'test',
  description: 'test',
  steps: [
    {
      id: 'new',
      command: '/mspec:new',
      skill: 'mspec-new',
      produces: ['readme.md'],
      block: true,
      removable: false,
    },
    {
      id: 'proposal',
      command: '/mspec:proposal',
      skill: 'mspec-proposal',
      produces: ['proposal.md'],
      block: true,
      removable: false,
    },
    {
      id: 'delta',
      command: '/mspec:delta',
      skill: 'mspec-delta',
      produces: ['specs/*/spec.md'],
      block: false,
      removable: false,
    },
    {
      id: 'tasks',
      command: '/mspec:tasks',
      skill: 'mspec-tasks',
      produces: ['tasks.md'],
      block: true,
      removable: false,
    },
    {
      id: 'implement',
      command: '/mspec:implement',
      skill: 'mspec-implement',
      produces: [],
      block: true,
      removable: false,
    },
    {
      id: 'archive',
      command: '/mspec:archive',
      skill: 'mspec-archive',
      produces: [],
      block: false,
      removable: false,
    },
  ],
};

interface Env {
  root: string;
  changeName: string;
}

async function setupProject(): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-state-engine-'));
  const changeName = '2026-05-14-000000-test-state';

  // Create upstream artifacts so new/proposal/delta/tasks are all "done"
  const changeDir = join(root, 'changes', changeName);
  await mkdir(join(changeDir, 'specs', 'test-cap'), { recursive: true });
  await writeFile(join(changeDir, 'readme.md'), '---\ndoc_type: Tutorial\n---\n# readme\n', 'utf8');
  await writeFile(join(changeDir, 'proposal.md'), '---\ndoc_type: Explanation\n---\n# proposal\n', 'utf8');
  await writeFile(
    join(changeDir, 'specs', 'test-cap', 'spec.md'),
    '# Delta Spec: test-cap\n\n## ADDED Requirements\n\n### Requirement: FR-001 — Test\nBody.\n\n#### Scenario: test\n- GIVEN x\n- WHEN y\n- THEN z\n',
    'utf8',
  );
  await writeFile(join(changeDir, 'tasks.md'), '---\ndoc_type: Reference\n---\n# tasks\n', 'utf8');

  await mkdir(join(root, '.mspec', 'cache'), { recursive: true });

  return { root, changeName };
}

describe('state-engine — FR-001/FR-002: produces-less step state transitions', () => {
  let env: Env;

  beforeEach(async () => { env = await setupProject(); });
  afterEach(async () => { await rm(env.root, { recursive: true, force: true }); });

  // T120: FR-001 — done-log に記録済みの produces レスステップは 'done' を返す
  it('T120: implement が done-log に記録済みのとき state が "done" になる', async () => {
    const paths = projectPaths(env.root);
    await recordDone(paths, env.changeName, 'implement');

    const { findChange } = await import('../../src/lib/change-discovery.js');
    const change = await findChange(paths, env.changeName);
    const doneLog = await (await import('../../src/lib/done-log.js')).loadDoneLog(paths);

    const status = await computeStatus({
      workflow: MINIMAL_WORKFLOW,
      change: change!,
      skipLog: {},
      doneLog,
    });

    const implementStep = status.steps.find((s) => s.id === 'implement');
    expect(implementStep?.state).toBe('done');
  });

  // T121: FR-002 — done-log に未記録の produces レスステップは 'ready' を返す
  it('T121: implement が done-log に未記録のとき state が "ready" になる（前ステップ done 済み）', async () => {
    const paths = projectPaths(env.root);
    const { findChange } = await import('../../src/lib/change-discovery.js');
    const change = await findChange(paths, env.changeName);

    const status = await computeStatus({
      workflow: MINIMAL_WORKFLOW,
      change: change!,
      skipLog: {},
      doneLog: {},
    });

    const implementStep = status.steps.find((s) => s.id === 'implement');
    expect(implementStep?.state).toBe('ready');
  });

  // T122: FR-002 file-not-found — done-log.json が存在しない場合も 'ready' を返す
  it('T122: done-log.json が存在しない場合（doneLog: {}）も "ready" が返される', async () => {
    const paths = projectPaths(env.root);
    const { findChange } = await import('../../src/lib/change-discovery.js');
    const change = await findChange(paths, env.changeName);

    const status = await computeStatus({
      workflow: MINIMAL_WORKFLOW,
      change: change!,
      skipLog: {},
      // doneLog omitted → should default to {} and not throw
    });

    const implementStep = status.steps.find((s) => s.id === 'implement');
    expect(implementStep?.state).toBe('ready');
  });
});
