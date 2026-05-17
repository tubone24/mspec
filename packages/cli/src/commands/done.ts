// @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-done-log/spec.md
// Requirements implemented: FR-001, FR-003, FR-004
// Change: fix-special-step-produces

import pc from 'picocolors';
import { loadWorkflow } from '../workflow/loader.js';
import { projectPaths } from '../workflow/paths.js';
import { findChange, listChanges } from '../lib/change-discovery.js';
import { recordDone } from '../lib/done-log.js';
import { checkEnforcement } from '../lib/enforce.js';

export interface DoneOptions {
  change?: string;
  cwd?: string;
}

export async function doneCommand(stepId: string, opts: DoneOptions): Promise<void> {
  const paths = projectPaths(opts.cwd ?? process.cwd());
  const workflow = await loadWorkflow(paths.workflowFile);

  const step = workflow.steps.find((s) => s.id === stepId);
  if (!step) throw new Error(`step "${stepId}" not found in workflow`);

  if ((step.produces ?? []).length > 0) {
    throw new Error('mspec done は produces が空のステップにのみ使用できます');
  }

  const changeName = opts.change ?? (await singleActiveChange(paths));
  const change = await findChange(paths, changeName);
  if (!change || change.isArchived) {
    throw new Error(`active change "${changeName}" not found`);
  }

  if (stepId === 'implement') {
    const { issues } = await checkEnforcement(step, {
      changeName: change.name,
      cwd: opts.cwd ?? process.cwd(),
    });
    if (issues.length > 0) {
      for (const issue of issues) console.error(pc.red('✗'), issue);
      throw new Error('mspec validate failed; fix issues before marking implement as done');
    }
  }

  await recordDone(paths, change.name, stepId);
  console.log(`${pc.green('done:')} ${stepId}`);
}

async function singleActiveChange(paths: ReturnType<typeof projectPaths>): Promise<string> {
  const live = await listChanges(paths, { includeArchived: false });
  if (live.length === 1) return live[0]!.name;
  if (live.length === 0) throw new Error('no active change');
  throw new Error(`multiple active changes; specify --change: ${live.map((c) => c.name).join(', ')}`);
}
