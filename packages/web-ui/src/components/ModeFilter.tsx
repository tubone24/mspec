// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-003
// Change: mspec-web-ui

type Mode = 'all' | 'full' | 'bugfix' | 'minor' | 'typo';

const MODES: Mode[] = ['all', 'full', 'bugfix', 'minor', 'typo'];
const LABELS: Record<Mode, string> = {
  all: 'All', full: 'Full-flow', bugfix: 'Bugfix', minor: 'Minor', typo: 'Typo',
};

export function ModeFilter({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      role="tablist"
      data-testid="mode-filter"
      style={{
        display: 'inline-flex', gap: 2,
        background: 'var(--paper)', border: '1px solid var(--rule)',
        borderRadius: 8, padding: 3,
      }}
    >
      {MODES.map((m) => {
        const active = value === m;
        return (
          <button
            key={m}
            role="tab"
            aria-selected={active}
            data-testid={`filter-${m}`}
            onClick={() => onChange(m)}
            style={{
              padding: '5px 11px', fontSize: 12.5, fontWeight: 500,
              border: '1px solid transparent', borderRadius: 5,
              background: active ? 'var(--accent-soft)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-soft)',
              cursor: 'pointer', transition: 'background-color .15s',
            }}
          >
            {LABELS[m]}
          </button>
        );
      })}
    </div>
  );
}

export type { Mode as ModeFilterValue };
