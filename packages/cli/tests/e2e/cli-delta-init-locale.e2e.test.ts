// @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/artifact-templates-i18n/spec.md
// Requirements implemented: FR-005
// Change: fix-locale-spec-language
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

interface Env {
  root: string;
  change: string;
}

async function setupProject(configYaml: string): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-locale-'));
  const change = '2026-05-17-test-locale';

  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(join(root, '.mspec', 'workflow.yaml'), WORKFLOW_YAML, 'utf8');
  await writeFile(join(root, '.mspec', 'config.yaml'), configYaml, 'utf8');
  await mkdir(join(root, 'changes', change), { recursive: true });
  await writeFile(join(root, 'changes', change, 'readme.md'), '# test\n', 'utf8');
  await mkdir(join(root, 'specs'), { recursive: true });

  return { root, change };
}

describe('delta init: locale 設定で Delta Spec スケルトンの本文が切り替わる', () => {
  let env: Env;

  afterEach(async () => {
    if (env) await rm(env.root, { recursive: true, force: true });
  });

  it('locale: ja の config で日本語の GIVEN/WHEN/THEN 補足が出力される', async () => {
    env = await setupProject(`version: 1\nlocale: "ja"\n`);

    await deltaInitCommand({ capability: 'search', change: env.change, cwd: env.root });

    const deltaPath = join(env.root, 'changes', env.change, 'specs', 'search', 'spec.md');
    const content = await readFile(deltaPath, 'utf8');

    expect(content).toContain('このシステムは SHALL');
    expect(content).toContain('<前提>');
    expect(content).toContain('<操作>');
    expect(content).toContain('<結果>');
    expect(content).toContain('# Delta Spec: search');
    expect(content).toContain('FR-001');
  });

  it('locale: en の config で英語の precondition/action/result 補足が出力される', async () => {
    env = await setupProject(`version: 1\nlocale: "en"\n`);

    await deltaInitCommand({ capability: 'search', change: env.change, cwd: env.root });

    const deltaPath = join(env.root, 'changes', env.change, 'specs', 'search', 'spec.md');
    const content = await readFile(deltaPath, 'utf8');

    expect(content).toContain('The system SHALL');
    expect(content).toContain('<precondition>');
    expect(content).toContain('<action>');
    expect(content).toContain('<result>');
  });

  it('locale 未指定の config では既定値 (ja) で日本語スケルトンが出力される', async () => {
    env = await setupProject(`version: 1\n`);

    await deltaInitCommand({ capability: 'search', change: env.change, cwd: env.root });

    const deltaPath = join(env.root, 'changes', env.change, 'specs', 'search', 'spec.md');
    const content = await readFile(deltaPath, 'utf8');

    expect(content).toContain('<前提>');
  });

  it('locale を引数で渡すと config よりも優先される', async () => {
    env = await setupProject(`version: 1\nlocale: "ja"\n`);

    await deltaInitCommand({
      capability: 'search',
      change: env.change,
      cwd: env.root,
      locale: 'en',
    });

    const deltaPath = join(env.root, 'changes', env.change, 'specs', 'search', 'spec.md');
    const content = await readFile(deltaPath, 'utf8');

    expect(content).toContain('<precondition>');
    expect(content).not.toContain('<前提>');
  });
});
