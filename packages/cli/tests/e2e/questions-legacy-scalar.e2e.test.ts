// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
// Requirements implemented: FR-004
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

describe('FR-004: 旧スカラ表記の質問エントリが後方互換で動作する', () => {
  it('旧スカラ question は en 互換でそのまま返す', () => {
    const q = makeQ({ question: 'Legacy question string' });
    expect(localizeQuestion(q, 'ja').question).toBe('Legacy question string');
  });

  it('旧スカラ options 配列はそのまま返す', () => {
    const q = makeQ({ options: ['Option A', 'Option B'] });
    expect(localizeQuestion(q, 'ja').options).toEqual(['Option A', 'Option B']);
  });
});
