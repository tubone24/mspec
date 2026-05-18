// @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md
// Requirements implemented: FR-001
// Change: npm-publish-v0-1-beta

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = join(__dirname, '../..');

describe('FR-001: src/index.ts のバージョン動的参照', () => {
  it('src/index.ts が createRequire を使ってバージョンを動的参照していること', async () => {
    const source = await readFile(join(CLI_ROOT, 'src/index.ts'), 'utf8');
    expect(source).toContain('createRequire');
  });

  it('src/index.ts が import.meta.url を使っていること', async () => {
    const source = await readFile(join(CLI_ROOT, 'src/index.ts'), 'utf8');
    expect(source).toContain('import.meta.url');
  });
});
