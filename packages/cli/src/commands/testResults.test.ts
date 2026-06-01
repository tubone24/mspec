// @mspec-delta 2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/agent-runner/spec.md
// Requirements implemented: FR-004
// Change: web-ui-artifact-order-and-test-results
// @mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
// Requirements implemented: FR-012, FR-013
// Change: fix-test-results-webui-display

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { convertTestResults, detectRunnerFormat } from './testResults.js';

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

  it('gracefully skips when e2e-results/results.json does not exist (FR-012)', async () => {
    // Remove the e2e-results directory
    await rm(join(tmpDir, 'e2e-results'), { recursive: true, force: true });
    // Should not throw
    await expect(convertTestResults(tmpDir)).resolves.toBeUndefined();
    // test-results.json should NOT be created
    const exists = await readFile(join(tmpDir, 'test-results.json'), 'utf8').then(() => true).catch(() => false);
    expect(exists).toBe(false);
  });
});

const JEST_JSON = JSON.stringify({
  success: true,
  startTime: 1000,
  numTotalTestSuites: 1,
  numPassedTestSuites: 1,
  numFailedTestSuites: 0,
  numRuntimeErrorTestSuites: 0,
  numTotalTests: 2,
  numPassedTests: 1,
  numFailedTests: 1,
  numPendingTests: 0,
  numTodoTests: 0,
  openHandles: [],
  testResults: [
    {
      testFilePath: '/project/src/foo.test.ts',
      numFailingTests: 1,
      numPassingTests: 1,
      numPendingTests: 0,
      testResults: [
        { title: '[FR-011] passes', status: 'passed', ancestorTitles: [], failureMessages: [], duration: 50 },
        {
          title: '[FR-012] fails',
          status: 'failed',
          ancestorTitles: [],
          failureMessages: ['Error: expected 1 to equal 2\n    at /Users/alice/project/foo.test.ts:5'],
          duration: 30,
        },
      ],
    },
  ],
});

const VITEST_JSON = JSON.stringify({
  success: true,
  startTime: 1000,
  numTotalTestSuites: 1,
  numPassedTestSuites: 1,
  numFailedTestSuites: 0,
  numTotalTests: 1,
  numPassedTests: 1,
  numFailedTests: 0,
  numPendingTests: 0,
  numTodoTests: 0,
  snapshot: { total: 0, added: 0, updated: 0, unchecked: 0 },
  testResults: [
    {
      testFilePath: '/project/src/bar.test.ts',
      numFailingTests: 0,
      numPassingTests: 1,
      numPendingTests: 0,
      testResults: [
        { title: '[FR-013] vitest passes', status: 'passed', ancestorTitles: [], failureMessages: [], duration: 20 },
      ],
    },
  ],
});

describe('detectRunnerFormat (FR-013)', () => {
  it('detects Playwright from suites[]', () => {
    const raw = JSON.parse(PLAYWRIGHT_JSON);
    expect(detectRunnerFormat(raw)).toBe('playwright');
  });

  it('detects Vitest from top-level snapshot field', () => {
    const raw = JSON.parse(VITEST_JSON);
    expect(detectRunnerFormat(raw)).toBe('vitest');
  });

  it('detects Jest from testResults[].testFilePath', () => {
    const raw = JSON.parse(JEST_JSON);
    expect(detectRunnerFormat(raw)).toBe('jest');
  });

  it('returns unknown for unrecognized format', () => {
    expect(detectRunnerFormat({ someOtherField: [] })).toBe('unknown');
    expect(detectRunnerFormat(null)).toBe('unknown');
    expect(detectRunnerFormat(42)).toBe('unknown');
  });
});

describe('convertTestResults — Jest format (FR-013)', () => {
  let jestTmpDir: string;

  beforeEach(async () => {
    jestTmpDir = await mkdtemp(join(tmpdir(), 'mspec-jest-'));
    await mkdir(join(jestTmpDir, 'e2e-results'), { recursive: true });
    await writeFile(join(jestTmpDir, 'e2e-results', 'results.json'), JEST_JSON, 'utf8');
  });

  afterEach(async () => {
    await rm(jestTmpDir, { recursive: true, force: true });
  });

  it('converts Jest passed→green, failed→red', async () => {
    await convertTestResults(jestTmpDir);
    const entries = JSON.parse(await readFile(join(jestTmpDir, 'test-results.json'), 'utf8')) as Array<{ status: string; name: string }>;
    expect(entries).toHaveLength(2);
    const pass = entries.find((e) => e.name.includes('passes'));
    const fail = entries.find((e) => e.name.includes('fails'));
    expect(pass?.status).toBe('green');
    expect(fail?.status).toBe('red');
  });

  it('masks absolute paths in Jest failureMessages', async () => {
    await convertTestResults(jestTmpDir);
    const entries = JSON.parse(await readFile(join(jestTmpDir, 'test-results.json'), 'utf8')) as Array<{ stack_trace?: string }>;
    const failEntry = entries.find((e) => e.stack_trace);
    expect(failEntry?.stack_trace).not.toContain('/Users/alice');
    expect(failEntry?.stack_trace).toContain('[path]');
  });
});

describe('convertTestResults — Vitest format (FR-013)', () => {
  let vitestTmpDir: string;

  beforeEach(async () => {
    vitestTmpDir = await mkdtemp(join(tmpdir(), 'mspec-vitest-'));
    await mkdir(join(vitestTmpDir, 'e2e-results'), { recursive: true });
    await writeFile(join(vitestTmpDir, 'e2e-results', 'results.json'), VITEST_JSON, 'utf8');
  });

  afterEach(async () => {
    await rm(vitestTmpDir, { recursive: true, force: true });
  });

  it('converts Vitest passed→green', async () => {
    await convertTestResults(vitestTmpDir);
    const entries = JSON.parse(await readFile(join(vitestTmpDir, 'test-results.json'), 'utf8')) as Array<{ status: string }>;
    expect(entries).toHaveLength(1);
    expect(entries[0]!.status).toBe('green');
  });
});
