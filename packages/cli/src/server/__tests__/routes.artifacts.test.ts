// @mspec-delta 2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/change-dashboard/spec.md
// Requirements implemented: FR-010
// Change: web-ui-artifact-order-and-test-results

import { describe, it, expect } from 'vitest';
import { getStepForArtifact, WORKFLOW_STEP_ORDER } from '../routes/artifacts.js';

describe('WORKFLOW_STEP_ORDER', () => {
  it('contains all expected workflow steps in order', () => {
    expect(WORKFLOW_STEP_ORDER).toEqual([
      'new', 'proposal', 'delta', 'research', 'design',
      'quickstart', 'checklist', 'tasks', 'implement',
    ]);
  });
});

describe('getStepForArtifact', () => {
  it('maps readme.md to new', () => {
    expect(getStepForArtifact('readme.md')).toBe('new');
  });

  it('maps proposal.md to proposal', () => {
    expect(getStepForArtifact('proposal.md')).toBe('proposal');
  });

  it('maps specs/ paths to delta', () => {
    expect(getStepForArtifact('specs/change-dashboard/spec.md')).toBe('delta');
  });

  it('maps research.md to research', () => {
    expect(getStepForArtifact('research.md')).toBe('research');
  });

  it('maps design.md to design', () => {
    expect(getStepForArtifact('design.md')).toBe('design');
  });

  it('maps design-rationale.md to design', () => {
    expect(getStepForArtifact('design-rationale.md')).toBe('design');
  });

  it('maps architecture-overview.md to design', () => {
    expect(getStepForArtifact('architecture-overview.md')).toBe('design');
  });

  it('maps quickstart.md to quickstart', () => {
    expect(getStepForArtifact('quickstart.md')).toBe('quickstart');
  });

  it('maps checklist.md to checklist', () => {
    expect(getStepForArtifact('checklist.md')).toBe('checklist');
  });

  it('maps tasks.md to tasks', () => {
    expect(getStepForArtifact('tasks.md')).toBe('tasks');
  });

  it('maps unknown files to implement (end of list)', () => {
    expect(getStepForArtifact('unknown-file.md')).toBe('implement');
  });
});

describe('artifact sort order', () => {
  it('sorts proposal.md before design.md before tasks.md', () => {
    const artifacts = [
      { name: 'tasks.md', relativePath: 'tasks.md' },
      { name: 'proposal.md', relativePath: 'proposal.md' },
      { name: 'design.md', relativePath: 'design.md' },
    ];
    const sorted = [...artifacts].sort(
      (a, b) =>
        WORKFLOW_STEP_ORDER.indexOf(getStepForArtifact(a.relativePath)) -
        WORKFLOW_STEP_ORDER.indexOf(getStepForArtifact(b.relativePath)),
    );
    expect(sorted[0]!.name).toBe('proposal.md');
    expect(sorted[1]!.name).toBe('design.md');
    expect(sorted[2]!.name).toBe('tasks.md');
  });
});
