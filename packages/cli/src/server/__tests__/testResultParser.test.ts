// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md
// Requirements implemented: FR-001
// Change: mspec-web-ui
// @mspec-delta 2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
// Requirements implemented: FR-007, FR-010
// Change: web-ui-artifact-order-and-test-results

import { describe, it, expect } from 'vitest';
import { parsePlaywrightJson, parseJUnitXml, parseTestResults } from '../testResultParser.js';

const PLAYWRIGHT_JSON = JSON.stringify({
  suites: [
    {
      title: 'Dashboard tests',
      specs: [
        {
          title: 'shows change list',
          ok: true,
          tests: [{ results: [{ status: 'passed', duration: 123 }] }],
        },
        {
          title: 'filters by mode',
          ok: false,
          tests: [
            {
              results: [
                {
                  status: 'failed',
                  duration: 456,
                  error: { message: 'Expected true, got false', stack: 'at line 10' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

const JUNIT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="test run">
  <testsuite name="artifact-preview" tests="2" failures="1">
    <testcase name="renders markdown" time="0.234" />
    <testcase name="renders mermaid" time="0.891">
      <failure message="SVG not found">at MermaidRenderer line 42</failure>
    </testcase>
  </testsuite>
</testsuites>`;

describe('parsePlaywrightJson', () => {
  it('parses passed test correctly', () => {
    const suites = parsePlaywrightJson(PLAYWRIGHT_JSON);
    expect(suites).toHaveLength(1);
    expect(suites[0]!.format).toBe('playwright-json');
    expect(suites[0]!.tests).toHaveLength(2);
    expect(suites[0]!.tests[0]).toMatchObject({
      name: 'shows change list',
      status: 'pass',
      duration: 123,
    });
  });

  it('parses failed test with error message', () => {
    const suites = parsePlaywrightJson(PLAYWRIGHT_JSON);
    const failed = suites[0]!.tests[1]!;
    expect(failed.status).toBe('fail');
    expect(failed.errorMessage).toContain('Expected true');
    expect(failed.stackTrace).toBeDefined();
  });
});

describe('parseJUnitXml', () => {
  it('parses passed test from JUnit XML', () => {
    const suites = parseJUnitXml(JUNIT_XML);
    expect(suites).toHaveLength(1);
    expect(suites[0]!.format).toBe('junit-xml');
    expect(suites[0]!.tests[0]).toMatchObject({
      name: 'renders markdown',
      status: 'pass',
    });
  });

  it('parses failed test from JUnit XML with failure message', () => {
    const suites = parseJUnitXml(JUNIT_XML);
    const failed = suites[0]!.tests[1]!;
    expect(failed.status).toBe('fail');
    expect(failed.errorMessage).toContain('SVG not found');
  });
});

describe('parseTestResults', () => {
  it('delegates .json to Playwright parser', () => {
    const result = parseTestResults(PLAYWRIGHT_JSON, 'results.json');
    expect(result[0]!.format).toBe('playwright-json');
  });

  it('delegates .xml to JUnit parser', () => {
    const result = parseTestResults(JUNIT_XML, 'results.xml');
    expect(result[0]!.format).toBe('junit-xml');
  });

  it('returns empty array for unknown extension', () => {
    expect(parseTestResults('data', 'file.txt')).toEqual([]);
  });
});

// Task 2.3 — adaptStatus() unit tests (RED before Task 2.4)
import { adaptStatus, maskAbsolutePaths, parseTestResultsJson } from '../testResultParser.js';

describe('adaptStatus', () => {
  it('converts green to pass', () => {
    expect(adaptStatus('green')).toBe('pass');
  });
  it('converts red to fail', () => {
    expect(adaptStatus('red')).toBe('fail');
  });
  it('converts skip to skip', () => {
    expect(adaptStatus('skip')).toBe('skip');
  });
});

describe('maskAbsolutePaths', () => {
  it('masks Unix absolute paths', () => {
    expect(maskAbsolutePaths('/Users/foo/project/spec.ts:10')).toContain('[path]');
  });
  it('masks Windows absolute paths', () => {
    expect(maskAbsolutePaths('C:\\Users\\foo\\project\\spec.ts')).toContain('[path]');
  });
  it('does not mask non-path strings', () => {
    expect(maskAbsolutePaths('Error: expected true got false')).toBe('Error: expected true got false');
  });
});

// Task 2.5 — parseTestResultsJson() unit tests (RED before Task 2.6)
describe('parseTestResultsJson', () => {
  const entries = [
    { name: '[FR-007] shows results', status: 'green' as const, checklist_item_ids: ['fr-007'] },
    { name: '[FR-009] shows warning', status: 'red' as const, checklist_item_ids: ['fr-009'], error_message: 'assert failed', stack_trace: '/Users/foo/spec.ts:10' },
    { name: 'no fr prefix', status: 'skip' as const, checklist_item_ids: [] },
  ];

  it('converts green→pass, red→fail, skip→skip', () => {
    const suites = parseTestResultsJson(entries);
    const tests = suites[0]!.tests;
    expect(tests[0]!.status).toBe('pass');
    expect(tests[1]!.status).toBe('fail');
    expect(tests[2]!.status).toBe('skip');
  });

  it('preserves checklist_item_ids', () => {
    const suites = parseTestResultsJson(entries);
    const tests = suites[0]!.tests;
    expect((tests[0] as any).checklistItemIds).toEqual(['fr-007']);
  });

  it('masks absolute paths in stack_trace', () => {
    const suites = parseTestResultsJson(entries);
    const failing = suites[0]!.tests[1]!;
    expect(failing.stackTrace).not.toContain('/Users/foo');
    expect(failing.stackTrace).toContain('[path]');
  });

  it('returns a single TestSuite named test-results', () => {
    const suites = parseTestResultsJson(entries);
    expect(suites).toHaveLength(1);
    expect(suites[0]!.suiteName).toBe('test-results');
  });
});
