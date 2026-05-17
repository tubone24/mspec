// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: artifact-language-config

import { z } from 'zod';

export const QUESTION_CATEGORIES = [
  'functional_scope',
  'data_model',
  'ux',
  'nfr',
  'integration',
  'edge_cases',
  'constraints',
  'terminology',
  'completion',
] as const;
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

const LocalizedStringSchema = z.union([z.string(), z.record(z.string())]);

export const QuestionSchema = z.object({
  id: z.string(),
  category: z.enum(QUESTION_CATEGORIES),
  when: z.string().default('always'),
  question: LocalizedStringSchema,
  options: z
    .union([z.array(LocalizedStringSchema), z.literal('dynamic')])
    .default([]),
  multi_select: z.boolean().default(false),
  recommend_first: z.boolean().default(false),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuestionBankSchema = z.object({
  version: z.literal(1),
  step: z.string(),
  questions: z.array(QuestionSchema).default([]),
});
export type QuestionBank = z.infer<typeof QuestionBankSchema>;
