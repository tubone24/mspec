// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: mspec-web-ui
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001, FR-002
// Change: reading-mode-themes

import { useNavigate } from 'react-router-dom';
import { useChanges, type ChangeInfo } from '../api/client.js';
import { StepProgress } from '../components/StepProgress.js';
import { ModeFilter } from '../components/ModeFilter.js';
import { ThemePicker } from '../components/ThemePicker.js';
import { useState } from 'react';
import { en } from '../i18n/en.js';

type ModeFilter_ = 'all' | 'full' | 'bugfix' | 'minor' | 'typo';

export function Dashboard() {
  const { data: changes, isLoading, error } = useChanges();
  const [modeFilter, setModeFilter] = useState<ModeFilter_>('all');
  const navigate = useNavigate();

  const filtered = (changes ?? []).filter(
    (c) => modeFilter === 'all' || c.mode === modeFilter,
  );

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (isLoading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">Error loading changes.</div>;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-border)]">
        <h1 className="text-2xl font-bold">{en.dashboard.title}</h1>
        <ThemePicker />
      </header>
      <main className="px-8 py-6">
        <ModeFilter value={modeFilter} onChange={setModeFilter} />
        {sorted.length === 0 ? (
          <p className="mt-8 text-gray-400">{en.dashboard.noChanges}</p>
        ) : (
          <table className="mt-4 w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-gray-500">
                <th className="py-2 pr-4">{en.dashboard.columns.change}</th>
                <th className="py-2 pr-4">{en.dashboard.columns.mode}</th>
                <th className="py-2 pr-4">{en.dashboard.columns.currentStep}</th>
                <th className="py-2">{en.dashboard.columns.progress}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((change) => (
                <ChangeRow
                  key={change.id}
                  change={change}
                  onClick={() => navigate(`/changes/${change.id}`)}
                />
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

function ChangeRow({ change, onClick }: { change: ChangeInfo; onClick: () => void }) {
  return (
    <tr
      className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] cursor-pointer"
      onClick={onClick}
      data-testid={`change-row-${change.id}`}
    >
      <td className="py-3 pr-4 font-mono text-xs">{change.name}</td>
      <td className="py-3 pr-4">
        <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-surface)]">
          {change.mode}
        </span>
      </td>
      <td className="py-3 pr-4 text-xs">{change.currentStep}</td>
      <td className="py-3">
        <StepProgress steps={change.steps} />
      </td>
    </tr>
  );
}
