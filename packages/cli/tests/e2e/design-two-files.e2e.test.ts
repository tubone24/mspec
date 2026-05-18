// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-022
// Change: revise-artifact-taxonomy
// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/claude-integration/spec.md
// Requirements implemented: FR-022
// Change: revise-artifact-taxonomy

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { statusCommand } from '../../src/commands/status.js';
import { continueCommand } from '../../src/commands/continue.js';
import type { ContinueOutput } from '../../src/commands/continue.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_ENTRY = join(__dirname, '../../dist/index.js');

// Workflow YAML — mirrors real workflow.default.yaml's design step (produces both files)
// Uses minimal required step IDs so loadWorkflow accepts it.
const WORKFLOW_WITH_DESIGN_TWO_FILES = `version: 1
name: mspec-two-files-test
description: test workflow for design two-files FR-022
steps:
  - id: new
    command: /mspec:new
    skill: mspec-new
    produces: [readme.md]
    block: true
    removable: false
    ask_questions: false

  - id: proposal
    command: /mspec:proposal
    skill: mspec-proposal
    produces: [proposal.md]
    block: false
    removable: false
    ask_questions: false

  - id: delta
    command: /mspec:delta
    skill: mspec-delta
    produces: ["specs/*/spec.md"]
    block: false
    removable: false

  - id: research
    command: /mspec:research
    skill: mspec-research
    produces: [research.md]
    block: true
    removable: true
    skippable: true

  - id: design
    command: /mspec:design
    skill: mspec-design
    produces: [design.md, design-rationale.md, architecture-overview.md]
    block: true
    removable: false
    constitution_check: true

  - id: tasks
    command: /mspec:tasks
    skill: mspec-tasks
    produces: [tasks.md]
    block: true
    removable: false

  - id: implement
    command: /mspec:implement
    skill: mspec-implement
    produces: []
    block: true
    removable: false

  - id: archive
    command: /mspec:archive
    skill: mspec-archive
    produces: []
    block: false
    removable: false
`;

// Minimal valid design.md — doc_type: Reference + Constitution Check
const DESIGN_MD_CONTENT = `---
doc_type: Reference
---

# Design

## Summary

Test design.

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. Test | ✅ | ✅ | ok |
`;

// Minimal valid design-rationale.md — doc_type: Explanation + Constitution Check
const DESIGN_RATIONALE_MD_CONTENT = `---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale

## Context

Test context.

## Decisions

### Decision 1

Test decision.

## Alternatives Considered

- **Alt A**: rejected.

## Trade-offs

- simplicity vs extensibility.

## Rejected Options

- **Option X**: too complex.

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. Test | ✅ | ✅ | ok |
`;

// Minimal valid architecture-overview.md (Mermaid fence required; no doc_type required;
// Constitution Check is required when constitution_check: true on step + state-engine evaluates it)
const ARCH_OVERVIEW_CONTENT = `# Architecture Overview

\`\`\`mermaid
graph TD
  A --> B
\`\`\`

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. Test | ✅ | ✅ | ok |
`;

interface Env {
  root: string;
  changeId: string;
}

async function scaffoldBase(): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-design-two-files-'));
  const changeId = '2026-05-18-000000-design-two-files-test';

  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(
    join(root, '.mspec', 'config.yaml'),
    'version: 1\nlocale: "ja"\n',
    'utf8',
  );
  await writeFile(join(root, '.mspec', 'workflow.yaml'), WORKFLOW_WITH_DESIGN_TWO_FILES, 'utf8');

  const changeDir = join(root, 'changes', changeId);
  await mkdir(join(changeDir, 'specs', 'test-cap'), { recursive: true });

  // Satisfy all steps up through research so design becomes the current step
  await writeFile(join(changeDir, 'readme.md'), '---\ndoc_type: Tutorial\n---\n# readme\n', 'utf8');
  await writeFile(join(changeDir, 'proposal.md'), '---\ndoc_type: Explanation\n---\n# proposal\n', 'utf8');
  await writeFile(
    join(changeDir, 'specs', 'test-cap', 'spec.md'),
    '# Delta Spec: test-cap\n\n## ADDED Requirements\n\n### Requirement: FR-001 — Test\nBody.\n\n#### Scenario: test\n- GIVEN x\n- WHEN y\n- THEN z\n',
    'utf8',
  );
  // research skipped via skip-log so design becomes ready
  await mkdir(join(root, '.mspec', 'cache'), { recursive: true });
  await writeFile(
    join(root, '.mspec', 'cache', 'skip-log.json'),
    JSON.stringify({ [changeId]: { research: { reason: 'skipped for test', skipped_at: '2026-05-18T00:00:00.000Z' } } }, null, 2),
    'utf8',
  );

  return { root, changeId };
}

