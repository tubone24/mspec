// @mspec-delta 2026-05-28-113128-init-gitignore-ui-pid/specs/cli-init/spec.md
// Requirements implemented: FR-012
// Change: init-gitignore-ui-pid

import { describe, it, expect } from 'vitest';
import { readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INIT_TS = join(__dirname, '../../src/commands/init.ts');
const TEMPLATE_DIR = join(__dirname, '../../templates');

// T002-S1: Fresh init creates .mspec/.gitignore with ui.pid line
describe('T002-S1: FR-012 — mspec init creates .mspec/.gitignore', () => {
  it('templates/mspec-gitignore テンプレートファイルが存在する', async () => {
    const templatePath = join(TEMPLATE_DIR, 'mspec-gitignore');
    await expect(access(templatePath)).resolves.toBeUndefined();
  });

  it('templates/mspec-gitignore に ui.pid 行が含まれる', async () => {
    const templatePath = join(TEMPLATE_DIR, 'mspec-gitignore');
    const content = await readFile(templatePath, 'utf8');
    expect(content).toContain('ui.pid');
  });

  it('init.ts が .mspec/.gitignore を plan に追加している', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain("'.mspec', '.gitignore'");
  });

  it('init.ts が mspec-gitignore テンプレートを参照している', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain("'mspec-gitignore'");
  });
});

// T002-S2: Existing .mspec/.gitignore is not overwritten without --force
describe('T002-S2: FR-012 — collisions check protects existing .mspec/.gitignore', () => {
  it('init.ts の collisions チェックが plan の各 to パスの存在確認を行う', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain('p.to');
    expect(content).toContain('collisions');
  });
});

// T002-S3: mspec init --force regenerates .mspec/.gitignore
describe('T002-S3: FR-012 — --force re-generates .mspec/.gitignore', () => {
  it('init.ts の --force フラグが collisions チェックをスキップする', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain('force');
    expect(content).toContain('collisions.length > 0 && !force');
  });

  it('init.ts の writeFile ループが plan の全エントリを書き込む（--force 時も同様）', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain('for (const p of plan)');
    expect(content).toContain('writeFile(p.to');
  });
});
