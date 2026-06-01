// @mspec-delta 2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/agent-runner/spec.md
// Requirements implemented: FR-004
// Change: web-ui-artifact-order-and-test-results
// @mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
// Requirements implemented: FR-012, FR-013
// Change: fix-test-results-webui-display

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { maskAbsolutePaths } from '../server/testResultParser.js';

interface PlaywrightSpec {
  title: string;
  ok: boolean;
  tests: Array<{
    results: Array<{
      status: string;
      duration: number;
      error?: { message?: string; stack?: string };
    }>;
  }>;
}

interface PlaywrightSuite {
  title: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

interface PlaywrightReport {
  suites?: PlaywrightSuite[];
}

interface JestAssertionResult {
  title: string;
  status: string;
  failureMessages: string[];
  duration?: number;
}

interface JestTestResult {
  testFilePath: string;
  testResults: JestAssertionResult[];
}

interface JestReport {
  testResults: JestTestResult[];
  snapshot?: unknown;
}

export type RunnerFormat = 'playwright' | 'jest' | 'vitest' | 'unknown';

export function detectRunnerFormat(raw: unknown): RunnerFormat {
  if (!raw || typeof raw !== 'object') return 'unknown';
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.suites)) return 'playwright';
  if (Array.isArray(obj.testResults)) {
    // Vitest: top-level "snapshot" object (unique to Vitest, absent in Jest)
    if (obj.snapshot !== undefined) return 'vitest';
    // Jest: "testFilePath" string in each testResults entry
    const first = (obj.testResults as unknown[])[0];
    if (first && typeof first === 'object') {
      const r = first as Record<string, unknown>;
      if (typeof r.testFilePath === 'string') return 'jest';
    }
  }
  return 'unknown';
}

export interface TestResultEntry {
  name: string;
  status: 'red' | 'green' | 'skip';
  checklist_item_ids: string[];
  error_message?: string;
  stack_trace?: string;
}

const FR_RE = /\[FR-(\d+)\]/gi;

function extractFrIds(name: string): string[] {
  const ids: string[] = [];
  FR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FR_RE.exec(name)) !== null) {
    ids.push(`fr-${m[1]!.padStart(3, '0')}`);
  }
  return ids;
}

function toStatus(playwrightStatus: string): 'red' | 'green' | 'skip' {
  if (playwrightStatus === 'passed') return 'green';
  if (playwrightStatus === 'failed') return 'red';
  return 'skip';
}

function collectSpecs(suite: PlaywrightSuite): PlaywrightSpec[] {
  const specs: PlaywrightSpec[] = [...(suite.specs ?? [])];
  for (const child of suite.suites ?? []) {
    specs.push(...collectSpecs(child));
  }
  return specs;
}

function convertJestVitest(report: JestReport): TestResultEntry[] {
  const entries: TestResultEntry[] = [];
  for (const suite of report.testResults ?? []) {
    for (const t of suite.testResults ?? []) {
      const entry: TestResultEntry = {
        name: t.title,
        status: toStatus(t.status),
        checklist_item_ids: extractFrIds(t.title),
      };
      const failure = t.failureMessages[0];
      if (failure) {
        entry.stack_trace = maskAbsolutePaths(failure);
      }
      entries.push(entry);
    }
  }
  return entries;
}

export async function convertTestResults(changeDir: string): Promise<void> {
  const srcPath = join(changeDir, 'e2e-results', 'results.json');
  const destPath = join(changeDir, 'test-results.json');

  let raw: string;
  try {
    raw = await readFile(srcPath, 'utf8');
  } catch {
    // e2e-results/results.json doesn't exist — skip silently (FR-012)
    return;
  }

  const parsed: unknown = JSON.parse(raw);
  const format = detectRunnerFormat(parsed);

  let entries: TestResultEntry[];
  if (format === 'playwright') {
    const report = parsed as PlaywrightReport;
    entries = [];
    for (const suite of report.suites ?? []) {
      for (const spec of collectSpecs(suite)) {
        const result = spec.tests[0]?.results[0];
        const rawStatus = result?.status ?? 'skipped';
        const entry: TestResultEntry = {
          name: spec.title,
          status: toStatus(rawStatus),
          checklist_item_ids: extractFrIds(spec.title),
        };
        if (result?.error?.message) {
          entry.error_message = result.error.message;
        }
        if (result?.error?.stack) {
          entry.stack_trace = maskAbsolutePaths(result.error.stack);
        }
        entries.push(entry);
      }
    }
  } else if (format === 'jest' || format === 'vitest') {
    entries = convertJestVitest(parsed as JestReport);
  } else {
    // Unknown format — skip silently with a warning (FR-013)
    console.warn(`[mspec] test-results convert: unrecognized format in ${srcPath}, skipping`);
    return;
  }

  await writeFile(destPath, JSON.stringify(entries, null, 2), 'utf8');
}
