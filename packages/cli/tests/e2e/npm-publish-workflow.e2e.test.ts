// @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/ci-cd/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: npm-publish-v0-1-beta
// @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/ci-cd/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: npm-publish-v0-1-beta

import { describe, it, expect } from 'vitest';
import { readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../../../..');

describe('FR-001/FR-002/FR-003: GitHub Actions publish.yml 設定', () => {
  const WORKFLOW_PATH = join(PROJECT_ROOT, '.github/workflows/publish.yml');

  it('publish.yml が存在すること', async () => {
    await expect(access(WORKFLOW_PATH)).resolves.toBeUndefined();
  });

  it("publish.yml に v* タグトリガーが設定されていること", async () => {
    const content = await readFile(WORKFLOW_PATH, 'utf8');
    expect(content).toContain("- 'v*'");
  });

  it('publish.yml に release.types: [released] トリガーが設定されていること', async () => {
    const content = await readFile(WORKFLOW_PATH, 'utf8');
    expect(content).toContain('[released]');
  });

  it('defaults.run.working-directory が packages/cli に設定されていること', async () => {
    const content = await readFile(WORKFLOW_PATH, 'utf8');
    expect(content).toContain('working-directory: packages/cli');
  });
});
