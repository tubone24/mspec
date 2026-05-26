// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: mspec-web-ui

import type { FastifyInstance } from 'fastify';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { projectPaths } from '../../workflow/paths.js';
import { findChange } from '../../lib/change-discovery.js';
import { parseTestResults } from '../testResultParser.js';

export async function registerTestResultsRoutes(
  app: FastifyInstance,
  root: string,
): Promise<void> {
  const paths = projectPaths(root);

  app.get<{ Params: { id: string } }>(
    '/api/changes/:id/test-results',
    async (req, reply) => {
      const change = await findChange(paths, req.params.id);
      if (!change) return reply.code(404).send({ error: 'change not found' });

      const resultsDir = join(change.dir, 'e2e-results');
      const suites = [];

      try {
        const files = await readdir(resultsDir);
        for (const file of files) {
          if (!file.endsWith('.json') && !file.endsWith('.xml')) continue;
          const content = await readFile(join(resultsDir, file), 'utf8');
          suites.push(...parseTestResults(content, file));
        }
      } catch {
        // No e2e-results directory — return empty array
      }

      return suites;
    },
  );
}
