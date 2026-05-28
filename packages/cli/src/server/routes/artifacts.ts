// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
// Change: mspec-web-ui
// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/artifact-preview/spec.md
// Requirements implemented: FR-011
// Change: web-ui-enhancements
// @mspec-delta 2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/change-dashboard/spec.md
// Requirements implemented: FR-010
// Change: web-ui-artifact-order-and-test-results

import type { FastifyInstance } from 'fastify';
// @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/web-ui-server/spec.md
// Requirements implemented: FR-007
// Change: fix-checklist-ui-sync

import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { projectPaths } from '../../workflow/paths.js';
import { findChange } from '../../lib/change-discovery.js';

type ArtifactType = 'markdown' | 'html' | 'json' | 'xml' | 'other';
type DocType = 'Reference' | 'Explanation' | 'How-to' | 'Tutorial';

export const WORKFLOW_STEP_ORDER = [
  'new', 'proposal', 'delta', 'research', 'design',
  'quickstart', 'checklist', 'tasks', 'implement',
] as const;

const DESIGN_FILES = new Set(['design.md', 'design-rationale.md', 'architecture-overview.md']);

export function getStepForArtifact(relativePath: string): string {
  if (relativePath === 'readme.md') return 'new';
  if (relativePath === 'proposal.md') return 'proposal';
  if (relativePath.startsWith('specs/')) return 'delta';
  if (relativePath === 'research.md') return 'research';
  if (DESIGN_FILES.has(relativePath)) return 'design';
  if (relativePath === 'quickstart.md') return 'quickstart';
  if (relativePath === 'checklist.md') return 'checklist';
  if (relativePath === 'tasks.md') return 'tasks';
  return 'implement';
}

const DOC_TYPE_RE = /^doc_type:\s*(.+)$/m;
const VALID_DOC_TYPES = new Set<string>(['Reference', 'Explanation', 'How-to', 'Tutorial']);

function detectType(filename: string): ArtifactType {
  const ext = extname(filename).toLowerCase();
  if (ext === '.md') return 'markdown';
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.json') return 'json';
  if (ext === '.xml') return 'xml';
  return 'other';
}

async function extractDocType(filePath: string): Promise<DocType | undefined> {
  try {
    const content = await readFile(filePath, 'utf8');
    const m = DOC_TYPE_RE.exec(content);
    if (m) {
      const val = m[1].trim();
      if (VALID_DOC_TYPES.has(val)) return val as DocType;
    }
  } catch { /* ignore read errors */ }
  return undefined;
}

async function collectArtifacts(
  dir: string,
  baseDir: string,
  results: Array<{ name: string; relativePath: string; type: ArtifactType; docType?: DocType }> = [],
): Promise<typeof results> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await collectArtifacts(full, baseDir, results);
      } else if (entry.isFile()) {
        const rel = relative(baseDir, full);
        const type = detectType(entry.name);
        const docType = type === 'markdown' ? await extractDocType(full) : undefined;
        results.push({ name: entry.name, relativePath: rel, type, docType });
      }
    }
  } catch { /* ignore unreadable dirs */ }
  return results;
}

export async function registerArtifactsRoutes(app: FastifyInstance, root: string): Promise<void> {
  const paths = projectPaths(root);

  app.addContentTypeParser('text/plain', { parseAs: 'string' }, (_req, body, done) => {
    done(null, body);
  });

  app.patch<{ Params: { id: string } }>(
    '/api/changes/:id/artifacts/checklist.md',
    async (req, reply) => {
      const change = await findChange(paths, req.params.id);
      if (!change) return reply.code(404).send({ error: 'change not found' });
      const fullPath = join(change.dir, 'checklist.md');
      await writeFile(fullPath, req.body as string, 'utf8');
      return reply.send({ ok: true });
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/changes/:id/artifacts',
    async (req, reply) => {
      const change = await findChange(paths, req.params.id);
      if (!change) return reply.code(404).send({ error: 'change not found' });
      const artifacts = await collectArtifacts(change.dir, change.dir);
      return artifacts.sort((a, b) => {
        const ai = WORKFLOW_STEP_ORDER.indexOf(getStepForArtifact(a.relativePath) as typeof WORKFLOW_STEP_ORDER[number]);
        const bi = WORKFLOW_STEP_ORDER.indexOf(getStepForArtifact(b.relativePath) as typeof WORKFLOW_STEP_ORDER[number]);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
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
