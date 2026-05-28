// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: mspec-web-ui
// @mspec-delta 2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
// Requirements implemented: FR-007, FR-001
// Change: web-ui-artifact-order-and-test-results

import type { FastifyInstance } from 'fastify';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { projectPaths } from '../../workflow/paths.js';
import { findChange } from '../../lib/change-discovery.js';
import { parseTestResults, parseTestResultsJson, type TestCase, type TestSuite } from '../testResultParser.js';

const VERIFY_RE = /<!--\s*verify:\s*fr-(\d+)\s*-->/gi;

async function parseChecklistIds(changeDir: string): Promise<Set<string>> {
  const ids = new Set<string>();
  try {
    const content = await readFile(join(changeDir, 'checklist.md'), 'utf8');
    VERIFY_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = VERIFY_RE.exec(content)) !== null) {
      ids.add(`fr-${m[1]!.padStart(3, '0')}`);
    }
  } catch { /* checklist.md may not exist */ }
  return ids;
}

export async function readTestResults(changeDir: string): Promise<TestSuite[]> {
  const trjPath = join(changeDir, 'test-results.json');
  try {
    const raw = await readFile(trjPath, 'utf8');
    const entries = JSON.parse(raw) as Parameters<typeof parseTestResultsJson>[0];
    const validIds = await parseChecklistIds(changeDir);
    const suites = parseTestResultsJson(entries);
    // Annotate each test with isResolved
    for (const suite of suites) {
      for (const test of suite.tests) {
        const tc = test as TestCase & { isResolved: boolean };
        const ids: string[] = (tc as any).checklistItemIds ?? [];
        tc.isResolved = ids.length === 0 || ids.every((id) => validIds.has(id));
      }
    }
    return suites;
  } catch {
    return [];
  }
}

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

      // D-2: Prefer test-results.json (new schema); fallback to e2e-results/ (Playwright/JUnit)
      const suites = await readTestResults(change.dir);
      if (suites.length > 0) return suites;

      const resultsDir = join(change.dir, 'e2e-results');
      const fallbackSuites = [];
      try {
        const files = await readdir(resultsDir);
        for (const file of files) {
          if (!file.endsWith('.json') && !file.endsWith('.xml')) continue;
          const content = await readFile(join(resultsDir, file), 'utf8');
          fallbackSuites.push(...parseTestResults(content, file));
        }
      } catch { /* No e2e-results directory */ }

      return fallbackSuites;
    },
  );
}
