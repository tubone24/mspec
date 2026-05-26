// @mspec-delta 2026-05-19-022600-prepare-npm-publish-0-1-1/specs/cli-distribution/spec.md
// Requirements implemented: FR-003
// Change: prepare-npm-publish-0-1-1
// @mspec-delta 2026-05-21-075242-bump-cli-version-0-1-2/specs/cli-core/spec.md
// Requirements implemented: FR-005
// Change: bump-cli-version-0-1-2

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { parse as parseYaml } from 'yaml';

const PKG_DIR = resolve(__dirname, '..');
const REPO_ROOT = resolve(PKG_DIR, '..', '..');

describe('T101: npm pack tarball contents', () => {
  it('includes dist/, templates/, package.json, README.md, LICENSE only', () => {
    const out = execSync('npm pack --dry-run --json', {
      cwd: PKG_DIR,
      encoding: 'utf8',
    });
    const parsed = JSON.parse(out) as Array<{ files: Array<{ path: string }> }>;
    const files = parsed[0]!.files.map((f) => f.path);

    const pkg = JSON.parse(
      readFileSync(resolve(PKG_DIR, 'package.json'), 'utf8'),
    ) as { version: string };
    expect(pkg.version).toBe('0.1.3');

    expect(files.some((p) => p === 'package.json')).toBe(true);
    expect(files.some((p) => p === 'README.md')).toBe(true);
    expect(files.some((p) => p === 'LICENSE')).toBe(true);
    expect(files.some((p) => p.startsWith('dist/'))).toBe(true);
    expect(files.some((p) => p.startsWith('templates/'))).toBe(true);

    expect(files.some((p) => p.startsWith('src/'))).toBe(false);
    expect(files.some((p) => p.startsWith('node_modules/'))).toBe(false);
    expect(files.some((p) => p.startsWith('.claude/'))).toBe(false);
  });
});

// skip: 0.1.2 is already published; re-enable after next version bump
describe.skip('T102: npm publish --dry-run with --tag beta', () => {
  it('reports publish tag: beta (not latest)', () => {
    const out = execSync('npm publish --dry-run --tag beta 2>&1', {
      cwd: PKG_DIR,
      encoding: 'utf8',
    });
    expect(out).toMatch(/with\s+tag\s+beta/i);
    expect(out).not.toMatch(/with\s+tag\s+latest/i);
  });
});

describe('T103: .github/workflows/publish.yml static check', () => {
  it('triggers on tag push v* and runs npm publish --tag beta', () => {
    const yml = parseYaml(
      readFileSync(resolve(REPO_ROOT, '.github', 'workflows', 'publish.yml'), 'utf8'),
    ) as {
      on: { push: { tags: string[] } };
      defaults: { run: { 'working-directory': string } };
      jobs: { publish: { steps: Array<{ run?: string }> } };
    };

    expect(yml.on.push.tags).toContain('v*');
    expect(yml.defaults.run['working-directory']).toBe('packages/cli');

    const runCommands = yml.jobs.publish.steps
      .map((s) => s.run)
      .filter((x): x is string => typeof x === 'string');
    expect(runCommands.some((c) => /npm publish.*--tag\s+beta/.test(c))).toBe(true);
  });
});
