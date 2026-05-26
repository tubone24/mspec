// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/test-result-viewer/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: mspec-web-ui
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001, FR-002
// Change: reading-mode-themes

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTestResults, type TestCase } from '../api/client.js';
import { ThemePicker } from '../components/ThemePicker.js';
import { en } from '../i18n/en.js';

const STATUS_CLASSES: Record<string, string> = {
  pass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  fail: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  skip: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export function TestResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: suites, isLoading, error } = useTestResults(id!);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (isLoading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">Error loading test results.</div>;

  const allTests: (TestCase & { suite: string })[] = (suites ?? []).flatMap((s) =>
    s.tests.map((t) => ({ ...t, suite: s.suiteName })),
  );

  const failed = allTests.filter((t) => t.status === 'fail');
  const others = allTests.filter((t) => t.status !== 'fail');
  const sorted = [...failed, ...others];

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-border)]">
        <button
          onClick={() => navigate(`/changes/${id}`)}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold">{en.testResults.title}</h1>
        <ThemePicker />
      </header>
      <main className="px-8 py-6">
        {sorted.length === 0 ? (
          <p className="text-gray-400">{en.testResults.noResults}</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((t, i) => {
              const key = `${t.suite}::${t.name}`;
              const isExpanded = expanded.has(key);
              return (
                <li
                  key={i}
                  className="border border-[var(--color-border)] rounded p-3"
                  data-testid={`test-case-${t.status}`}
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => t.status === 'fail' && toggle(key)}
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono ${STATUS_CLASSES[t.status]}`}
                    >
                      {en.testResults[t.status as 'pass' | 'fail' | 'skip']}
                    </span>
                    <span className="text-sm">{t.name}</span>
                    <span className="ml-auto text-xs text-gray-400">{t.duration}ms</span>
                  </div>
                  {t.status === 'fail' && isExpanded && (
                    <div className="mt-3 text-sm" data-testid="trace-panel">
                      {t.errorMessage && (
                        <p className="text-red-600 mb-2">{t.errorMessage}</p>
                      )}
                      {t.stackTrace && (
                        <pre className="bg-[var(--color-surface)] p-3 rounded text-xs overflow-auto">
                          {t.stackTrace}
                        </pre>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
