// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: artifact-language-config

import { describe, it, expect, beforeEach } from 'vitest';
import { loadMergedBank, filterQuestions, localizeQuestion, resetTranslationWarningCache } from './questions-bank.js';
import type { Question } from '../types/index.js';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';

describe('loadMergedBank', () => {
  it('loads the default proposal bank from cli-pkg templates', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'mspec-bank-'));
    const bank = await loadMergedBank('proposal', tmp);
    expect(bank.step).toBe('proposal');
    expect(bank.questions.length).toBeGreaterThan(0);
    expect(bank.sources.some((s) => s.endsWith('proposal.yaml'))).toBe(true);
  });

  it('returns an empty bank when neither default nor user file exists', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'mspec-bank-'));
    const bank = await loadMergedBank('nonexistent-step', tmp);
    expect(bank.questions).toEqual([]);
    expect(bank.sources).toEqual([]);
  });
});

describe('filterQuestions', () => {
  const fakeQs = [
    {
      id: 'A',
      category: 'functional_scope' as const,
      when: 'always',
      question: 'a',
      options: [],
      multi_select: false,
      recommend_first: false,
    },
    {
      id: 'B',
      category: 'ux' as const,
      when: "answers.A == 'yes'",
      question: 'b',
      options: [],
      multi_select: false,
      recommend_first: false,
    },
  ];

  it('includes always-questions and excludes unmet when expressions', () => {
    const filtered = filterQuestions(fakeQs, {});
    expect(filtered.map((q) => q.id)).toEqual(['A']);
  });

  it('includes when-conditional questions when context matches', () => {
    const filtered = filterQuestions(fakeQs, { A: 'yes' });
    expect(filtered.map((q) => q.id)).toEqual(['A', 'B']);
  });
});

function makeQ(overrides: Partial<Question>): Question {
  return {
    id: 'TEST-001', category: 'functional_scope', when: 'always',
    question: 'Default?', options: [], multi_select: false, recommend_first: false,
    ...overrides,
  };
}

describe('localizeQuestion — FR-001〜FR-004', () => {
  beforeEach(() => resetTranslationWarningCache());

  it('FR-001: per-locale question オブジェクトから active locale の文字列を返す', () => {
    const q = makeQ({ question: { ja: '日本語', en: 'English' } });
    expect(localizeQuestion(q, 'ja').question).toBe('日本語');
  });

  it('FR-001: per-locale options 配列から active locale の文字列配列を返す', () => {
    const q = makeQ({
      question: { ja: 'Q', en: 'Q' },
      options: [{ ja: 'A', en: 'A_en' }, { ja: 'B', en: 'B_en' }],
    });
    expect(localizeQuestion(q, 'ja').options).toEqual(['A', 'B']);
  });

  it('FR-002: 旧スカラ question は en 互換でそのまま返す（legacy）', () => {
    const q = makeQ({ question: 'Legacy scalar' });
    expect(localizeQuestion(q, 'ja').question).toBe('Legacy scalar');
  });

  it('FR-003: ja キーが欠落している場合 en フォールバックし、警告は1回のみ', () => {
    const msgs: string[] = [];
    const orig = process.stderr.write.bind(process.stderr);
    process.stderr.write = (c: string | Uint8Array) => { if (typeof c === 'string') msgs.push(c); return true; };
    try {
      const q = makeQ({ question: { en: 'English only' } });
      const r1 = localizeQuestion(q, 'ja');
      localizeQuestion(q, 'ja'); // 2nd call — no extra warning
      expect(r1.question).toBe('English only');
    } finally { process.stderr.write = orig; }
    expect(msgs.filter(m => m.includes('missing translation')).length).toBe(1);
  });

  it('FR-004: 旧スカラ options 配列はそのまま返す（legacy）', () => {
    const q = makeQ({ options: ['Opt A', 'Opt B'] });
    expect(localizeQuestion(q, 'ja').options).toEqual(['Opt A', 'Opt B']);
  });
});
