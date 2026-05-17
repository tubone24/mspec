// @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
// Requirements implemented: FR-002
// Change: fix-command-name-consistency

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const HYPHEN_SLASH_COMMAND = /(?<![a-zA-Z])\/mspec-[a-z]/g;

async function checkFile(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, 'utf8').catch(() => '');
  const matches = content.match(HYPHEN_SLASH_COMMAND);
  return matches ?? [];
}

describe('FR-002: documentation files SHALL use /mspec:<step> format only', () => {
  it('README.md contains no /mspec-<step> slash command references', async () => {
    const violations = await checkFile(join(ROOT, 'README.md'));
    expect(
      violations,
      `Hyphen-format found in README.md: ${violations.join(', ')}`,
    ).toHaveLength(0);
  });

  it('docs/design/mspec-design.md contains no /mspec-<step> references', async () => {
    const violations = await checkFile(join(ROOT, 'docs/design/mspec-design.md'));
    expect(
      violations,
      `Hyphen-format found in mspec-design.md: ${violations.join(', ')}`,
    ).toHaveLength(0);
  });

  it('specs/claude-integration/spec.md contains no /mspec-<step> references', async () => {
    const violations = await checkFile(join(ROOT, 'specs/claude-integration/spec.md'));
    expect(
      violations,
      `Hyphen-format found in claude-integration/spec.md: ${violations.join(', ')}`,
    ).toHaveLength(0);
  });

  it('specs/cli-init/spec.md contains no /mspec-<step> references', async () => {
    const violations = await checkFile(join(ROOT, 'specs/cli-init/spec.md'));
    expect(
      violations,
      `Hyphen-format found in cli-init/spec.md: ${violations.join(', ')}`,
    ).toHaveLength(0);
  });
});
