// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
// Change: mspec-web-ui

import type { FastifyInstance } from 'fastify';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { projectPaths } from '../../workflow/paths.js';
import { findChange } from '../../lib/change-discovery.js';

type ArtifactType = 'markdown' | 'html' | 'json' | 'xml' | 'other';

function detectType(filename: string): ArtifactType {
  const ext = extname(filename).toLowerCase();
  if (ext === '.md') return 'markdown';
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.json') return 'json';
  if (ext === '.xml') return 'xml';
  return 'other';
}

async function collectArtifacts(
  dir: string,
  baseDir: string,
  results: Array<{ name: string; relativePath: string; type: ArtifactType }> = [],
): Promise<typeof results> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await collectArtifacts(full, baseDir, results);
      } else if (entry.isFile()) {
        const rel = relative(baseDir, full);
        results.push({ name: entry.name, relativePath: rel, type: detectType(entry.name) });
      }
    }
  } catch { /* ignore unreadable dirs */ }
  return results;
}

export async function registerArtifactsRoutes(app: FastifyInstance, root: string): Promise<void> {
  const paths = projectPaths(root);

  app.get<{ Params: { id: string } }>(
    '/api/changes/:id/artifacts',
    async (req, reply) => {
      const change = await findChange(paths, req.params.id);
      if (!change) return reply.code(404).send({ error: 'change not found' });
      return collectArtifacts(change.dir, change.dir);
    },
  );

  app.get<{ Params: { id: string; '*': string } }>(
    '/api/changes/:id/artifacts/*',
    async (req, reply) => {
      const change = await findChange(paths, req.params.id);
      if (!change) return reply.code(404).send({ error: 'change not found' });

      const relPath = req.params['*'];
      if (!relPath) return reply.code(400).send({ error: 'missing path' });

      // Security: prevent path traversal
      const fullPath = join(change.dir, relPath);
      if (!fullPath.startsWith(change.dir)) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      try {
        const s = await stat(fullPath);
        if (!s.isFile()) return reply.code(404).send({ error: 'not a file' });
        const content = await readFile(fullPath, 'utf8');
        return reply.header('content-type', 'text/plain; charset=utf-8').send(content);
      } catch {
        return reply.code(404).send({ error: 'file not found' });
      }
    },
  );
}