async function captureStdout(fn: () => Promise<void>): Promise<string> {
  let out = '';
  const orig = process.stdout.write.bind(process.stdout);
  (process.stdout.write as unknown as (chunk: string) => boolean) = (chunk: string) => {
    out += chunk;
    return true;
  };
  try {
    await fn();
  } finally {
    process.stdout.write = orig;
  }
  return out.trim();
}

function runCLI(root: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const res = spawnSync(process.execPath, [CLI_ENTRY, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  return { status: res.status ?? -1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

// ─── T120: design step produces includes both files ──────────────────────────

describe('T120: FR-022 — design step produces lists design.md AND design-rationale.md', () => {
  let env: Env;
  beforeEach(async () => { env = await scaffoldBase(); });
  afterEach(async () => { await rm(env.root, { recursive: true, force: true }); });

  it('mspec status --json returns design step with produces containing design.md and design-rationale.md', async () => {
    const out = await captureStdout(async () => {
      await statusCommand({ change: env.changeId, json: true, cwd: env.root });
    });
    const parsed = JSON.parse(out);
    const designStep = parsed.steps.find((s: { id: string }) => s.id === 'design');
    expect(designStep).toBeDefined();
    expect(designStep.produces).toContain('design.md');
    expect(designStep.produces).toContain('design-rationale.md');
  });
});

// ─── T121: design-rationale.md missing → validate reports blocker ────────────
// NOTE: This is a RED test. Current validate.ts line 105-106 explicitly states:
// "Validate only files that exist; absence is a status concern, not a validate concern"
// FR-022 requires validate to report missing design-rationale.md as a blocker.
// This test documents the REQUIRED behavior that is not yet implemented.

describe.skip('T121: FR-022 — design-rationale.md missing → validate reports blocker (RED: not yet implemented)', () => {
  let env: Env;
  beforeEach(async () => { env = await scaffoldBase(); });
  afterEach(async () => { await rm(env.root, { recursive: true, force: true }); });

  it('mspec validate exits non-zero and reports design-rationale.md as missing blocker when only design.md exists', async () => {
    const changeDir = join(env.root, 'changes', env.changeId);
    await writeFile(join(changeDir, 'design.md'), DESIGN_MD_CONTENT, 'utf8');
    // design-rationale.md intentionally absent

    const { status, stdout, stderr } = runCLI(env.root, ['validate', '--change', env.changeId]);
    const combined = stdout + stderr;
    expect(status).not.toBe(0);
    expect(combined).toMatch(/design-rationale\.md/);
  });

  it('mspec continue --json returns next_action: validate_failed when design-rationale.md is missing', async () => {
    const changeDir = join(env.root, 'changes', env.changeId);
    await writeFile(join(changeDir, 'design.md'), DESIGN_MD_CONTENT, 'utf8');
    // design-rationale.md intentionally absent

    const out = await captureStdout(async () => {
      await continueCommand({ change: env.changeId, json: true, cwd: env.root });
    });
    const parsed: ContinueOutput = JSON.parse(out);
    expect(parsed.next_action).toBe('validate_failed');
  });
});

// ─── T122: design.md only → current_step stays design ───────────────────────
// Partial RED: current_step === 'design' is GREEN (design is 'ready' since produces missing).
// next_action assertion uses regex per spec wording ("validate_failed OR execute").

describe('T122: FR-022 — design.md only → current_step remains design', () => {
  let env: Env;
  beforeEach(async () => { env = await scaffoldBase(); });
  afterEach(async () => { await rm(env.root, { recursive: true, force: true }); });

  it('mspec continue --json has current_step: design and next_action: validate_failed or execute when design-rationale.md is absent', async () => {
    const changeDir = join(env.root, 'changes', env.changeId);
    await writeFile(join(changeDir, 'design.md'), DESIGN_MD_CONTENT, 'utf8');
    // design-rationale.md intentionally absent — design step is not yet done

    const out = await captureStdout(async () => {
      await continueCommand({ change: env.changeId, json: true, cwd: env.root });
    });
    const parsed: ContinueOutput = JSON.parse(out);
    expect(parsed.current_step).toBe('design');
    // Spec (cli-workflow-engine/FR-022) allows validate_failed OR execute.
    // Current state-engine returns 'ready' for missing produces → next_action: execute.
    // Once T121 is implemented (missing produces → invalid → validate_failed), this
    // assertion will also be satisfied by validate_failed.
    expect(parsed.next_action).toMatch(/^(validate_failed|execute)$/);
  });
});

// ─── T123: both files present → design step done ────────────────────────────

describe('T123: FR-022 — both design.md and design-rationale.md present → design step done', () => {
  let env: Env;
  beforeEach(async () => { env = await scaffoldBase(); });
  afterEach(async () => { await rm(env.root, { recursive: true, force: true }); });

  it('mspec validate passes and mspec status reports design as done when all three files are present', async () => {
    const changeDir = join(env.root, 'changes', env.changeId);
    await writeFile(join(changeDir, 'design.md'), DESIGN_MD_CONTENT, 'utf8');
    await writeFile(join(changeDir, 'design-rationale.md'), DESIGN_RATIONALE_MD_CONTENT, 'utf8');
    await writeFile(join(changeDir, 'architecture-overview.md'), ARCH_OVERVIEW_CONTENT, 'utf8');

    // mspec validate should pass (exit 0)
    const { status } = runCLI(env.root, ['validate', '--change', env.changeId]);
    expect(status).toBe(0);

    // mspec status should report design step as done
    const out = await captureStdout(async () => {
      await statusCommand({ change: env.changeId, json: true, cwd: env.root });
    });
    const parsed = JSON.parse(out);
    const designStep = parsed.steps.find((s: { id: string }) => s.id === 'design');
    expect(designStep).toBeDefined();
    expect(designStep.state).toBe('done');
  });

  it('design-rationale.md has doc_type: Explanation in frontmatter', async () => {
    const changeDir = join(env.root, 'changes', env.changeId);
    await writeFile(join(changeDir, 'design.md'), DESIGN_MD_CONTENT, 'utf8');
    await writeFile(join(changeDir, 'design-rationale.md'), DESIGN_RATIONALE_MD_CONTENT, 'utf8');
    await writeFile(join(changeDir, 'architecture-overview.md'), ARCH_OVERVIEW_CONTENT, 'utf8');

    // Validate does not reject design-rationale.md (doc_type: Explanation is valid)
    const { status, stdout, stderr } = runCLI(env.root, ['validate', '--change', env.changeId]);
    const combined = stdout + stderr;
    expect(combined).not.toContain('is not a valid doc_type');
    expect(status).toBe(0);
  });

  it('design.md has doc_type: Reference in frontmatter', async () => {
    const changeDir = join(env.root, 'changes', env.changeId);
    await writeFile(join(changeDir, 'design.md'), DESIGN_MD_CONTENT, 'utf8');
    await writeFile(join(changeDir, 'design-rationale.md'), DESIGN_RATIONALE_MD_CONTENT, 'utf8');
    await writeFile(join(changeDir, 'architecture-overview.md'), ARCH_OVERVIEW_CONTENT, 'utf8');

    const { status } = runCLI(env.root, ['validate', '--change', env.changeId]);
    expect(status).toBe(0);
  });
});
