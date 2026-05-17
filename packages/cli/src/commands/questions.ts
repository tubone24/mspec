// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: artifact-language-config

import pc from 'picocolors';
import { loadMergedBank, filterQuestions, localizeQuestion } from '../lib/questions-bank.js';
import { projectPaths } from '../workflow/paths.js';
import { loadConfig } from '../workflow/config-loader.js';

export interface QuestionsOptions {
  phase?: string;
  json?: boolean;
  cwd?: string;
}

export async function questionsCommand(opts: QuestionsOptions): Promise<void> {
  if (!opts.phase) {
    throw new Error('--phase <step-id> is required (e.g. --phase proposal)');
  }

  const cwd = opts.cwd ?? process.cwd();
  const paths = projectPaths(cwd);
  let locale = 'ja';
  try {
    const config = await loadConfig(paths.configFile);
    locale = config.resolvedLocale.locale;
  } catch {
    // config.yaml missing — use default locale
  }

  const bank = await loadMergedBank(opts.phase, cwd);
  const localized = bank.questions.map((q) => localizeQuestion(q, locale));
  const visible = filterQuestions(localized, {});

  if (opts.json) {
    process.stdout.write(
      JSON.stringify(
        {
          step: bank.step,
          sources: bank.sources,
          questions: visible,
        },
        null,
        2,
      ) + '\n',
    );
    return;
  }

  console.log(pc.bold(`Step: ${bank.step}`));
  console.log(`Sources: ${bank.sources.length ? bank.sources.join(', ') : pc.gray('(none)')}`);
  console.log();
  for (const q of visible) {
    const questionText = typeof q.question === 'string' ? q.question : JSON.stringify(q.question);
    console.log(`  ${pc.cyan(q.id)} [${q.category}] ${questionText}`);
    if (Array.isArray(q.options) && q.options.length > 0) {
      for (const o of q.options) {
        const optText = typeof o === 'string' ? o : JSON.stringify(o);
        console.log(`    - ${optText}`);
      }
    } else if (q.options === 'dynamic') {
      console.log(`    ${pc.gray('(dynamic options)')}`);
    }
  }
  if (visible.length === 0) {
    console.log(pc.gray('  (no questions for this phase)'));
  }
}
