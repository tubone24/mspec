// @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/cli-delta-spec/spec.md
// Requirements implemented: FR-011
// Change: diataxis-artifact-structure

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { deltaInitCommand } from '../../src/commands/delta-init.js';

const WORKFLOW_YAML = `version: 1
name: test
description: test
steps:
  - id: new
    skill: mspec-new
    produces: [readme.md]
    block: true
    removable: false
`;

const MSPEC_CONFIG = `integrations:\n  claude:\n    enabled: true\n`;

interface Env {
  root: string;
  change: string;
}

async function setupProject(): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-shall-'));
  const change = '2026-05-14-test-shall-keyword';

  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(join(root, '.mspec', 'workflow.yaml'), WORKFLOW_YAML, 'utf8');
  await writeFile(join(root, '.mspec', 'config.yaml'), MSPEC_CONFIG, 'utf8');
  await mkdir(join(root, 'changes', change), { recursive: true });
  await writeFile(join(root, 'changes', change, 'readme.md'), '# test\n', 'utf8');
  await mkdir(join(root, 'specs'), { recursive: true });

  return { root, change };
}

// FR-011 Scenario 1: Default stub uses SHALL keyword (existing capability)
describe('FR-011: delta-init uses SHALL as default ADDED Requirement keyword', () => {
  let env: Env;

  beforeEach(async () => {
    env = await setupProject();
    // create an existing capability spec to simulate existing capability
    await mkdir(join(env.root, 'specs', 'theme-engine'), { recursive: true });
    await writeFile(
      join(env.root, 'specs', 'theme-engine', 'spec.md'),
      `# theme-engine Specification\n\n## Purpose\n\nTest.\n\n## Requirements\n\n### Requirement: FR-004 — Existing\nThe system SHALL do something.\n\n#### Scenario: s\n- GIVEN x\n- WHEN y\n- THEN z\n`,
      'utf8',
    );
  });

  afterEach(async () => {
    await rm(env.root, { recursive: true, force: true });
  });

  it('ADDED Requirement スタブが "The system SHALL" を含む (既存 capability)', async () => {
    await deltaInitCommand({ capability: 'theme-engine', change: env.change, cwd: env.root });

    const deltaPath = join(env.root, 'changes', env.change, 'specs', 'theme-engine', 'spec.md');
    const content = await readFile(deltaPath, 'utf8');
    expect(content).toContain('The system SHALL');
    expect(content).not.toContain('The system MUST');
  });
});

// FR-011 Scenario 2: New capability also uses SHALL stub
describe('FR-011: new capability delta-init uses SHALL stub', () => {
  let env: Env;

  beforeEach(async () => {
    env = await setupProject();
  });

  afterEach(async () => {
    await rm(env.root, { recursive: true, force: true });
  });

  it('ADDED Requirement スタブが "The system SHALL" を含む (新規 capability)', async () => {
    await deltaInitCommand({ capability: 'search', change: env.change, cwd: env.root });

    const deltaPath = join(env.root, 'changes', env.change, 'specs', 'search', 'spec.md');
    const content = await readFile(deltaPath, 'utf8');
    expect(content).toContain('The system SHALL');
    expect(content).not.toContain('The system MUST');
  });
});
