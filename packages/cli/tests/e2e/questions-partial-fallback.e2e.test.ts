// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
// Requirements implemented: FR-003
// Change: artifact-language-config

import { describe, it, expect, beforeEach } from 'vitest';
import { localizeQuestion, resetTranslationWarningCache } from '../../src/lib/questions-bank.js';
import type { Question } from '../../src/types/index.js';

function makeQ(overrides: Partial<Question>): Question {
  return {
    id: 'TEST-001', category: 'functional_scope', when: 'always',
    question: 'Default?', options: [], multi_select: false, recommend_first: false,
    ...overrides,
  };
}

describe('FR-003: 一部質問のみ ja 翻訳欠落のとき en フォールバック + 警告1回', () => {
  beforeEach(() => resetTranslationWarningCache());

  it('ja キーが欠落している場合 en フォールバックし、警告は1回のみ emit される', () => {
    const msgs: string[] = [];
    const orig = process.stderr.write.bind(process.stderr);
    process.stderr.write = (c: string | Uint8Array) => { if (typeof c === 'string') msgs.push(c); return true; };
    try {
      const q = makeQ({ question: { en: 'English only' } });
      const r = localizeQuestion(q, 'ja');
      localizeQuestion(q, 'ja'); // 2nd call — no extra warning
      expect(r.question).toBe('English only');
    } finally { process.stderr.write = orig; }
    expect(msgs.filter(m => m.includes('missing translation')).length).toBe(1);
  });
});
