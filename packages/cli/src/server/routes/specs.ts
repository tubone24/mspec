// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
// Requirements implemented: FR-009
// Change: web-ui-enhancements

import type { FastifyInstance } from 'fastify';
import { readFile, readdir } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { projectPaths } from '../../workflow/paths.js';

export async function registerSpecsRoutes(app: FastifyInstance, root: string): Promise<void> {
  const paths = projectPaths(root);
  const specsDir = paths.specsDir;

  app.get('/api/specs', async () => {
    try {
      const entries = await readdir(specsDir, { withFileTypes: true });
      const capabilities: Array<{ capability: string }> = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        try {
          await readFile(join(specsDir, entry.name, 'spec.md'), 'utf8');
          capabilities.push({ capability: entry.name });
        } catch { /* no spec.md — skip */ }
      }
      return capabilities;
    } catch {
      return [];
    }
  });

  app.get<{ Params: { capability: string } }>('/api/specs/:capability', async (req, reply) => {
    const { capability } = req.params;
    const fullPath = join(specsDir, capability, 'spec.md');

    // Security: prevent path traversal (include sep to avoid sibling-dir prefix collision)
    if (!fullPath.startsWith(specsDir + sep)) {
      return reply.code(403).send({ error: 'forbidden' });
    }

    try {
      const content = await readFile(fullPath, 'utf8');
      return reply.header('content-type', 'text/plain; charset=utf-8').send(content);
    } catch {
      return reply.code(404).send({ error: 'spec not found' });
    }
  });
}
