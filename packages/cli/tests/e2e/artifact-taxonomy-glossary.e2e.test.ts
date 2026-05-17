// @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-003
// Change: diataxis-artifact-structure

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { newCommand } from '../../src/commands/new.js';
import { parseFrontmatter } from '../../src/parser/frontmatter.js';

const MSPEC_CONFIG = `integrations:
  claude:
    enabled: true
`;

interface Env {
  root: string;
}

async function setupProject(): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-glossary-'));
  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(join(root, '.mspec', 'config.yaml'), MSPEC_CONFIG, 'utf8');
  await writeFile(join(root, '.mspec', 'workflow.yaml'), `version: 1\nname: test\ndescription: test\nsteps:\n  - id: new\n    skill: mspec-new\n    produces: [readme.md]\n    block: true\n    removable: false\n`, 'utf8');
  await mkdir(join(root, 'changes'), { recursive: true });
  return { root };
}

// FR-003 Scenario 1: glossary.md is present in a newly created change directory
describe('FR-003: mspec new generates glossary.md', () => {
  let env: Env;

  beforeEach(async () => {
    env = await setupProject();
  });

  afterEach(async () => {
    await rm(env.root, { recursive: true, force: true });
  });

  it('glossary.md が change ディレクトリに生成される', async () => {
    await newCommand('my-feature', { cwd: env.root } as Parameters<typeof newCommand>[1]);

    const changeDirs = await import('node:fs/promises').then((fs) =>
      fs.readdir(join(env.root, 'changes')),
    );
    expect(changeDirs.length).toBeGreaterThan(0);
    const changeDir = join(env.root, 'changes', changeDirs[0]!);

    const glossaryPath = join(changeDir, 'glossary.md');
    const content = await readFile(glossaryPath, 'utf8');
    expect(content).toBeTruthy();
  });

  it('生成された glossary.md は ## Terms セクションを含む', async () => {
    await newCommand('my-feature', { cwd: env.root } as Parameters<typeof newCommand>[1]);

    const changeDirs = await import('node:fs/promises').then((fs) =>
      fs.readdir(join(env.root, 'changes')),
    );
    const changeDir = join(env.root, 'changes', changeDirs[0]!);
    const content = await readFile(join(changeDir, 'glossary.md'), 'utf8');
    expect(content).toContain('## Terms');
  });

  it('生成された glossary.md は doc_type: Reference フロントマターを持つ', async () => {
    await newCommand('my-feature', { cwd: env.root } as Parameters<typeof newCommand>[1]);

    const changeDirs = await import('node:fs/promises').then((fs) =>
      fs.readdir(join(env.root, 'changes')),
    );
    const changeDir = join(env.root, 'changes', changeDirs[0]!);
    const content = await readFile(join(changeDir, 'glossary.md'), 'utf8');
    const { data } = parseFrontmatter(content);
    expect(data.doc_type).toBe('Reference');
  });
});

// FR-003 Scenario 2: research.md template refers to glossary.md
describe('FR-003: research.md template refers to glossary.md', () => {
  it('research.md テンプレートに glossary.md への参照が含まれる', async () => {
    const { dirname, join: pjoin } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const templatePath = pjoin(__dirname, '../../templates/artifacts/research.md');
    const content = await readFile(templatePath, 'utf8');
    expect(content.toLowerCase()).toMatch(/glossary/);
  });
});
