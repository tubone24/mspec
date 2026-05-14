import { describe, it, expect } from 'vitest';
import { loadMergedBank, filterQuestions } from './questions-bank.js';
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
