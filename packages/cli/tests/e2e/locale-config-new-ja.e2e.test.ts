// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-001
// Change: artifact-language-config

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { newCommand } from '../../src/commands/new.js';
import { loadConfig } from '../../src/workflow/config-loader.js';

async function setupProject(locale?: string): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-lc-new-ja-'));
  const mspecDir = join(cwd, '.mspec');
  await mkdir(mspecDir, { recursive: true });

  const localeField = locale ? `locale: ${locale}\n` : '';
  await writeFile(join(mspecDir, 'config.yaml'), `version: 1\n${localeField}`);

  // Create minimal template files: both .ja.md and .en.md
  const tplDir = join(cwd, '.mspec', 'templates', 'artifacts');
  await mkdir(tplDir, { recursive: true });
  await writeFile(join(tplDir, 'readme.ja.md'), '# {{changeName}}\n\n## リクエスト\n\n{{request}}\n\n## 成果物\n\n## スキップされたステップ\n');
  await writeFile(join(tplDir, 'readme.en.md'), '# {{changeName}}\n\n## Request\n\n{{request}}\n\n## Artifacts\n\n## Skipped Steps\n');
  await writeFile(join(tplDir, 'glossary.ja.md'), '---\ndoc_type: Reference\n---\n\n# 用語集\n\n## 用語\n\n| 用語 | 定義 |\n');
  await writeFile(join(tplDir, 'glossary.en.md'), '---\ndoc_type: Reference\n---\n\n# Glossary\n\n## Terms\n\n| Term | Definition |\n');

  // Create changes directory
  await mkdir(join(cwd, 'changes'), { recursive: true });
  return cwd;
}

describe('FR-001: locale:ja のとき readme.md が ja テンプレートから生成される', () => {
  it('config に locale: ja が設定されている場合、readme.ja.md テンプレートが選択される', async () => {
    const cwd = await setupProject('ja');
    await newCommand('test-feature', { cwd });

    const changes = await import('node:fs/promises').then(fs =>
      fs.readdir(join(cwd, 'changes'))
    );
    const changeDir = join(cwd, 'changes', changes[0]!);
    const readme = await readFile(join(changeDir, 'readme.md'), 'utf8');

    // ja テンプレートには「リクエスト」というセクション見出しがある
    expect(readme).toContain('リクエスト');
  });

  it('config に locale: en が設定されている場合、readme.en.md テンプレートが選択される', async () => {
    const cwd = await setupProject('en');
    await newCommand('test-feature', { cwd });

    const changes = await import('node:fs/promises').then(fs =>
      fs.readdir(join(cwd, 'changes'))
    );
    const changeDir = join(cwd, 'changes', changes[0]!);
    const readme = await readFile(join(changeDir, 'readme.md'), 'utf8');

    expect(readme).toContain('Request');
    expect(readme).not.toContain('リクエスト');
  });
});
