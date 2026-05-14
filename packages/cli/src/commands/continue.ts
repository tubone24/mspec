import pc from 'picocolors';
import { loadWorkflow } from '../workflow/loader.js';
import { projectPaths } from '../workflow/paths.js';
import { findChange, listChanges } from '../lib/change-discovery.js';
import { loadSkipLog, skippedSteps } from '../lib/skip-log.js';
import { computeStatus } from '../lib/state-engine.js';
import type { Status, Step, Workflow } from '../types/index.js';

export interface ContinueOptions {
  change?: string;
  json?: boolean;
}

export interface ContinueOutput {
  change: string;
  current_step: string | null;
  next_action: 'execute' | 'wait_user' | 'validate_failed' | 'complete';
  skill: string | null;
  main_prompt: string | null;
  subagent_prompt: string | null;
  subagent_name: string | null;
  upstream_skipped: string[];
  required_artifacts: { path: string; exists: boolean }[];
  produces: string[];
  block_after: boolean;
  blockers: string[];
}

export async function continueCommand(opts: ContinueOptions): Promise<void> {
  const paths = projectPaths(process.cwd());
  const workflow = await loadWorkflow(paths.workflowFile);
  const skipLog = await loadSkipLog(paths);

  const changeName = opts.change ?? (await singleActiveChange(paths));
  const change = await findChange(paths, changeName);
  if (!change) throw new Error(`change "${changeName}" not found`);

  const status = await computeStatus({ workflow, change, skipLog });
  const out = buildContinue(status, workflow, change.dir, skippedSteps(skipLog, change.name));

  if (opts.json) {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return;
  }
  printHuman(out);
}

async function singleActiveChange(paths: ReturnType<typeof projectPaths>): Promise<string> {
  const live = await listChanges(paths, { includeArchived: false });
  if (live.length === 1) return live[0]!.name;
  if (live.length === 0) throw new Error('no active change. Run `mspec new` first.');
  throw new Error(`multiple active changes; specify --change: ${live.map((c) => c.name).join(', ')}`);
}

function buildContinue(
  status: Status,
  workflow: Workflow,
  changeDir: string,
  upstreamSkipped: string[],
): ContinueOutput {
  const invalid = status.steps.find((s) => s.state === 'invalid');
  if (invalid) {
    return baseEmpty(status, 'validate_failed');
  }

  const nextReady = status.steps.find((s) => s.state === 'ready');
  if (!nextReady) {
    return baseEmpty(status, 'complete');
  }

  const step = workflow.steps.find((s) => s.id === nextReady.id);
  if (!step) {
    return baseEmpty(status, 'wait_user');
  }

  const required = (step.requires ?? []).map((p) => ({
    path: `${changeDir}/${p}`,
    exists: true, // status engine already required prev steps to be done/skipped
  }));

  return {
    change: status.change,
    current_step: step.id,
    next_action: 'execute',
    skill: step.skill,
    main_prompt: buildMainPrompt(step, status.change, changeDir),
    subagent_prompt: step.subagent ? buildSubagentPrompt(step, status.change) : null,
    subagent_name: step.subagent ? mapSubagentName(step.id) : null,
    upstream_skipped: upstreamSkipped,
    required_artifacts: required,
    produces: step.produces ?? [],
    block_after: step.block,
    blockers: status.blockers,
  };
}

function baseEmpty(status: Status, action: ContinueOutput['next_action']): ContinueOutput {
  return {
    change: status.change,
    current_step: status.current_step,
    next_action: action,
    skill: null,
    main_prompt: null,
    subagent_prompt: null,
    subagent_name: null,
    upstream_skipped: [],
    required_artifacts: [],
    produces: [],
    block_after: false,
    blockers: status.blockers,
  };
}

function buildMainPrompt(step: Step, change: string, changeDir: string): string {
  const requires = (step.requires ?? []).map((p) => `- ${changeDir}/${p}`).join('\n');
  const produces = (step.produces ?? []).join(', ');
  const flags: string[] = [];
  if (step.ask_questions) flags.push('Ask the user clarifying questions (1 at a time).');
  if (step.subagent) flags.push('Delegate the heavy work to the matching mspec-* subagent.');
  if (step.constitution_check) flags.push('Append the Constitution Check section at the end of each produced artifact.');
  if (step.enforce_anchor) flags.push('Anchor enforcement is on: each implementation file must embed an @mspec-delta anchor block.');
  if (step.enforce_e2e) flags.push('E2E enforcement is on: each Scenario must have a corresponding E2E test file.');
  if (step.enforce_tdd) flags.push('TDD enforcement is on: each task needs `mspec test --expect-red` then `--expect-green` evidence.');

  return [
    `## Step: ${step.id}`,
    ``,
    `You are executing the "${step.id}" step of the mspec workflow for change "${change}".`,
    requires ? `Read the following inputs first:\n${requires}` : '',
    produces ? `Produce: ${produces}` : '',
    ...flags,
    ``,
    `When done, run \`mspec validate --change ${change}\` then \`mspec continue --change ${change}\`.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildSubagentPrompt(step: Step, change: string): string {
  return [
    `You are ${mapSubagentName(step.id)}.`,
    `Step: ${step.id} for change ${change}.`,
    `Follow the instructions in main_prompt. Return only the produced artifact content.`,
  ].join('\n');
}

function mapSubagentName(stepId: string): string {
  switch (stepId) {
    case 'research':
      return 'mspec-researcher';
    case 'self-review':
      return 'mspec-self-reviewer';
    case 'checklist':
      return 'mspec-checklist-auditor';
    default:
      return `mspec-${stepId}-runner`;
  }
}

function printHuman(out: ContinueOutput): void {
  console.log(pc.bold(`Change: ${out.change}`));
  console.log(`Next action: ${pc.cyan(out.next_action)}`);
  if (out.current_step) console.log(`Current step: ${pc.cyan(out.current_step)}`);
  if (out.next_action === 'validate_failed' || out.blockers.length > 0) {
    console.log();
    console.log(pc.bold('Blockers:'));
    for (const b of out.blockers) console.log(`  - ${b}`);
  }
  if (out.main_prompt) {
    console.log();
    console.log(pc.gray('--- main_prompt (paste into the LLM) ---'));
    console.log(out.main_prompt);
  }
}
