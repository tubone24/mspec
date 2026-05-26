// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md
// Requirements implemented: FR-001
// Change: mspec-web-ui

export interface TestCase {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
}

export interface TestSuite {
  suiteName: string;
  format: 'playwright-json' | 'junit-xml';
  tests: TestCase[];
}

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

function collectSpecs(suite: PlaywrightSuite): PlaywrightSpec[] {
  const specs: PlaywrightSpec[] = [...(suite.specs ?? [])];
  for (const child of suite.suites ?? []) {
    specs.push(...collectSpecs(child));
  }
  return specs;
}

export function parsePlaywrightJson(json: string): TestSuite[] {
  const report = JSON.parse(json) as PlaywrightReport;
  return (report.suites ?? []).map((suite) => {
    const specs = collectSpecs(suite);
    return {
      suiteName: suite.title,
      format: 'playwright-json' as const,
      tests: specs.map((spec) => {
        const result = spec.tests[0]?.results[0];
        const rawStatus = result?.status ?? 'skipped';
        const status: 'pass' | 'fail' | 'skip' =
          rawStatus === 'passed' ? 'pass' : rawStatus === 'failed' ? 'fail' : 'skip';
        return {
          name: spec.title,
          status,
          duration: result?.duration ?? 0,
          errorMessage: result?.error?.message,
          stackTrace: result?.error?.stack,
        };
      }),
    };
  });
}

export function parseJUnitXml(xml: string): TestSuite[] {
  const suites: TestSuite[] = [];
  const suiteRe = /<testsuite\s+([^>]*)>([\s\S]*?)<\/testsuite>/g;
  const caseRe = /<testcase\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
  const failureRe = /<failure(?:[^>]*)message="([^"]*)"[^>]*>([\s\S]*?)<\/failure>/;
  const attrRe = /(\w+)="([^"]*)"/g;

  let suiteMatch: RegExpExecArray | null;
  while ((suiteMatch = suiteRe.exec(xml)) !== null) {
    const attrs = parseAttrs(suiteMatch[1] ?? '');
    const body = suiteMatch[2] ?? '';
    const tests: TestCase[] = [];

    let caseMatch: RegExpExecArray | null;
    caseRe.lastIndex = 0;
    while ((caseMatch = caseRe.exec(body)) !== null) {
      const caseAttrs = parseAttrs(caseMatch[1] ?? '');
      const caseBody = caseMatch[2] ?? '';
      const failMatch = failureRe.exec(caseBody);
      const status: 'pass' | 'fail' | 'skip' = failMatch ? 'fail' : 'pass';
      const duration = parseFloat(caseAttrs['time'] ?? '0') * 1000;
      tests.push({
        name: caseAttrs['name'] ?? 'unknown',
        status,
        duration: isNaN(duration) ? 0 : duration,
        errorMessage: failMatch?.[1],
        stackTrace: failMatch?.[2]?.trim(),
      });
    }

    suites.push({
      suiteName: attrs['name'] ?? 'unknown',
      format: 'junit-xml',
      tests,
    });
  }

  return suites;

  function parseAttrs(str: string): Record<string, string> {
    const result: Record<string, string> = {};
    attrRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(str)) !== null) {
      result[m[1]!] = m[2]!;
    }
    return result;
  }
}

export function parseTestResults(content: string, filename: string): TestSuite[] {
  if (filename.endsWith('.json')) return parsePlaywrightJson(content);
  if (filename.endsWith('.xml')) return parseJUnitXml(content);
  return [];
}
