// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-019, FR-020
// Change: lightweight-change-mode

import { describe, it, expect } from 'vitest';
import { computeStatus } from './state-engine.js';
import type { Workflow, Step } from '../types/workflow.js';
import type { ChangeLocation } from './change-discovery.js';

function makeStep(id: string, overrides: Partial<Step> = {}): Step {
  return {
    id,
    command: `/mspec:${id}`,
    skill: `mspec-${id}`,
    requires: [],
    produces: [`${id}.md`],
    block: false,
    removable: true,
    ask_questions: false,
    subagent: false,
    constitution_check: false,
    enforce_anchor: false,
    enforce_e2e: false,
    enforce_fr_ids: false,
    enforce_tdd: false,
    skippable: true,
    enabled: true,
    ...overrides,
  };
}

function makeChange(dir: string): ChangeLocation {
  return { name: 'test-change', dir, isArchived: false };
}

const typoWorkflow: Workflow = {
  version: 1,
  name: 'test',
  steps: [
    makeStep('proposal', { produces: ['proposal.md'] }),
    makeStep('delta', { produces: ['delta.md'] }),
    makeStep('quickstart', { produces: ['quickstart.md'] }),
    makeStep('tasks', { produces: ['tasks.md'] }),
  ],
  modes: {
    typo: { skip: ['proposal', 'quickstart'], force: [] },
    bugfix: { skip: ['proposal', 'quickstart'], force: ['research'] },
  },
};

describe('computeStatus — mode-driven skips', () => {
  it('marks proposal and quickstart as skipped in typo mode (no files needed)', async () => {
    const change = makeChange('/nonexistent');
    const status = await computeStatus({
      workflow: typoWorkflow,
      change,
      skipLog: {},
      doneLog: {},
      mode: 'typo',
    });

    const proposal = status.steps.find((s) => s.id === 'proposal');
    const quickstart = status.steps.find((s) => s.id === 'quickstart');
    const delta = status.steps.find((s) => s.id === 'delta');

    expect(proposal?.state).toBe('skipped');
    expect(quickstart?.state).toBe('skipped');
    // delta is not skipped — it should be ready (previous step was skipped = prevReady=true)
    expect(delta?.state).toBe('ready');
  });

  it('does not skip steps in null mode (full flow)', async () => {
    const change = makeChange('/nonexistent');
    const status = await computeStatus({
      workflow: typoWorkflow,
      change,
      skipLog: {},
      doneLog: {},
      mode: null,
    });

    const proposal = status.steps.find((s) => s.id === 'proposal');
    expect(proposal?.state).toBe('ready');
  });

  it('does not skip steps when mode is undefined', async () => {
    const change = makeChange('/nonexistent');
    const status = await computeStatus({
      workflow: typoWorkflow,
      change,
      skipLog: {},
      doneLog: {},
    });

    const proposal = status.steps.find((s) => s.id === 'proposal');
    expect(proposal?.state).toBe('ready');
  });

  it('does not skip steps for workflow without modes field (backward compat)', async () => {
    const workflowNoModes: Workflow = {
      version: 1,
      name: 'no-modes',
      steps: [
        makeStep('proposal', { produces: ['proposal.md'] }),
        makeStep('tasks', { produces: ['tasks.md'] }),
      ],
    };
    const change = makeChange('/nonexistent');
    const status = await computeStatus({
      workflow: workflowNoModes,
      change,
      skipLog: {},
      doneLog: {},
      mode: 'typo',
    });

    const proposal = status.steps.find((s) => s.id === 'proposal');
    // No modes defined → mode-driven skip never fires
    expect(proposal?.state).toBe('ready');
  });
});
