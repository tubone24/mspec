// @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
// Requirements implemented: FR-001
// Change: fix-command-name-consistency

import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const HYPHEN_SLASH_COMMAND = /(?<![a-zA-Z])\/mspec-[a-z]/;

async function grepDir(dir: string, label: string): Promise<string[]> {
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

async function grepFile(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, 'utf8').catch(() => '');
  const matches = content.match(new RegExp(HYPHEN_SLASH_COMMAND.source, 'g'));
  return matches ? [matches.join(', ')] : [];
}

describe('FR-001: CLI templates and source SHALL use /mspec:<step> format only', () => {
  it('template command .md files contain no /mspec-<step> references', async () => {
    const dir = join(ROOT, 'packages/cli/templates/claude/commands/mspec');
    const violations = await grepDir(dir, 'templates/claude/commands/mspec');
    expect(
      violations,
      `Hyphen-format found in template command files:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });

  it('template SKILL.md files contain no /mspec-<step> references', async () => {
    const skillsBase = join(ROOT, 'packages/cli/templates/claude/skills');
    const skillDirs = await readdir(skillsBase).catch(() => [] as string[]);
    const violations: string[] = [];
    for (const skillDir of skillDirs) {
      const skillFile = join(skillsBase, skillDir, 'SKILL.md');
      const matches = await grepFile(skillFile);
      if (matches.length > 0) violations.push(`${skillDir}/SKILL.md: ${matches[0]}`);
    }
    expect(
      violations,
      `Hyphen-format found in template skill files:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });

  it('workflow.yaml command: fields use colon format', async () => {
    const workflowFile = join(ROOT, '.mspec/workflow.yaml');
    const violations = await grepFile(workflowFile);
    expect(
      violations,
      `Hyphen-format found in workflow.yaml: ${violations.join(', ')}`,
    ).toHaveLength(0);
  });

  it('workflow.default.yaml command: fields use colon format', async () => {
    const workflowFile = join(ROOT, 'packages/cli/templates/workflow.default.yaml');
    const violations = await grepFile(workflowFile);
    expect(
      violations,
      `Hyphen-format found in workflow.default.yaml: ${violations.join(', ')}`,
    ).toHaveLength(0);
  });

  it('CLI source init.ts contains no /mspec-<step> references', async () => {
    const violations = await grepFile(join(ROOT, 'packages/cli/src/commands/init.ts'));
    expect(violations, `Hyphen-format in init.ts: ${violations.join(', ')}`).toHaveLength(0);
  });

  it('CLI source new.ts contains no /mspec-<step> references', async () => {
    const violations = await grepFile(join(ROOT, 'packages/cli/src/commands/new.ts'));
    expect(violations, `Hyphen-format in new.ts: ${violations.join(', ')}`).toHaveLength(0);
  });
});
