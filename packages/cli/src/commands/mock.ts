// @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-core/spec.md
// Requirements implemented: FR-004
// Change: ui-visual-mock-workflow

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import pc from 'picocolors';
import { projectPaths } from '../workflow/paths.js';
import { findChange, listChanges } from '../lib/change-discovery.js';
import { detectFramework } from '../lib/framework-detector.js';
import { startMockServer } from '../lib/mock-server.js';
import { askMultiline } from '../lib/prompt.js';

export interface MockOptions {
  change?: string;
  port?: number;
  cwd?: string;
}

export async function mockCommand(opts: MockOptions): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const paths = projectPaths(cwd);

  const changeName = opts.change ?? (await singleActiveChange(cwd));
  const change = await findChange(paths, changeName);
  if (!change) throw new Error(`change "${changeName}" not found`);

  const frameworkInfo = await detectFramework(cwd);

  // Prepare mock directory
  const mockDir = join(change.dir, 'mock');
  await mkdir(mockDir, { recursive: true });

  // Announce that HTML generation should happen via mspec-visual-mock-runner subagent
  process.stdout.write(
    pc.cyan('▸') +
      ` Generating mock UI for change "${changeName}" (framework: ${frameworkInfo.name})...\n`,
  );
  process.stdout.write(
    pc.gray(
      `  Hint for subagent: use ${frameworkInfo.promptHint}\n`,
    ),
  );
  process.stdout.write(
    pc.gray(
      `  Output: ${mockDir}/index.html\n`,
    ),
  );

  // Start the static file server
  const preferredPort = opts.port ?? 3737;
  const { port, close } = await startMockServer(mockDir, preferredPort);

  const url = `http://localhost:${port}`;
  process.stdout.write('\n' + pc.green('✓') + ` Mock server started at ${pc.bold(url)}\n`);
  process.stdout.write(
    pc.gray('  Open the URL in your browser, then press ') +
      pc.bold('Ctrl+C') +
      pc.gray(' to stop and enter feedback.\n\n'),
  );

  // Register SIGINT handler before server is running (per D-003)
  let serverClosed = false;
  process.on('SIGINT', async () => {
    if (serverClosed) return;
    serverClosed = true;

    close();
    process.stdout.write('\n');

    const feedback = await askMultiline(
      pc.cyan('Feedback') +
        pc.gray(' (describe what you want changed; blank line to finish):\n> '),
    );

    await saveFeedback(change.dir, changeName, feedback);

    process.stdout.write(
      pc.green('✓') + ' Feedback saved to mock-feedback.md\n',
    );
    process.exit(0);
  });
}

async function saveFeedback(changeDir: string, changeName: string, feedback: string): Promise<void> {
  const content = [
    '# Mock Feedback',
    '',
    `> Recorded: ${new Date().toISOString()}`,
    `> Mock: changes/${changeName}/mock/index.html`,
    '',
    feedback || '(no feedback provided)',
    '',
  ].join('\n');

  await writeFile(join(changeDir, 'mock-feedback.md'), content, 'utf8');
}

async function singleActiveChange(cwd: string): Promise<string> {
  const paths = projectPaths(cwd);
  const live = await listChanges(paths, { includeArchived: false });
  if (live.length === 1) return live[0]!.name;
  if (live.length === 0) {
    process.stderr.write(pc.red('Error:') + ' no active change found. Run `mspec new` first.\n');
    process.exit(1);
  }
  process.stderr.write(
    pc.red('Error:') +
      ` multiple active changes; specify --change: ${live.map((c) => c.name).join(', ')}\n`,
  );
  process.exit(1);
}
