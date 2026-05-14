import { readFile } from 'node:fs/promises';
import type {
  Status,
  Step,
  StepState,
  StepStatus,
  Workflow,
} from '../types/index.js';
import { resolveProduces, fileExists } from './change-discovery.js';
import type { ChangeLocation } from './change-discovery.js';
import { isSkipped, type SkipLog } from './skip-log.js';
import { validateArtifact } from './artifact-validator.js';

export interface ComputeStatusInput {
  workflow: Workflow;
  change: ChangeLocation;
  skipLog: SkipLog;
}

export async function computeStatus(input: ComputeStatusInput): Promise<Status> {
  const { workflow, change, skipLog } = input;
  const blockers: string[] = [];
  const stepStatuses: StepStatus[] = [];

  const enabledSteps = workflow.steps.filter((s) => s.enabled !== false);
  let prevReady = true; // previous step was done or skipped

  for (const step of enabledSteps) {
    const state = await evaluateStep({
      step,
      change,
      skipLog,
      prevReady,
      blockers,
    });
    stepStatuses.push({
      id: step.id,
      produces: step.produces ?? [],
      state,
    });
    prevReady = state === 'done' || state === 'skipped';
  }

  const currentStep =
    stepStatuses.find((s) => s.state === 'ready' || s.state === 'invalid')?.id ?? null;

  return {
    change: change.name,
    current_step: currentStep,
    steps: stepStatuses,
    blockers,
  };
}

interface EvaluateInput {
  step: Step;
  change: ChangeLocation;
  skipLog: SkipLog;
  prevReady: boolean;
  blockers: string[];
}

async function evaluateStep(input: EvaluateInput): Promise<StepState> {
  const { step, change, skipLog, prevReady, blockers } = input;

  if (isSkipped(skipLog, change.name, step.id)) {
    return 'skipped';
  }
  if (!prevReady) {
    return 'blocked';
  }

  const produces = step.produces ?? [];
  if (produces.length === 0) {
    // Steps with no concrete files (e.g. implement, archive) are considered ready
    // when prev is ready; downstream judgement is up to the user.
    return 'ready';
  }

  const allExist = await checkAllProducesExist(change.dir, produces);
  if (!allExist) return 'ready';

  // All files exist; validate them
  const issues = await validateChangeArtifacts(change.dir, step, produces);
  if (issues.length > 0) {
    blockers.push(...issues.map((m) => `${step.id}: ${m}`));
    return 'invalid';
  }

  return 'done';
}

async function checkAllProducesExist(
  changeDir: string,
  produces: string[],
): Promise<boolean> {
  for (const p of produces) {
    const resolved = await resolveProduces(changeDir, p);
    if (resolved.length === 0) return false;
  }
  return true;
}

async function validateChangeArtifacts(
  changeDir: string,
  step: Step,
  produces: string[],
): Promise<string[]> {
  const out: string[] = [];
  for (const p of produces) {
    const resolved = await resolveProduces(changeDir, p);
    if (resolved.length === 0) {
      out.push(`expected artifact missing: ${p}`);
      continue;
    }
    for (const filePath of resolved) {
      if (!(await fileExists(filePath))) {
        out.push(`artifact not a file: ${filePath}`);
        continue;
      }
      const contents = await readFile(filePath, 'utf8');
      const issues = validateArtifact({
        filePath,
        contents,
        produces: p,
        constitutionRequired: step.constitution_check ?? false,
      });
      out.push(...issues);
    }
  }
  return out;
}
