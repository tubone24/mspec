import pc from 'picocolors';
import { loadMergedBank, filterQuestions } from '../lib/questions-bank.js';

export interface QuestionsOptions {
  phase?: string;
  json?: boolean;
}

export async function questionsCommand(opts: QuestionsOptions): Promise<void> {
  if (!opts.phase) {
    throw new Error('--phase <step-id> is required (e.g. --phase proposal)');
  }
  const bank = await loadMergedBank(opts.phase);
  const visible = filterQuestions(bank.questions, {});

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
    console.log(`  ${pc.cyan(q.id)} [${q.category}] ${q.question}`);
    if (Array.isArray(q.options) && q.options.length > 0) {
      for (const o of q.options) console.log(`    - ${o}`);
    } else if (q.options === 'dynamic') {
      console.log(`    ${pc.gray('(dynamic options)')}`);
    }
  }
  if (visible.length === 0) {
    console.log(pc.gray('  (no questions for this phase)'));
  }
}
