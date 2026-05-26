// @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/change-dashboard/spec.md
// Requirements implemented: FR-005, FR-006
// Change: mspec-web-ui-e2e

import Fastify from 'fastify';
import { registerChangesRoutes } from '@mspec/cli/src/server/routes/changes.js';
import { registerArtifactsRoutes } from '@mspec/cli/src/server/routes/artifacts.js';
import { registerTestResultsRoutes } from '@mspec/cli/src/server/routes/testResults.js';
import { writePid, clearPid } from '@mspec/cli/src/server/pidManager.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = 3847;
// Run from packages/web-ui, so mspec root is two levels up
const root = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', '..', '..');

const app = Fastify({ logger: false });

await registerChangesRoutes(app, root);
await registerArtifactsRoutes(app, root);
await registerTestResultsRoutes(app, root);
// Note: /api/health is already registered by registerChangesRoutes

app.setNotFoundHandler(async (_req, reply) => {
  return reply.code(404).send({ error: 'not found' });
});

await app.listen({ port, host: '127.0.0.1' });
await writePid({ pid: process.pid, port });

console.log(`[api-server] Fastify listening on http://127.0.0.1:${port}`);

async function cleanup() {
  await clearPid();
  await app.close();
  process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
