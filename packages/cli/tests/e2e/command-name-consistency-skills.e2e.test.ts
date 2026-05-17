// @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md
// Requirements implemented: FR-017
// Change: fix-command-name-consistency

import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const HYPHEN_SLASH_COMMAND = /(?<![a-zA-Z])\/mspec-[a-z]/;

async function collectViolations(dir: string, label: string): Promise<string[]> {
  const violations: string[] = [];
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return violations;
  }
  for (const file of files) {
    const filePath = join(dir, file);
    const content = await readFile(filePath, 'utf8').catch(() => '');
    const matches = content.match(new RegExp(HYPHEN_SLASH_COMMAND.source, 'g'));
    if (matches) {
      violations.push(`${label}/${file}: ${matches.join(', ')}`);
    }
  }
  return violations;
}

describe('FR-017: skill and command files SHALL use /mspec:<step> format only', () => {
  it('runtime SKILL.md files contain no /mspec-<step> slash command references', async () => {
    const skillsBase = join(ROOT, '.claude/skills');
    const skillDirs = await readdir(skillsBase);
    const violations: string[] = [];
    for (const skillDir of skillDirs) {
      const skillFile = join(skillsBase, skillDir, 'SKILL.md');
      const content = await readFile(skillFile, 'utf8').catch(() => '');
      const matches = content.match(new RegExp(HYPHEN_SLASH_COMMAND.source, 'g'));
      if (matches) {
        violations.push(`${skillDir}/SKILL.md: ${matches.join(', ')}`);
      }
    }
    expect(
      violations,
      `Hyphen-format /mspec-<step> found in skill files:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });

  it('runtime command .md files contain no /mspec-<step> slash command references', async () => {
    const commandsDir = join(ROOT, '.claude/commands/mspec');
    const violations = await collectViolations(commandsDir, '.claude/commands/mspec');
    expect(
      violations,
      `Hyphen-format /mspec-<step> found in command files:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });
});
