// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: mspec-web-ui

// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/cli-integration/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: mspec-web-ui

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import pc from 'picocolors';
import { readPid, writePid, clearPid, isAlive } from './pidManager.js';
import { resolvePort } from './portResolver.js';

export async function launchWebUiIfNeeded(root: string, configFile?: string): Promise<void> {
  const port = await resolvePort(configFile);

  // Graceful degrade if @mspec/web-ui is not installed
  let distPath: string;
  try {
    const req = createRequire(import.meta.url);
    distPath = req.resolve('@mspec/web-ui/dist/index.html').replace('/index.html', '');
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      console.info(pc.gray('ℹ  Web UI not available. Install it with: pnpm add @mspec/web-ui'));
      return;
    }
    throw e;
  }

  // Check existing PID
  const existing = await readPid();
  if (existing) {
    if (isAlive(existing.pid)) {
      console.log(pc.gray(`  Web UI already running at http://localhost:${existing.port}`));
      return;
    }
    // Zombie PID — clean up and restart
    await clearPid();
  }

  // Launch server in background
  const serverModule = new URL('./server-process.js', import.meta.url).pathname;
  const child = spawn(
    process.execPath,
    [serverModule, String(port), root, distPath],
    {
      detached: true,
      stdio: 'ignore',
    },
  );
  child.unref();

  // Brief wait for PID file to be written
  await waitForPid(port, 3000);
  console.log(pc.green(`  Web UI started at ${pc.cyan(`http://localhost:${port}`)}`));
}

async function waitForPid(port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const entry = await readPid();
    if (entry && entry.port === port && isAlive(entry.pid)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  // Timed out — server may still be starting; not a fatal error
}

export { writePid, clearPid, readPid };
