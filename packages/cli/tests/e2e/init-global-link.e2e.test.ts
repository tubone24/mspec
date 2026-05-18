// @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: init-link-global-bin

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INIT_TS = join(__dirname, '../../src/commands/init.ts');

describe('FR-001: ensureGlobalLink runs npm run build then npm link in dev-mode', () => {
  it('init.ts が ensureGlobalLink 関数をエクスポートしている', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain('export async function ensureGlobalLink');
  });

  it('init.ts が spawnSync を使用して npm run build を実行する', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain("'run', 'build'");
  });

  it('init.ts が spawnSync を使用して npm link を実行する', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain("'link'");
  });

  it('initCommand 末尾で ensureGlobalLink が呼ばれる（done ログの前）', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    const linkIdx = content.indexOf('await ensureGlobalLink()');
    const doneIdx = content.indexOf("'mspec init: done.'");
    expect(linkIdx).toBeGreaterThan(-1);
    expect(doneIdx).toBeGreaterThan(-1);
    expect(linkIdx).toBeLessThan(doneIdx);
  });
});

describe('FR-002: ensureGlobalLink skips when not in dev-mode', () => {
  it('init.ts が tsconfig.json の存在確認を dev-mode 検出に使用している', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain("'tsconfig.json'");
  });

  it('init.ts が package.json の存在確認を dev-mode 検出に使用している', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain("'package.json'");
  });
});

describe('FR-003: ensureGlobalLink warns and continues on build or link failure', () => {
  it('init.ts がビルド失敗時に console.warn を呼ぶ', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain('console.warn');
    expect(content).toContain('build failed');
  });

  it('init.ts がリンク失敗時に console.warn を呼ぶ', async () => {
    const content = await readFile(INIT_TS, 'utf8');
    expect(content).toContain('npm link failed');
  });
});
