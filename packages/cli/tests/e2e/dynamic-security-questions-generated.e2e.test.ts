// @mspec-delta 2026-05-27-070619-dynamic-security-questions/specs/mspec-proposal/spec.md
// Requirements implemented: FR-003, FR-004
// Change: dynamic-security-questions

import { describe, it, expect } from 'vitest';
import { readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const SKILL_MD = join(ROOT, '.claude/skills/mspec-proposal/SKILL.md');
const ANALYZER_AGENT = join(ROOT, '.claude/agents/mspec-security-analyzer.md');

// FR-003 Scenario: サブエージェントがコンテキストを分析する
describe('FR-003: mspec-security-analyzer エージェント定義が存在する', () => {
  it('.claude/agents/mspec-security-analyzer.md が作成されている', async () => {
    await expect(access(ANALYZER_AGENT)).resolves.toBeUndefined();
  });

  it('エージェント定義に specs/ スコープへの読み取り制約が記述されている', async () => {
    const content = await readFile(ANALYZER_AGENT, 'utf8');
    expect(content).toMatch(/specs\//);
  });

  it('エージェント定義に読み取り専用制約が記述されている', async () => {
    const content = await readFile(ANALYZER_AGENT, 'utf8');
    const hasReadOnly =
      /read.?only|読み取り専用|書き込み.*禁|ファイル.*書き込み.*行わ/i.test(content);
    expect(hasReadOnly).toBe(true);
  });
});

// FR-004 Scenario: 動的質問が提示される
describe('FR-004: SKILL.md にサブエージェント呼び出し手順が追加されている', () => {
  it('SKILL.md に手順 4a (mspec-security-analyzer 起動) の記述がある', async () => {
    const content = await readFile(SKILL_MD, 'utf8');
    expect(content).toContain('mspec-security-analyzer');
  });

  it('SKILL.md に動的質問を AskUserQuestion で提示する手順 4b の記述がある', async () => {
    const content = await readFile(SKILL_MD, 'utf8');
    const has4b = /4b|動的.*質問.*AskUserQuestion|AskUserQuestion.*動的/i.test(content);
    expect(has4b).toBe(true);
  });

  it('SKILL.md にセキュリティ質問数 3〜5 問の制約が記述されている', async () => {
    const content = await readFile(SKILL_MD, 'utf8');
    expect(content).toMatch(/3[〜～~]5\s*問|3.*5.*問/);
  });
});
