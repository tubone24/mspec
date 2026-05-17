// @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
// Requirements implemented: FR-001
// Change: fix-command-name-consistency
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { archiveCommand } from './archive.js';

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

const SOURCE_SPEC = `# Capability: theme-engine

<!-- mspec: gaps in FR numbering are intentional. Removed in changes/archive/ -->

## Purpose

The theme engine.

## Requirements

### Requirement: FR-001 — Theme picker
The system MUST allow theme selection.

#### Scenario: Pick a theme
- GIVEN themes
- WHEN picked
- THEN applied

### Requirement: FR-002 — Persistence
The system MUST persist the theme.

#### Scenario: Persist on reload
- GIVEN a chosen theme
- WHEN reload
- THEN reapplied
`;

const DELTA_SPEC = `# Delta Spec: theme-engine

## ADDED Requirements

### Requirement: FR-003 — Hot reload
The system SHOULD reload on change.

#### Scenario: Reload on file change
- GIVEN watched file
- WHEN changed
- THEN reload
`;

interface Env {
  root: string;
  change: string;
}

async function setupProject(): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-archive-'));
  const change = '2026-05-14-093015-add-hot-reload';

  // .mspec/workflow.yaml
  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(join(root, '.mspec', 'workflow.yaml'), WORKFLOW_YAML, 'utf8');

  // Source spec
  await mkdir(join(root, 'specs', 'theme-engine'), { recursive: true });
  await writeFile(join(root, 'specs', 'theme-engine', 'spec.md'), SOURCE_SPEC, 'utf8');

  // Change dir with delta spec
  await mkdir(join(root, 'changes', change, 'specs', 'theme-engine'), { recursive: true });
  await writeFile(
    join(root, 'changes', change, 'specs', 'theme-engine', 'spec.md'),
    DELTA_SPEC,
    'utf8',
  );
  await writeFile(join(root, 'changes', change, 'readme.md'), '# change\n', 'utf8');

  return { root, change };
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

describe('archiveCommand', () => {
  let env: Env;

  beforeEach(async () => {
    env = await setupProject();
  });

  afterEach(async () => {
    await rm(env.root, { recursive: true, force: true });
  });

  it('merges delta into source spec and moves change to archive/', async () => {
    const result = await archiveCommand({ change: env.change, yes: true, cwd: env.root });
    expect(result.errors).toEqual([]);
    expect(result.merged.length).toBe(1);
    expect(result.merged[0]!.capability).toBe('theme-engine');
    expect(result.merged[0]!.summary.added).toBe(1);

    // Source spec updated
    const updated = await readFile(join(env.root, 'specs', 'theme-engine', 'spec.md'), 'utf8');
    expect(updated).toContain('### Requirement: FR-003 — Hot reload');
    expect(updated).toContain('### Requirement: FR-001 — Theme picker');

    // Change moved
    expect(await exists(join(env.root, 'changes', env.change))).toBe(false);
    expect(await exists(join(env.root, 'changes', 'archive', env.change))).toBe(true);
    // Delta spec still present in archived dir
    expect(
      await exists(
        join(env.root, 'changes', 'archive', env.change, 'specs', 'theme-engine', 'spec.md'),
      ),
    ).toBe(true);
  });

  it('dry-run does not modify any file', async () => {
    const before = await readFile(
      join(env.root, 'specs', 'theme-engine', 'spec.md'),
      'utf8',
    );
    const result = await archiveCommand({
      change: env.change,
      dryRun: true,
      yes: true,
      cwd: env.root,
    });
    expect(result.errors).toEqual([]);
    expect(result.dryRun).toBe(true);
    expect(result.merged[0]!.summary.added).toBe(1);

    const after = await readFile(
      join(env.root, 'specs', 'theme-engine', 'spec.md'),
      'utf8',
    );
    expect(after).toBe(before);
    // Change NOT moved
    expect(await exists(join(env.root, 'changes', env.change))).toBe(true);
    expect(await exists(join(env.root, 'changes', 'archive', env.change))).toBe(false);
  });

  it('fails when change is already archived', async () => {
    // Move it manually first
    await mkdir(join(env.root, 'changes', 'archive'), { recursive: true });
    const { rename } = await import('node:fs/promises');
    await rename(
      join(env.root, 'changes', env.change),
      join(env.root, 'changes', 'archive', env.change),
    );

    await expect(
      archiveCommand({ change: env.change, yes: true, cwd: env.root }),
    ).rejects.toThrow(/already archived|not found/i);
  });

  it('creates a new source spec when the capability has none', async () => {
    // Remove the source spec
    await rm(join(env.root, 'specs', 'theme-engine'), { recursive: true, force: true });
    // Delta needs to be ADDED with FR-001 (since target is fresh)
    const freshDelta = `# Delta Spec: theme-engine

## ADDED Requirements

### Requirement: FR-001 — Theme picker
body

#### Scenario: pick
- GIVEN themes
- WHEN picked
- THEN applied
`;
    await writeFile(
      join(env.root, 'changes', env.change, 'specs', 'theme-engine', 'spec.md'),
      freshDelta,
      'utf8',
    );

    const result = await archiveCommand({ change: env.change, yes: true, cwd: env.root });
    expect(result.errors).toEqual([]);
    expect(result.merged[0]!.summary.added).toBe(1);

    const created = await readFile(
      join(env.root, 'specs', 'theme-engine', 'spec.md'),
      'utf8',
    );
    expect(created).toContain('# Capability: theme-engine');
    expect(created).toContain('### Requirement: FR-001 — Theme picker');
  });

  it('aborts without writing when delta parse has warnings', async () => {
    // Write an invalid delta spec (H3 without Requirement: FR-NNN — Title)
    await writeFile(
      join(env.root, 'changes', env.change, 'specs', 'theme-engine', 'spec.md'),
      `# Delta Spec: theme-engine\n\n## ADDED Requirements\n\n### Not a valid requirement heading\n`,
      'utf8',
    );

    const before = await readFile(
      join(env.root, 'specs', 'theme-engine', 'spec.md'),
      'utf8',
    );
    await expect(
      archiveCommand({ change: env.change, yes: true, cwd: env.root }),
    ).rejects.toThrow();
    const after = await readFile(
      join(env.root, 'specs', 'theme-engine', 'spec.md'),
      'utf8',
    );
    expect(after).toBe(before);
    // Not moved
    expect(await exists(join(env.root, 'changes', env.change))).toBe(true);
  });
});
