// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-019, FR-021
// Change: lightweight-change-mode
// @mspec-delta 2026-05-26-123041-p2-implement-iteration-loop/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-024
// Change: p2-implement-iteration-loop

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

describe('StepSchema — max_iterations field', () => {
  it('accepts step with max_iterations set to a positive integer', () => {
    const result = WorkflowSchema.safeParse({
      ...baseWorkflow,
      steps: [{ ...baseStep, max_iterations: 3 }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts step without max_iterations (backward compat, defaults to undefined)', () => {
    const result = WorkflowSchema.safeParse(baseWorkflow);
    expect(result.success).toBe(true);
    const parsed = result as { success: true; data: { steps: Array<{ max_iterations?: number }> } };
    expect(parsed.data.steps[0]?.max_iterations).toBeUndefined();
  });

  it('rejects max_iterations of zero', () => {
    const result = WorkflowSchema.safeParse({
      ...baseWorkflow,
      steps: [{ ...baseStep, max_iterations: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects max_iterations as a non-integer float', () => {
    const result = WorkflowSchema.safeParse({
      ...baseWorkflow,
      steps: [{ ...baseStep, max_iterations: 1.5 }],
    });
    expect(result.success).toBe(false);
  });
});
