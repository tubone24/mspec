// @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-archive/spec.md
// Requirements implemented: FR-013, FR-014
// Change: claude-core-completion

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { archiveCommand, printReport } from '../../src/commands/archive.js';

const WORKFLOW_YAML = `version: 1
name: mspec-test
description: minimal workflow for archive tests
steps:
  - id: new
    command: /mspec:new
    skill: mspec-new
    produces: [readme.md]
    block: true
    removable: false
  - id: proposal
    command: /mspec:proposal
    skill: mspec-proposal
    produces: [proposal.md]
    block: true
    removable: false
  - id: delta
    command: /mspec:delta
    skill: mspec-delta
    produces: ["specs/*/spec.md"]
    block: false
    removable: false
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

const SOURCE_SPEC_ANCHOR = `# Capability: cli-anchor

## Purpose

The anchor capability.

## Requirements

### Requirement: FR-010 — Existing requirement
The system MUST do something.

#### Scenario: something
- GIVEN context
- WHEN action
- THEN result
`;

const SOURCE_SPEC_ARCHIVE = `# Capability: cli-archive

## Purpose

The archive capability.

## Requirements

### Requirement: FR-010 — Existing archive requirement
The system MUST archive correctly.

#### Scenario: archives
- GIVEN change
- WHEN archived
- THEN done
`;

const DELTA_ANCHOR = `# Delta Spec: cli-anchor

## ADDED Requirements

### Requirement: FR-015 — First added
Body text.

#### Scenario: first
- GIVEN context
- WHEN action
- THEN result

### Requirement: FR-016 — Second added
Body text.

#### Scenario: second
- GIVEN context
- WHEN action
- THEN result

## MODIFIED Requirements

### Requirement: FR-010 — Existing requirement
Modified body.

#### Scenario: something
- GIVEN context
- WHEN action
- THEN result
`;

const DELTA_ARCHIVE = `# Delta Spec: cli-archive

## ADDED Requirements

### Requirement: FR-013 — First archive added
Body text.

#### Scenario: archive added
- GIVEN context
- WHEN action
- THEN result
`;

interface Env {
  root: string;
  change: string;
}

async function setupProject(): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-archive-summary-'));
  const change = '2026-05-14-093015-test-summary';

  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(join(root, '.mspec', 'workflow.yaml'), WORKFLOW_YAML, 'utf8');

  await mkdir(join(root, 'specs', 'cli-anchor'), { recursive: true });
  await writeFile(join(root, 'specs', 'cli-anchor', 'spec.md'), SOURCE_SPEC_ANCHOR, 'utf8');
  await mkdir(join(root, 'specs', 'cli-archive'), { recursive: true });
  await writeFile(join(root, 'specs', 'cli-archive', 'spec.md'), SOURCE_SPEC_ARCHIVE, 'utf8');

  await mkdir(join(root, 'changes', change, 'specs', 'cli-anchor'), { recursive: true });
  await writeFile(
    join(root, 'changes', change, 'specs', 'cli-anchor', 'spec.md'),
    DELTA_ANCHOR,
    'utf8',
  );
  await mkdir(join(root, 'changes', change, 'specs', 'cli-archive'), { recursive: true });
  await writeFile(
    join(root, 'changes', change, 'specs', 'cli-archive', 'spec.md'),
    DELTA_ARCHIVE,
    'utf8',
  );
  await writeFile(join(root, 'changes', change, 'readme.md'), '# change\n', 'utf8');

  return { root, change };
}

describe('FR-013: printReport includes capability summary lines', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject();
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('サマリ行に capability ごとの件数が並ぶ', async () => {
    const result = await archiveCommand({ change: env.change, yes: true, cwd: env.root });
    printReport(result.merged, result.change, result.moved, false);

    const joined = output.join('\n');
    // cli-anchor: +2 ~1 -0 ⇄0
    expect(joined).toMatch(/cli-anchor: \+2 ~1 -0 ⇄0/);
    // cli-archive: +1 ~0 -0 ⇄0
    expect(joined).toMatch(/cli-archive: \+1 ~0 -0 ⇄0/);
  });

  it('再実行でサマリがバイト一致する', async () => {
    const result = await archiveCommand({ change: env.change, yes: true, cwd: env.root });
    printReport(result.merged, result.change, result.moved, false);
    const first = [...output];

    output = [];
    printReport(result.merged, result.change, result.moved, false);
    const second = [...output];

    expect(first.join('\n')).toBe(second.join('\n'));
  });
});

describe('FR-014: dry-run output has preview header and no summary', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject();
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('dry-run 出力はプレビューヘッダを持ちサマリ行を含まない', async () => {
    const result = await archiveCommand({ change: env.change, dryRun: true, yes: true, cwd: env.root });
    printReport(result.merged, result.change, result.moved, true);

    const joined = output.join('\n');
    // Should have dry-run preview header
    expect(joined).toMatch(/dry-run\s*preview|dry-run preview/i);
    // Should NOT have the summary format
    expect(joined).not.toMatch(/cli-anchor: \+\d/);
    expect(joined).not.toMatch(/cli-archive: \+\d/);
  });
});
