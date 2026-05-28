// @mspec-delta 2026-05-27-070619-dynamic-security-questions/specs/mspec-proposal/spec.md
// Requirements implemented: FR-001
// Change: dynamic-security-questions

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const PROPOSAL_YAML = join(ROOT, 'packages/cli/templates/questions/proposal.yaml');
const SKILL_MD = join(ROOT, '.claude/skills/mspec-proposal/SKILL.md');

// FR-001 Scenario: 固定質問が廃止されている
describe('FR-001: 固定 PRP-SEC-001〜004 が proposal.yaml から削除されている', () => {
  it('proposal.yaml に PRP-SEC-001 エントリが存在しない', async () => {
    const content = await readFile(PROPOSAL_YAML, 'utf8');
    expect(content).not.toContain('PRP-SEC-001');
  });

  it('proposal.yaml に PRP-SEC-004 エントリが存在しない', async () => {
    const content = await readFile(PROPOSAL_YAML, 'utf8');
    expect(content).not.toContain('PRP-SEC-004');
  });

  it('proposal.yaml に category: security のエントリが存在しない', async () => {
    const content = await readFile(PROPOSAL_YAML, 'utf8');
    expect(content).not.toContain('category: security');
  });
});

// FR-001 Scenario: SKILL.md から固定提示ロジックが削除されている
describe('FR-001: SKILL.md から PRP-SEC 固定提示の手順が削除されている', () => {
  it('SKILL.md に PRP-SEC-001〜004 の 4 問を必ず提示すること という記述が存在しない', async () => {
    const content = await readFile(SKILL_MD, 'utf8');
    expect(content).not.toContain('PRP-SEC-001〜004');
  });

  it('SKILL.md の ## Decisions 記録指示に PRP-SEC 固定 ID 参照が存在しない', async () => {
    const content = await readFile(SKILL_MD, 'utf8');
    expect(content).not.toContain('PRP-SEC-001〜004のsecurity質問の回答を記録すること');
  });
});
