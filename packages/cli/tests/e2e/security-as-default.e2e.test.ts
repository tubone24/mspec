// @mspec-delta 2026-05-25-051411-security-as-default/specs/question-bank/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: security-as-default

// @mspec-delta 2026-05-25-051411-security-as-default/specs/delta-spec-template/spec.md
// Requirements implemented: FR-001, FR-002
// Change: security-as-default

// @mspec-delta 2026-05-25-051411-security-as-default/specs/constitution/spec.md
// Requirements implemented: FR-001, FR-002
// Change: security-as-default

// @mspec-delta 2026-05-25-051411-security-as-default/specs/mspec-proposal/spec.md
// Requirements implemented: FR-001, FR-002
// Change: security-as-default

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { loadMergedBank } from '../../src/lib/questions-bank.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const TEMPLATES = join(ROOT, 'packages/cli/templates');
const MEMORY = join(ROOT, 'memory');

// Helper: load questions from default templates only (no project override)
async function loadDefaultProposalQuestions() {
  const tmp = await mkdtemp(join(tmpdir(), 'mspec-sec-test-'));
  const bank = await loadMergedBank('proposal', tmp);
  return bank.questions;
}

// --- question-bank ---
// NOTE: PRP-SEC-001〜004 は dynamic-security-questions change で削除済み。
// セキュリティ質問は mspec-security-analyzer サブエージェントが動的生成する。

describe('FR-001 / FR-002 (superseded by dynamic-security-questions): proposal.yaml の security カテゴリ固定4問が削除されている', () => {
  it('question-bank に PRP-SEC-001〜004 が含まれない（動的生成に移行済み）', async () => {
    const qs = await loadDefaultProposalQuestions();
    const securityQs = qs.filter((q) => q.id?.startsWith('PRP-SEC-'));
    expect(securityQs).toHaveLength(0);
  });
});

// --- delta-spec-template ---

describe('FR-001 (delta-spec-template): 3つの delta-spec テンプレートに ## Security Capabilities セクションが存在する', () => {
  it('delta-spec.ja.md に ## Security Capabilities が存在する', async () => {
    const content = await readFile(join(TEMPLATES, 'artifacts/delta-spec.ja.md'), 'utf8');
    expect(content).toContain('## Security Capabilities');
  });

  it('delta-spec.en.md に ## Security Capabilities が存在する', async () => {
    const content = await readFile(join(TEMPLATES, 'artifacts/delta-spec.en.md'), 'utf8');
    expect(content).toContain('## Security Capabilities');
  });

  it('delta-spec.md に ## Security Capabilities が存在する', async () => {
    const content = await readFile(join(TEMPLATES, 'artifacts/delta-spec.md'), 'utf8');
    expect(content).toContain('## Security Capabilities');
  });

  it('delta-spec.ja.md の ## Security Capabilities は ## ADDED Requirements より前に配置される', async () => {
    const content = await readFile(join(TEMPLATES, 'artifacts/delta-spec.ja.md'), 'utf8');
    const secPos = content.indexOf('## Security Capabilities');
    const addedPos = content.indexOf('## ADDED Requirements');
    expect(secPos).toBeGreaterThanOrEqual(0);
    expect(secPos).toBeLessThan(addedPos);
  });
});

// --- constitution ---

describe('FR-001 (constitution): memory/constitution.md に ### VI. Security by Default が存在する', () => {
  it('memory/constitution.md に VI. Security by Default が存在する', async () => {
    const content = await readFile(join(MEMORY, 'constitution.md'), 'utf8');
    expect(content).toContain('### VI. Security by Default');
  });

  it('memory/constitution.md の Version が 1.1.0 に更新されている', async () => {
    const content = await readFile(join(MEMORY, 'constitution.md'), 'utf8');
    expect(content).toContain('Version: 1.1.0');
  });
});

describe('FR-002 (constitution): templates/constitution.md に ### VI. Security by Default が存在する', () => {
  it('templates/constitution.md に VI. Security by Default が存在する', async () => {
    const content = await readFile(join(TEMPLATES, 'constitution.md'), 'utf8');
    expect(content).toContain('### VI. Security by Default');
  });
});

// --- mspec-proposal SKILL ---

describe('FR-001 (mspec-proposal): SKILL.md にサブエージェント呼び出し手順が存在する', () => {
  it('SKILL.md に mspec-security-analyzer への言及がある（動的生成移行後）', async () => {
    const content = await readFile(
      join(TEMPLATES, 'claude/skills/mspec-proposal/SKILL.md'),
      'utf8',
    );
    expect(content).toContain('mspec-security-analyzer');
  });

  it('SKILL.md に security-as-default の @mspec-delta アンカーがある', async () => {
    const content = await readFile(
      join(TEMPLATES, 'claude/skills/mspec-proposal/SKILL.md'),
      'utf8',
    );
    expect(content).toContain('security-as-default');
  });
});
