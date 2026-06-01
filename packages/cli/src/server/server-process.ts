// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-001, FR-003, FR-004
// Change: mspec-web-ui
// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
// Requirements implemented: FR-009
// Change: web-ui-enhancements
// @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
// Requirements implemented: FR-011, FR-013
// Change: web-ui-smart-launch

import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import { writePid, clearPid } from './pidManager.js';
import { registerChangesRoutes } from './routes/changes.js';
import { registerArtifactsRoutes } from './routes/artifacts.js';
import { registerTestResultsRoutes } from './routes/testResults.js';
import { registerSpecsRoutes } from './routes/specs.js';
import { registerRunCmdRoute } from './routes/runCmd.js';

const port = parseInt(process.argv[2] ?? '3847', 10);
const root = process.argv[3] ?? process.cwd();
const distPath = process.argv[4] ?? '';
const token = process.argv[5] ?? '';
const projectRoot = process.argv[6] ?? root;

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
await registerRunCmdRoute(app, root);

// Health endpoint for project identity verification (FR-011)
app.get('/__mspec/health', async () => ({
  projectRoot,
  token,
  port,
  pid: process.pid,
}));

// SPA catch-all: serve index.html for non-API routes
app.setNotFoundHandler(async (req, reply) => {
  if (!req.url.startsWith('/api') && !req.url.startsWith('/__mspec') && distPath) {
    return reply.sendFile('index.html');
  }
  return reply.code(404).send({ error: 'not found' });
});

try {
  // FR-013: bind to 127.0.0.1 only
  await app.listen({ port, host: '127.0.0.1' });
  await writePid(root, { pid: process.pid, port, projectRoot, token });

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
