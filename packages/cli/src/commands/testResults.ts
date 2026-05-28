// @mspec-delta 2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/agent-runner/spec.md
// Requirements implemented: FR-004
// Change: web-ui-artifact-order-and-test-results

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

export async function convertTestResults(changeDir: string): Promise<void> {
  const srcPath = join(changeDir, 'e2e-results', 'results.json');
  const destPath = join(changeDir, 'test-results.json');

  const raw = await readFile(srcPath, 'utf8');
  const report = JSON.parse(raw) as PlaywrightReport;

  const entries: TestResultEntry[] = [];
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

  await writeFile(destPath, JSON.stringify(entries, null, 2), 'utf8');
}
