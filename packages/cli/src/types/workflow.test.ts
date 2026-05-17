// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-019, FR-021
// Change: lightweight-change-mode

import { describe, it, expect } from 'vitest';
import { WorkflowSchema } from './workflow.js';

const baseStep = {
  id: 'test',
  command: '/mspec:test',
  skill: 'mspec-test',
  block: false,
  removable: true,
};

const baseWorkflow = {
  version: 1 as const,
  name: 'test-workflow',
  steps: [baseStep],
};

describe('WorkflowSchema — modes field', () => {
  it('accepts workflow without modes field (backward compat)', () => {
    const result = WorkflowSchema.safeParse(baseWorkflow);
    expect(result.success).toBe(true);
  });

  it('accepts modes with skip and force arrays', () => {
    const result = WorkflowSchema.safeParse({
      ...baseWorkflow,
      modes: {
        typo: { skip: ['proposal', 'quickstart'], force: [] },
        bugfix: { skip: ['proposal', 'quickstart'], force: ['research'] },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts modes with only skip (force defaults to empty)', () => {
    const result = WorkflowSchema.safeParse({
      ...baseWorkflow,
      modes: { minor: { skip: ['proposal'] } },
    });
    expect(result.success).toBe(true);
  });

  it('rejects modes entry with non-array skip', () => {
    const result = WorkflowSchema.safeParse({
      ...baseWorkflow,
      modes: { typo: { skip: 'proposal' } },
    });
    expect(result.success).toBe(false);
  });
});
