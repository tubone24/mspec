// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-003
// Change: mspec-web-ui

import { en } from '../i18n/en.js';

type Mode = 'all' | 'full' | 'bugfix' | 'minor' | 'typo';

const MODES: Mode[] = ['all', 'full', 'bugfix', 'minor', 'typo'];

export function ModeFilter({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div className="flex gap-2" data-testid="mode-filter">
      {MODES.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          data-testid={`filter-${m}`}
          className={`px-3 py-1 text-xs rounded border ${
            value === m
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {en.dashboard.filter[m]}
        </button>
      ))}
    </div>
  );
}
