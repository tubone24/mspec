// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/cli-core/spec.md
// Requirements implemented: FR-008
// Change: web-ui-smart-launch

import { spawn } from 'node:child_process';

/** Opens a URL in the default browser — cross-platform (macOS, Linux, Windows). */
export async function openBrowser(url: string): Promise<void> {
  const cmd =
    process.platform === 'darwin' ? 'open' :
    process.platform === 'win32' ? 'start' :
    'xdg-open';

  const child = spawn(cmd, [url], { detached: true, stdio: 'ignore', shell: process.platform === 'win32' });
  child.unref();
}
