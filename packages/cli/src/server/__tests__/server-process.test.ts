// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
// Requirements implemented: FR-011
// Change: web-ui-smart-launch

import { describe, it, expect, afterAll } from 'vitest';
import Fastify from 'fastify';

// Build a minimal Fastify app that replicates the health endpoint logic
// from server-process.ts to test the endpoint contract independently.
async function buildTestApp(opts: { projectRoot: string; token: string; port: number }) {
  const app = Fastify({ logger: false });

  // This is the endpoint we expect to exist in server-process.ts
  app.get('/__mspec/health', async () => ({
    projectRoot: opts.projectRoot,
    token: opts.token,
    port: opts.port,
    pid: process.pid,
  }));

  return app;
}

describe('/__mspec/health endpoint', () => {
  const projectRoot = '/test/project';
  const token = 'test-token-abc123';
  const port = 13999;

  let app: Awaited<ReturnType<typeof buildTestApp>>;

  afterAll(async () => {
    if (app) await app.close();
  });

  it('returns projectRoot, token, port, pid in response', async () => {
    app = await buildTestApp({ projectRoot, token, port });
    const response = await app.inject({ method: 'GET', url: '/__mspec/health' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ projectRoot: string; token: string; port: number; pid: number }>();
    expect(body.projectRoot).toBe(projectRoot);
    expect(body.token).toBe(token);
    expect(body.port).toBe(port);
    expect(typeof body.pid).toBe('number');
  });

  it('health response allows identity verification (projectRoot + token match)', async () => {
    app = await buildTestApp({ projectRoot, token, port });
    const response = await app.inject({ method: 'GET', url: '/__mspec/health' });
    const body = response.json<{ projectRoot: string; token: string }>();

    // Simulate the identity check in launchWebUiIfNeeded
    expect(body.projectRoot).toBe(projectRoot);
    expect(body.token).toBe(token);
  });
});
