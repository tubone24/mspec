import pc from 'picocolors';
import { loadWorkflow } from '../workflow/loader.js';
import { projectPaths } from '../workflow/paths.js';
import { findChange, listChanges } from '../lib/change-discovery.js';
import { loadSkipLog } from '../lib/skip-log.js';
import { computeStatus } from '../lib/state-engine.js';
import type { Status, StepState } from '../types/index.js';

export interface StatusOptions {
  change?: string;
  json?: boolean;
}

export async function statusCommand(opts: StatusOptions): Promise<void> {
  const paths = projectPaths(process.cwd());
  const workflow = await loadWorkflow(paths.workflowFile);
  const skipLog = await loadSkipLog(paths);

  const changeName = await resolveChangeName(paths, opts.change);
  const change = await findChange(paths, changeName);
  if (!change) {
    throw new Error(`change "${changeName}" not found in changes/ or changes/archive/`);
  }

  const status = await computeStatus({ workflow, change, skipLog });
  if (opts.json) {
    process.stdout.write(JSON.stringify(status, null, 2) + '\n');
    return;
  }
  printStatus(status);
}

async function resolveChangeName(
  paths: ReturnType<typeof projectPaths>,
  hint: string | undefined,
): Promise<string> {
  if (hint) return hint;
  const live = await listChanges(paths, { includeArchived: false });
  if (live.length === 1) return live[0]!.name;
  if (live.length === 0) {
    throw new Error('no active change found in changes/. Use --change <name> or run `mspec new`.');
  }
  throw new Error(
    `multiple active changes; specify --change <name>: ${live.map((c) => c.name).join(', ')}`,
  );
}

function printStatus(s: Status): void {
  console.log(pc.bold(`Change: ${s.change}`));
  if (s.current_step) {
    console.log(`Current step: ${pc.cyan(s.current_step)}`);
  } else {
    console.log(`Current step: ${pc.gray('(none / complete)')}`);
  }
  console.log();
  for (const step of s.steps) {
    console.log(`  ${stateBadge(step.state)} ${step.id}`);
  }
  if (s.blockers.length > 0) {
    console.log();
    console.log(pc.bold('Blockers:'));
    for (const b of s.blockers) console.log(`  - ${b}`);
  }
}

function stateBadge(state: StepState): string {
  switch (state) {
    case 'done':
      return pc.green('[done]    ');
    case 'ready':
      return pc.cyan('[ready]   ');
    case 'blocked':
      return pc.gray('[blocked] ');
    case 'skipped':
      return pc.yellow('[skipped] ');
    case 'invalid':
      return pc.red('[invalid] ');
  }
}
