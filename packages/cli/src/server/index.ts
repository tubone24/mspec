// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: mspec-web-ui
// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/cli-integration/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: mspec-web-ui
// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
// Requirements implemented: FR-009, FR-010, FR-012, FR-014
// Change: web-ui-smart-launch

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import pc from 'picocolors';
import { readPid, writePid, clearPid } from './pidManager.js';
import { resolvePortFromList, resolveConfigPort, DEFAULT_PORT_CANDIDATES } from './portResolver.js';

export interface LaunchResult {
  url: string;
  reused: boolean;
}

export async function launchWebUiIfNeeded(
  root: string,
  configFile?: string,
): Promise<LaunchResult | null> {
  // Graceful degrade if @mspec/web-ui is not installed
  let distPath: string;
  try {
    const req = createRequire(import.meta.url);
    distPath = req.resolve('@mspec/web-ui/dist/index.html').replace('/index.html', '');
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      console.info(pc.gray('ℹ  Web UI not available. Install it with: pnpm add @mspec/web-ui'));
      return null;
    }
    throw e;
  }

  // Check existing PID + HTTP health (FR-009: dual check)
  const existing = await readPid(root);
  if (existing) {
    const health = await checkHealth(existing.port, existing.projectRoot, existing.token, root);
    if (health) {
      return { url: `http://localhost:${existing.port}`, reused: true };
    }
    // Stale PID (FR-010): clean up and restart
    await clearPid(root);
  }

  // Resolve port from candidate list (D-011: ui.port config takes precedence)
  const configPort = await resolveConfigPort(configFile);
  const candidates = configPort
    ? [configPort, ...DEFAULT_PORT_CANDIDATES.filter((p) => p !== configPort)]
    : DEFAULT_PORT_CANDIDATES;

  const port = await resolvePortFromList(candidates);

  // Generate token for identity verification (FR-011)
  const token = randomUUID();

  // Launch server in background — FR-014: shell:false, port integer validated
  const portNum = Number(port);
  if (!Number.isInteger(portNum) || portNum < 1024 || portNum > 65535) {
    throw new Error(`Invalid port: ${port}`);
  }
  const serverModule = new URL('./server-process.js', import.meta.url).pathname;
  const child = spawn(
    process.execPath,
    [serverModule, String(portNum), root, distPath, token, root],
    {
      detached: true,
      stdio: 'ignore',
      shell: false,
    },
  );
  child.unref();

  // Wait for health endpoint to respond (replaces waitForPid — FR-012)
  await waitForHealth(portNum, root, token, 5000);
  await writePid(root, { pid: child.pid ?? 0, port: portNum, projectRoot: root, token });

  return { url: `http://localhost:${portNum}`, reused: false };
}

/** Check if a running server is this project's instance by verifying identity. */
async function checkHealth(
  port: number,
  expectedRoot: string,
  expectedToken: string,
  _root: string,
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`http://localhost:${port}/__mspec/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const body = (await res.json()) as { projectRoot?: string; token?: string };
    return body.projectRoot === expectedRoot && body.token === expectedToken;
  } catch {
    return false;
  }
}

/** Poll /__mspec/health until it responds. Replaces waitForPid. */
async function waitForHealth(
  port: number,
  projectRoot: string,
  token: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 500);
      const res = await fetch(`http://localhost:${port}/__mspec/health`, { signal: controller.signal });
      clearTimeout(t);
      if (res.ok) {
        const body = (await res.json()) as { projectRoot?: string; token?: string };
        if (body.projectRoot === projectRoot && body.token === token) return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  // Timed out — server may still be starting; not fatal
}

export { writePid, clearPid, readPid };
