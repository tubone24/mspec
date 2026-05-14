import { Command } from 'commander';
import pc from 'picocolors';
import { initCommand } from './commands/init.js';
import { newCommand } from './commands/new.js';
import { statusCommand } from './commands/status.js';
import { validateCommand } from './commands/validate.js';
import { continueCommand } from './commands/continue.js';
import { skipCommand } from './commands/skip.js';
import { deltaInitCommand } from './commands/delta-init.js';
import { anchorCheckCommand } from './commands/anchor-check.js';
import { testExpectRed, testExpectGreen } from './commands/test.js';
import { questionsCommand } from './commands/questions.js';
import { archiveCommand, printReport as printArchiveReport } from './commands/archive.js';
import { anchorExtractCommand } from './commands/anchor-extract.js';
import { anchorListCommand } from './commands/anchor-list.js';
import { constitutionInitCommand, constitutionShowCommand } from './commands/constitution.js';
import { schemaShowCommand, schemaValidateCommand } from './commands/schema.js';
import { specLintCommand } from './commands/spec-lint.js';

const program = new Command();

program
  .name('mspec')
  .description('むぎぼースペック (mspec) - Spec-Driven Development framework CLI')
  .version('0.1.0-alpha.1');

program
  .command('init')
  .description('Initialize mspec in the current project')
  .option('--tools <tool>', 'Integration tool to configure', 'claude')
  .option('--no-subagents', 'Skip placing .claude/agents/ files')
  .option('--force', 'Overwrite existing files')
  .action(initCommand);

program
  .command('new <feature-kebab>')
  .description('Create a new change directory with readme.md')
  .option('--request <text>', 'One-line user request')
  .action(newCommand);

program
  .command('status')
  .description('Show status of artifacts for a change')
  .option('--change <name>', 'Target change directory name')
  .option('--json', 'Output JSON')
  .action(statusCommand);

program
  .command('validate')
  .description('Validate markdown structure, anchors, scenarios')
  .option('--all', 'Validate all changes and specs')
  .option('--change <name>', 'Target change directory name')
  .option('--strict', 'Strict mode (require constitution checks)')
  .action(validateCommand);

program
  .command('continue')
  .description('Return status + next-step prompt for the LLM agent')
  .option('--change <name>', 'Target change directory name')
  .option('--json', 'Output JSON')
  .action(continueCommand);

program
  .command('skip <step-id>')
  .description('Mark a step as skipped (requires skippable: true in workflow)')
  .option('--change <name>', 'Target change directory name')
  .option('--reason <text>', 'Reason for skipping (required, min 10 chars)')
  .action(skipCommand);

program
  .command('archive <change-name>')
  .description('Merge delta spec into source-of-truth spec and move to archive/')
  .option('-y, --yes', 'Skip confirmation')
  .option('--dry-run', 'Show diff without applying')
  .action(async (change, opts) => {
    const result = await archiveCommand({ change, yes: opts.yes, dryRun: opts.dryRun });
    if (result.errors.length > 0) {
      for (const e of result.errors) console.error(pc.red('Error:'), e);
      process.exitCode = 1;
      return;
    }
    printArchiveReport(result.merged, result.change, result.moved, result.dryRun);
  });

const anchor = program.command('anchor').description('Anchor (@mspec-delta) utilities');
anchor
  .command('check')
  .description('Verify anchors point to existing delta specs and FR-IDs')
  .option('--change <name>', 'Target change directory name')
  .action(anchorCheckCommand);
anchor
  .command('extract <change-name>')
  .description('Extract anchor + delta spec bundle (LLM-ready)')
  .option('--json', 'Output JSON')
  .action(anchorExtractCommand);
anchor
  .command('list')
  .description('List all anchors in the repo')
  .option('--orphans', 'Show only orphaned anchors (no matching change)')
  .action(anchorListCommand);

const delta = program.command('delta').description('Delta spec utilities');
delta
  .command('init')
  .description('Create a delta spec skeleton with auto-numbered FR-NNN')
  .option('--capability <name>', 'Capability name (existing or new)')
  .option('--change <name>', 'Target change directory name')
  .action(deltaInitCommand);

const test = program.command('test').description('TDD red/green evidence recording');
test
  .command('expect-red <task-id>')
  .description('Run tests, expect failure, record evidence')
  .option('--change <name>', 'Target change directory name')
  .action(testExpectRed);
test
  .command('expect-green <task-id>')
  .description('Run tests, expect success, record evidence')
  .option('--change <name>', 'Target change directory name')
  .action(testExpectGreen);

const constitution = program.command('constitution').description('Project constitution management');
constitution
  .command('init')
  .description('Create memory/constitution.md from template')
  .action(constitutionInitCommand);
constitution
  .command('show')
  .description('Print the current constitution')
  .action(constitutionShowCommand);

const schema = program.command('schema').description('Workflow schema utilities');
schema
  .command('show')
  .description('Display the current workflow.yaml')
  .action(schemaShowCommand);
schema
  .command('validate')
  .description('Validate workflow.yaml against the meta-schema')
  .action(schemaValidateCommand);

const spec = program.command('spec').description('Source-of-Truth spec utilities');
spec
  .command('lint [glob]')
  .description('Detect implementation-detail leakage in SoT specs (default glob: specs/*/spec.md)')
  .option('--json', 'Output JSON (for CI)')
  .option(
    '--allow <ruleId>',
    'Disable a specific rule (repeatable)',
    (value: string, prev: string[] = []) => prev.concat([value]),
    [],
  )
  .action((glob: string | undefined, opts: { json?: boolean; allow?: string[] }) =>
    specLintCommand(glob, { json: opts.json, allow: opts.allow }),
  );

program
  .command('questions')
  .description('List question templates for a phase')
  .option('--phase <step-id>', 'Step ID (e.g. proposal)')
  .option('--json', 'Output JSON')
  .action(questionsCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(pc.red('Error:'), err instanceof Error ? err.message : err);
  process.exit(1);
});
