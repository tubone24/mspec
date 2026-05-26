// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md
// Requirements implemented: FR-001
// Change: mspec-web-ui

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
