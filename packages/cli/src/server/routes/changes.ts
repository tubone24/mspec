// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: mspec-web-ui

import type { FastifyInstance } from 'fastify';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { projectPaths } from '../../workflow/paths.js';
import { loadWorkflow } from '../../workflow/loader.js';
import { listChanges, findChange, fileExists } from '../../lib/change-discovery.js';
import { loadSkipLog } from '../../lib/skip-log.js';
import { loadDoneLog } from '../../lib/done-log.js';
import { computeStatus } from '../../lib/state-engine.js';
import { parseMode } from '../../lib/readme-parser.js';

export async function registerChangesRoutes(app: FastifyInstance, root: string): Promise<void> {
  const paths = projectPaths(root);

  app.get('/api/health', async () => {
    return { status: 'ok', pid: process.pid, port: 3847 };
  });

  app.get('/api/changes', async () => {
    const [workflow, skipLog, doneLog] = await Promise.all([
      loadWorkflow(paths.workflowFile),
      loadSkipLog(paths),
      loadDoneLog(paths),
    ]);
    const changes = await listChanges(paths, { includeArchived: false });

    return Promise.all(
      changes.map(async (c) => {
        const readmePath = join(c.dir, 'readme.md');
        let mode: string | null = null;
        if (await fileExists(readmePath)) {
          const content = await readFile(readmePath, 'utf8');
          mode = parseMode(content);
        }
        const status = await computeStatus({ workflow, change: c, skipLog, doneLog, mode });
        return {
          id: c.name,
          name: c.name.replace(/^\d{4}-\d{2}-\d{2}-\d{6}-/, ''),
          createdAt: extractDate(c.name),
          mode: normalizeMode(mode),
          currentStep: status.current_step ?? 'complete',
          steps: status.steps.map((s) => ({ id: s.id, state: s.state })),
        };
      }),
    );
  });

  app.get<{ Params: { id: string } }>('/api/changes/:id', async (req, reply) => {
    const change = await findChange(paths, req.params.id);
    if (!change) return reply.code(404).send({ error: 'change not found' });

    const [workflow, skipLog, doneLog] = await Promise.all([
      loadWorkflow(paths.workflowFile),
      loadSkipLog(paths),
      loadDoneLog(paths),
    ]);
    const readmePath = join(change.dir, 'readme.md');
    let mode: string | null = null;
    if (await fileExists(readmePath)) {
      const content = await readFile(readmePath, 'utf8');
      mode = parseMode(content);
    }
    const status = await computeStatus({ workflow, change, skipLog, doneLog, mode });
    return {
      id: change.name,
      name: change.name.replace(/^\d{4}-\d{2}-\d{2}-\d{6}-/, ''),
      createdAt: extractDate(change.name),
      mode: normalizeMode(mode),
      currentStep: status.current_step ?? 'complete',
      steps: status.steps.map((s) => ({ id: s.id, state: s.state })),
    };
  });
}

function extractDate(name: string): string {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? `${m[1]}T00:00:00.000Z` : new Date().toISOString();
}

function normalizeMode(mode: string | null): 'typo' | 'minor' | 'bugfix' | 'full' {
  if (mode === 'typo' || mode === 'minor' || mode === 'bugfix') return mode;
  return 'full';
}
