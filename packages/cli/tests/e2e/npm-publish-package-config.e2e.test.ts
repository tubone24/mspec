// @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md
// Requirements implemented: FR-001
// Change: npm-publish-v0-1-beta
// @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: npm-publish-v0-1-beta
// @mspec-delta 2026-05-19-022600-prepare-npm-publish-0-1-1/specs/cli-distribution/spec.md
// Requirements implemented: FR-003
// Change: prepare-npm-publish-0-1-1

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = join(__dirname, '../..');

describe('FR-001: npm パッケージ公開設定 (package.json)', () => {
  it('package.json に publishConfig.access が "public" で設定されていること', async () => {
    const pkg = JSON.parse(await readFile(join(CLI_ROOT, 'package.json'), 'utf8'));
    expect(pkg.publishConfig).toBeDefined();
    expect(pkg.publishConfig.access).toBe('public');
  });

  it('package.json の version が semver (X.Y.Z 形式) であること', async () => {
    const pkg = JSON.parse(await readFile(join(CLI_ROOT, 'package.json'), 'utf8'));
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/);
  });

  it('package.json の files フィールドに dist と templates が含まれること', async () => {
    const pkg = JSON.parse(await readFile(join(CLI_ROOT, 'package.json'), 'utf8'));
    expect(pkg.files).toContain('dist');
    expect(pkg.files).toContain('templates');
  });
});
