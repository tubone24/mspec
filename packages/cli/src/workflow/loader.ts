import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { WorkflowSchema, REQUIRED_STEP_IDS, type Workflow } from '../types/index.js';

export class WorkflowError extends Error {}

export async function loadWorkflow(path: string): Promise<Workflow> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (e) {
    throw new WorkflowError(`workflow.yaml not found at ${path}`);
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (e) {
    throw new WorkflowError(`workflow.yaml is not valid YAML: ${(e as Error).message}`);
  }

  const result = WorkflowSchema.safeParse(parsed);
  if (!result.success) {
    throw new WorkflowError(
      `workflow.yaml is invalid:\n${result.error.errors.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n')}`,
    );
  }

  validateRequiredSteps(result.data);
  return result.data;
}

export function validateRequiredSteps(wf: Workflow): void {
  const ids = new Set(wf.steps.map((s) => s.id));
  const missing = REQUIRED_STEP_IDS.filter((id) => !ids.has(id));
  if (missing.length > 0) {
    throw new WorkflowError(
      `workflow.yaml is missing required steps (removable: false): ${missing.join(', ')}`,
    );
  }
  for (const step of wf.steps) {
    if ((REQUIRED_STEP_IDS as readonly string[]).includes(step.id) && step.removable) {
      throw new WorkflowError(
        `step "${step.id}" must have removable: false (it is a required step)`,
      );
    }
  }
}
