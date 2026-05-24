// @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: rename-visual-mock-to-prototype

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import pc from 'picocolors';
import { projectPaths } from '../workflow/paths.js';
import { findChange, listChanges } from '../lib/change-discovery.js';
import { detectFramework } from '../lib/framework-detector.js';
import { startPrototypeServer } from '../lib/prototype-server.js';
import { askMultiline } from '../lib/prompt.js';

export interface PrototypeOptions {
  change?: string;
  port?: number;
  cwd?: string;
}

export async function prototypeCommand(opts: PrototypeOptions): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const paths = projectPaths(cwd);

  const changeName = opts.change ?? (await singleActiveChange(cwd));
  const change = await findChange(paths, changeName);
  if (!change) throw new Error(`change "${changeName}" not found`);

  const frameworkInfo = await detectFramework(cwd);

  // Prepare prototype directory
  const prototypeDir = join(change.dir, 'prototype');
  await mkdir(prototypeDir, { recursive: true });

  // Announce that HTML generation should happen via mspec-visual-prototype-runner subagent
  process.stdout.write(
    pc.cyan('▸') +
      ` Generating prototype UI for change "${changeName}" (framework: ${frameworkInfo.name})...\n`,
  );
  process.stdout.write(
    pc.gray(
      `  Hint for subagent: use ${frameworkInfo.promptHint}\n`,
    ),
  );
  process.stdout.write(
    pc.gray(
      `  Output: ${prototypeDir}/index.html\n`,
    ),
  );

  // Start the static file server
  const preferredPort = opts.port ?? 3737;
  const { port, close } = await startPrototypeServer(prototypeDir, preferredPort);

  const url = `http://localhost:${port}`;
  process.stdout.write('\n' + pc.green('✓') + ` Prototype server started at ${pc.bold(url)}\n`);
  process.stdout.write(
    pc.gray('  Open the URL in your browser, then press ') +
      pc.bold('Ctrl+C') +
      pc.gray(' to stop and enter feedback.\n\n'),
  );

  // Register SIGINT handler
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
      pc.green('✓') + ' Feedback saved to prototype-feedback.md\n',
    );
    process.exit(0);
  });
}

async function saveFeedback(changeDir: string, changeName: string, feedback: string): Promise<void> {
  const content = [
    '# Prototype Feedback',
    '',
    `> Recorded: ${new Date().toISOString()}`,
    `> Prototype: changes/${changeName}/prototype/index.html`,
    '',
    feedback || '(no feedback provided)',
    '',
  ].join('\n');

  await writeFile(join(changeDir, 'prototype-feedback.md'), content, 'utf8');
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
