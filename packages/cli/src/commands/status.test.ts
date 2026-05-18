// @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/language-config/spec.md
// Requirements implemented: FR-005
// Change: fix-locale-spec-language

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { statusCommand } from './status.js';

const WORKFLOW_YAML = `version: 1
name: test
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
    skippable: true
  - id: delta
    command: /mspec:delta
    skill: mspec-delta
    produces: [specs/spec.md]
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

async function setupProject(configYaml?: string): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-status-test-'));
  await mkdir(join(cwd, '.mspec'), { recursive: true });
  await writeFile(join(cwd, '.mspec', 'workflow.yaml'), WORKFLOW_YAML);
  if (configYaml !== undefined) {
    await writeFile(join(cwd, '.mspec', 'config.yaml'), configYaml);
  }
  const changeDir = join(cwd, 'changes', '2026-01-01-test-change');
  await mkdir(changeDir, { recursive: true });
  await writeFile(join(changeDir, 'readme.md'), '# test\n');
  return cwd;
}

describe('statusCommand — locale フィールド (FR-005)', () => {
  it('locale: ja 設定時に JSON 出力に "locale": "ja" が含まれる', async () => {
    const cwd = await setupProject('version: 1\nlocale: "ja"\n');
    const chunks: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    (process.stdout.write as unknown) = (chunk: string) => {
      chunks.push(chunk);
      return true;
    };
    try {
      await statusCommand({ change: '2026-01-01-test-change', json: true, cwd } as Parameters<typeof statusCommand>[0] & { cwd?: string });
    } finally {
      (process.stdout.write as unknown) = origWrite;
    }
    const output = JSON.parse(chunks.join(''));
    expect(output).toHaveProperty('locale', 'ja');
  });

  it('config.yaml に locale キーがない場合、デフォルト "ja" が返る', async () => {
    const cwd = await setupProject('version: 1\n');
    const chunks: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    (process.stdout.write as unknown) = (chunk: string) => {
      chunks.push(chunk);
      return true;
    };
    try {
      await statusCommand({ change: '2026-01-01-test-change', json: true, cwd } as Parameters<typeof statusCommand>[0] & { cwd?: string });
    } finally {
      (process.stdout.write as unknown) = origWrite;
    }
    const output = JSON.parse(chunks.join(''));
    expect(output).toHaveProperty('locale', 'ja');
  });
});
