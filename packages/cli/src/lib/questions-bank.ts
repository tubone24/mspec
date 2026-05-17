// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: artifact-language-config

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import pc from 'picocolors';
import { QuestionBankSchema, type Question, type QuestionBank } from '../types/index.js';
import { fileExists } from './change-discovery.js';
import { projectPaths } from '../workflow/paths.js';

const translationWarnCache = new Set<string>();

/** Reset translation warning dedup cache (for testing). */
export function resetTranslationWarningCache(): void {
  translationWarnCache.clear();
}

/** Localize a question's text fields to the active locale. Falls back to 'en'. */
export function localizeQuestion(q: Question, locale: string): Question {
  const localizeField = (field: string | Record<string, string>): string => {
    if (typeof field === 'string') return field; // legacy scalar → en-compatible
    if (locale in field) return field[locale]!;
    // Fallback to 'en'
    const key = `${locale}:${q.id}`;
    if (!translationWarnCache.has(key)) {
      translationWarnCache.add(key);
      process.stderr.write(
        pc.yellow(`missing translation: ${q.id} for locale '${locale}'\n`),
      );
    }
    return (field['en'] as string) ?? Object.values(field)[0] ?? '';
  };

  const localizeOptions = (
    options: Question['options'],
  ): string[] | 'dynamic' => {
    if (options === 'dynamic') return 'dynamic';
    return (options as Array<string | Record<string, string>>).map((o) =>
      typeof o === 'string' ? o : localizeField(o),
    );
  };

  return {
    ...q,
    question: localizeField(q.question as string | Record<string, string>),
    options: localizeOptions(q.options),
  };
}

/**
 * Resolve the directory containing default question bank YAMLs (cli-pkg/templates/questions/).
 * Works both at runtime (dist/) and during tests (src/).
 */
function defaultBankDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // dist/ → ../templates/questions ; src/lib → ../../templates/questions
  return here.endsWith('lib')
    ? join(here, '..', '..', 'templates', 'questions')
    : join(here, '..', 'templates', 'questions');
}

export interface LoadedBank {
  step: string;
  questions: Question[];
  sources: string[];
}

/**
 * Load the merged question bank for a step.
 * Default templates are loaded first, then user project overrides.
 * User questions with the same `id` replace defaults; new IDs are appended.
 */
export async function loadMergedBank(step: string, cwd: string = process.cwd()): Promise<LoadedBank> {
  const sources: string[] = [];
  const byId = new Map<string, Question>();

  const defaultPath = join(defaultBankDir(), `${step}.yaml`);
  if (await fileExists(defaultPath)) {
    const bank = await loadBankFile(defaultPath);
    if (bank.step !== step) {
      throw new Error(`bank file ${defaultPath} declares step "${bank.step}" but expected "${step}"`);
    }
    for (const q of bank.questions) byId.set(q.id, q);
    sources.push(defaultPath);
  }

  const userPath = join(projectPaths(cwd).questionsDir, `${step}.yaml`);
  if (await fileExists(userPath)) {
    const bank = await loadBankFile(userPath);
    for (const q of bank.questions) byId.set(q.id, q);
    sources.push(userPath);
  }

  return {
    step,
    questions: Array.from(byId.values()),
    sources,
  };
}

async function loadBankFile(path: string): Promise<QuestionBank> {
  const raw = await readFile(path, 'utf8');
  const parsed = parseYaml(raw);
  const result = QuestionBankSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `question bank invalid: ${path}\n${result.error.errors.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n')}`,
    );
  }
  return result.data;
}

/**
 * Filter questions by `when` expression evaluated against a simple `answers` context.
 * v0.1 supports only literal "always" and `answers.<ID> == 'value'` forms.
 */
export function filterQuestions(
  questions: Question[],
  answers: Record<string, string>,
): Question[] {
  return questions.filter((q) => evaluateWhen(q.when, answers));
}

function evaluateWhen(expr: string, answers: Record<string, string>): boolean {
  const trimmed = expr.trim();
  if (trimmed === 'always' || trimmed === '') return true;
  const m = /^answers\.([A-Z0-9_-]+)\s*==\s*['"](.+)['"]$/.exec(trimmed);
  if (!m) return true; // unknown expr -> show by default
  return answers[m[1]] === m[2];
}
