// @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-018
// Change: fix-special-step-produces

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const WORKFLOW_PATH = join(ROOT, '.mspec', 'workflow.yaml');

interface WorkflowStep {
  id: string;
  skippable?: boolean;
}

interface Workflow {
  steps: WorkflowStep[];
}

async function loadWorkflowSteps(): Promise<WorkflowStep[]> {
  const raw = await readFile(WORKFLOW_PATH, 'utf8');
  const wf = parseYaml(raw) as Workflow;
  return wf.steps;
}

describe('workflow.yaml — FR-018: skippable フラグ削除', () => {
  // T130: mandatory produce-less steps have no skippable: true
  it('T130: implement・archive・self-review は skippable: true を持たず、research・quickstart・checklist は保持する', async () => {
    const steps = await loadWorkflowSteps();
    const byId = Object.fromEntries(steps.map((s) => [s.id, s]));

    // Mandatory produce-less steps must NOT be skippable
    expect(byId['implement']?.skippable).toBeFalsy();
    expect(byId['archive']?.skippable).toBeFalsy();
    expect(byId['self-review']?.skippable).toBeFalsy();

    // Optional steps must retain skippable: true
    expect(byId['research']?.skippable).toBe(true);
    expect(byId['quickstart']?.skippable).toBe(true);
    expect(byId['checklist']?.skippable).toBe(true);
  });

  // T131: mspec skip implement is rejected after skippable removal
  it('T131: skipCommand が skippable でないステップを拒否する', async () => {
    const { skipCommand } = await import('../../src/commands/skip.js');
    await expect(
      skipCommand('implement', { change: 'dummy-change', reason: 'test reason here', cwd: ROOT }),
    ).rejects.toThrow('is not skippable');
  });
});
