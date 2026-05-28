// @mspec-delta 2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
// Requirements implemented: FR-007, FR-001
// Change: web-ui-artifact-order-and-test-results

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readTestResults } from '../routes/testResults.js';

const TEST_RESULTS_JSON = JSON.stringify([
  { name: '[FR-007] shows results', status: 'green', checklist_item_ids: ['fr-007'] },
  { name: '[FR-009] shows warning', status: 'red', checklist_item_ids: ['fr-009'], error_message: 'assert', stack_trace: '/Users/foo/spec.ts:1' },
]);

const CHECKLIST_MD = `
- [ ] FR-007: shows results <!-- verify: fr-007 -->
- [ ] FR-009: shows warning <!-- verify: fr-009 -->
`;

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'mspec-routes-test-'));
  await writeFile(join(tmpDir, 'test-results.json'), TEST_RESULTS_JSON, 'utf8');
  await writeFile(join(tmpDir, 'checklist.md'), CHECKLIST_MD, 'utf8');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('readTestResults', () => {
  it('reads test-results.json when present', async () => {
    const suites = await readTestResults(tmpDir);
    expect(suites).toHaveLength(1);
    expect(suites[0]!.suiteName).toBe('test-results');
  });

  it('converts status red→fail, green→pass via adapter', async () => {
    const suites = await readTestResults(tmpDir);
    const tests = suites[0]!.tests;
    expect(tests[0]!.status).toBe('pass');
    expect(tests[1]!.status).toBe('fail');
  });

  it('includes is_resolved field based on checklist.md', async () => {
    const suites = await readTestResults(tmpDir);
    const tests = suites[0]!.tests as Array<{ isResolved: boolean; checklistItemIds: string[] }>;
    // fr-007 is in checklist.md → resolved
    expect(tests[0]!.isResolved).toBe(true);
    // fr-009 is in checklist.md → resolved
    expect(tests[1]!.isResolved).toBe(true);
  });

  it('marks dangling reference as isResolved=false', async () => {
    // Write a test result that references a non-existent checklist item
    await writeFile(
      join(tmpDir, 'test-results.json'),
      JSON.stringify([{ name: '[FR-999] nonexistent', status: 'green', checklist_item_ids: ['fr-999'] }]),
      'utf8',
    );
    const suites = await readTestResults(tmpDir);
    const tests = suites[0]!.tests as Array<{ isResolved: boolean }>;
    expect(tests[0]!.isResolved).toBe(false);
  });

  it('returns empty array when test-results.json does not exist', async () => {
    await rm(join(tmpDir, 'test-results.json'));
    const suites = await readTestResults(tmpDir);
    expect(suites).toHaveLength(0);
  });

  it('masks absolute paths in stack_trace', async () => {
    const suites = await readTestResults(tmpDir);
    const failTest = suites[0]!.tests[1]!;
    expect(failTest.stackTrace).not.toContain('/Users/foo');
    expect(failTest.stackTrace).toContain('[path]');
  });
});
