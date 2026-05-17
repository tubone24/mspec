// @mspec-delta 2026-05-14-131906-fix-special-step-produces/specs/cli-state-engine/spec.md
// Requirements implemented: FR-001, FR-002
// Change: fix-special-step-produces

// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-019, FR-020
// Change: lightweight-change-mode

import { readFile } from 'node:fs/promises';
import pc from 'picocolors';
import { loadWorkflow } from '../workflow/loader.js';
import { projectPaths } from '../workflow/paths.js';
import { findChange, listChanges, fileExists } from '../lib/change-discovery.js';
import { loadSkipLog, skippedSteps } from '../lib/skip-log.js';
import { loadDoneLog } from '../lib/done-log.js';
import { computeStatus } from '../lib/state-engine.js';
import { extractPrinciples } from '../lib/constitution-principles.js';
import { parseMode } from '../lib/readme-parser.js';
import type { Status, Step, Workflow } from '../types/index.js';

export interface ContinueOptions {
  change?: string;
  json?: boolean;
  /** Override cwd (for testing). Defaults to process.cwd(). */
  cwd?: string;
}

export interface ConstitutionPrinciple {
  id: string;
  name: string;
  evaluate_in_phase: string[];
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
  constitution_principles: ConstitutionPrinciple[];
}

export async function continueCommand(opts: ContinueOptions): Promise<void> {
  const paths = projectPaths(opts.cwd ?? process.cwd());
  const workflow = await loadWorkflow(paths.workflowFile);
  const [skipLog, doneLog] = await Promise.all([loadSkipLog(paths), loadDoneLog(paths)]);

  const changeName = opts.change ?? (await singleActiveChange(paths));
  const change = await findChange(paths, changeName);
  if (!change) throw new Error(`change "${changeName}" not found`);

  const readmePath = `${change.dir}/readme.md`;
  let mode: string | null = null;
  if (await fileExists(readmePath)) {
    const readmeContent = await readFile(readmePath, 'utf8');
    mode = parseMode(readmeContent);
  }

  const status = await computeStatus({ workflow, change, skipLog, doneLog, mode });
  const principles = await loadConstitutionPrinciples(paths.constitutionFile);
  const out = buildContinue(status, workflow, change.dir, skippedSteps(skipLog, change.name), principles);

  if (opts.json) {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return;
  }
  printHuman(out);
}

async function loadConstitutionPrinciples(constitutionFile: string): Promise<ConstitutionPrinciple[]> {
  if (!(await fileExists(constitutionFile))) return [];
  const contents = await readFile(constitutionFile, 'utf8');
  return extractPrinciples(contents).map((p) => ({ ...p, evaluate_in_phase: [] }));
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
  allPrinciples: ConstitutionPrinciple[],
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

  const constitutionPrinciples = step.constitution_check
    ? allPrinciples.map((p) => ({
        ...p,
        evaluate_in_phase: step.id === 'design' ? ['0', '1'] : ['0'],
      }))
    : [];

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
    constitution_principles: constitutionPrinciples,
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
    constitution_principles: [],
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
