// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
// Requirements implemented: FR-001
// Change: artifact-language-config

import { describe, it, expect } from 'vitest';
import { localizeQuestion } from '../../src/lib/questions-bank.js';
import type { Question } from '../../src/types/index.js';

function makeQ(overrides: Partial<Question>): Question {
  return {
    id: 'TEST-001', category: 'functional_scope', when: 'always',
    question: 'Default?', options: [], multi_select: false, recommend_first: false,
    ...overrides,
  };
}

describe('FR-001: locale:ja のとき質問が日本語で返る', () => {
  it('question が per-locale オブジェクトの場合 active locale の文字列を返す', () => {
    const q = makeQ({ question: { ja: '日本語の質問', en: 'English question' } });
    const result = localizeQuestion(q, 'ja');
    expect(result.question).toBe('日本語の質問');
  });

  it('options が per-locale オブジェクト配列の場合 active locale の文字列配列を返す', () => {
    const q = makeQ({
      question: { ja: '質問', en: 'Q' },
      options: [{ ja: '選択肢A', en: 'Option A' }],
    });
    expect(localizeQuestion(q, 'ja').options).toEqual(['選択肢A']);
    expect(localizeQuestion(q, 'en').options).toEqual(['Option A']);
  });
});
