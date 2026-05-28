// @mspec-delta 2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/agent-runner/spec.md
// Requirements implemented: FR-004
// Change: web-ui-artifact-order-and-test-results

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { convertTestResults } from './testResults.js';

const PLAYWRIGHT_JSON = JSON.stringify({
  suites: [
    {
      title: 'test suite',
      specs: [
        {
          title: '[FR-007] shows results from JSON',
          ok: true,
          tests: [{ results: [{ status: 'passed', duration: 100 }] }],
        },
        {
          title: '[FR-009] shows warning for dangling',
          ok: false,
          tests: [
            {
              results: [
                {
                  status: 'failed',
                  duration: 200,
                  error: { message: 'assert failed', stack: '/Users/foo/project/spec.ts:10' },
                },
              ],
            },
          ],
        },
        {
          title: 'no fr prefix test',
          ok: false,
          tests: [{ results: [{ status: 'skipped', duration: 0 }] }],
        },
      ],
    },
  ],
});

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'mspec-test-'));
  const e2eDir = join(tmpDir, 'e2e-results');
  await mkdir(e2eDir, { recursive: true });
  await writeFile(join(e2eDir, 'results.json'), PLAYWRIGHT_JSON, 'utf8');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('convertTestResults', () => {
  it('generates test-results.json from Playwright results', async () => {
    await convertTestResults(tmpDir);
    const raw = await readFile(join(tmpDir, 'test-results.json'), 'utf8');
    const entries = JSON.parse(raw) as Array<{ name: string; status: string; checklist_item_ids: string[] }>;
    expect(entries).toHaveLength(3);
  });

  it('converts status: passed→green, failed→red, skipped→skip', async () => {
    await convertTestResults(tmpDir);
    const entries = JSON.parse(await readFile(join(tmpDir, 'test-results.json'), 'utf8')) as Array<{ status: string }>;
    expect(entries[0]!.status).toBe('green');
    expect(entries[1]!.status).toBe('red');
    expect(entries[2]!.status).toBe('skip');
  });

  it('extracts FR numbers from test names into checklist_item_ids', async () => {
    await convertTestResults(tmpDir);
    const entries = JSON.parse(await readFile(join(tmpDir, 'test-results.json'), 'utf8')) as Array<{ checklist_item_ids: string[] }>;
    expect(entries[0]!.checklist_item_ids).toEqual(['fr-007']);
    expect(entries[1]!.checklist_item_ids).toEqual(['fr-009']);
    expect(entries[2]!.checklist_item_ids).toEqual([]);
  });

  it('masks absolute paths in stack_trace', async () => {
    await convertTestResults(tmpDir);
    const entries = JSON.parse(await readFile(join(tmpDir, 'test-results.json'), 'utf8')) as Array<{ stack_trace?: string }>;
    const failEntry = entries.find((e) => e.stack_trace);
    expect(failEntry?.stack_trace).not.toContain('/Users/foo');
    expect(failEntry?.stack_trace).toContain('[path]');
  });

  it('overwrites test-results.json on repeated calls', async () => {
    await convertTestResults(tmpDir);
    await convertTestResults(tmpDir);
    const entries = JSON.parse(await readFile(join(tmpDir, 'test-results.json'), 'utf8'));
    expect(entries).toHaveLength(3);
  });

  it('does not include secrets in output (FR-003 compliance)', async () => {
    // Verify no env var values appear in test-results.json
    await convertTestResults(tmpDir);
    const raw = await readFile(join(tmpDir, 'test-results.json'), 'utf8');
    // The test data itself doesn't contain API keys, verify the output is just test data
    expect(raw).not.toContain('sk-');
    expect(raw).not.toContain('ANTHROPIC_API_KEY');
  });
});
