// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/cli-core/spec.md
// Requirements implemented: FR-008
// Change: web-ui-smart-launch

import pc from 'picocolors';
import { launchWebUiIfNeeded } from '../server/index.js';
import { openBrowser } from '../lib/open-browser.js';

export interface OpenCommandOptions {
  root: string;
  configFile?: string;
}

export async function openCommand(opts: OpenCommandOptions): Promise<void> {
  const result = await launchWebUiIfNeeded(opts.root, opts.configFile);
  if (!result) return;

  await openBrowser(result.url);

  if (result.reused) {
    console.log(pc.gray(`  Web UI already running at ${pc.cyan(result.url)}`));
  } else {
    console.log(pc.green(`  Web UI opened at ${pc.cyan(result.url)}`));
  }
}
