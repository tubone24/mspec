// @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/artifact-templates-i18n/spec.md
// Requirements implemented: FR-005
// Change: fix-locale-spec-language

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { newCommand } from '../../src/commands/new.js';

async function setupProject(locale: string): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-i18n-ja-'));
  const mspecDir = join(cwd, '.mspec');
  await mkdir(mspecDir, { recursive: true });
  await writeFile(join(mspecDir, 'config.yaml'), `version: 1\nlocale: "${locale}"\n`);
  await mkdir(join(cwd, 'changes'), { recursive: true });
  return cwd;
}

describe('FR-005: artifact-templates-i18n — locale=ja で missing template 警告なし', () => {
  it('locale=ja の設定で mspec new 実行時に "missing template" 警告が出ない', async () => {
    const cwd = await setupProject('ja');
    const stderrMessages: string[] = [];
    const origStderr = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk: string | Uint8Array) => {
      if (typeof chunk === 'string') stderrMessages.push(chunk);
      return true;
    };
    try {
      await newCommand('test-feature', { cwd });
    } finally {
      process.stderr.write = origStderr;
      await rm(cwd, { recursive: true, force: true });
    }
    const missingWarnings = stderrMessages.filter((m) => m.includes('missing template'));
    expect(missingWarnings).toHaveLength(0);
  });
});
