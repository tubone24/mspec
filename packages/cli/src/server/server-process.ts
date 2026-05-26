// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-001, FR-003, FR-004
// Change: mspec-web-ui
// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
// Requirements implemented: FR-009
// Change: web-ui-enhancements

import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import { writePid, clearPid } from './pidManager.js';
import { registerChangesRoutes } from './routes/changes.js';
import { registerArtifactsRoutes } from './routes/artifacts.js';
import { registerTestResultsRoutes } from './routes/testResults.js';
import { registerSpecsRoutes } from './routes/specs.js';

const port = parseInt(process.argv[2] ?? '3847', 10);
const root = process.argv[3] ?? process.cwd();
const distPath = process.argv[4] ?? '';

const app = Fastify({ logger: false });

if (distPath) {
  await app.register(staticPlugin, {
    root: distPath,
    prefix: '/',
  });
}

await registerChangesRoutes(app, root);
await registerArtifactsRoutes(app, root);
await registerTestResultsRoutes(app, root);
await registerSpecsRoutes(app, root);

// SPA catch-all: serve index.html for non-API routes
app.setNotFoundHandler(async (req, reply) => {
  if (!req.url.startsWith('/api') && distPath) {
    return reply.sendFile('index.html');
  }
  return reply.code(404).send({ error: 'not found' });
});

try {
  await app.listen({ port, host: '127.0.0.1' });
  await writePid(root, { pid: process.pid, port });

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  async function cleanup() {
    await clearPid(root);
    await app.close();
    process.exit(0);
  }
} catch (err) {
  console.error('Failed to start mspec Web UI server:', err);
  process.exit(1);
}
