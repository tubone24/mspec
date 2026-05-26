// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-004
// Change: mspec-web-ui
// @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md
// Requirements implemented: FR-010
// Change: web-ui-viewer-improvements
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001, FR-002
// Change: reading-mode-themes

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useArtifacts } from '../api/client.js';
import { ArtifactViewer } from '../components/ArtifactViewer.js';
import { ThemePicker } from '../components/ThemePicker.js';
import { en } from '../i18n/en.js';
import { useState } from 'react';

export function ChangeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: artifacts, isLoading, error } = useArtifacts(id!);
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

  if (isLoading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">Error loading artifacts.</div>;

  function handleArtifactClick(relativePath: string) {
    setSelectedArtifact((prev) => (prev === relativePath ? null : relativePath));
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)] flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            {en.changeDetail.back}
          </button>
          <h1 className="text-lg font-bold font-mono">{id}</h1>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            to={`/changes/${id}/test-results`}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            {en.changeDetail.testResults}
          </Link>
          <ThemePicker />
        </div>
      </header>
      <div className={selectedArtifact ? 'grid grid-cols-[280px_1fr] flex-1 min-h-0' : 'flex-1'}>
        <aside
          className={`px-8 py-6 overflow-auto${selectedArtifact ? ' border-r border-[var(--color-border)]' : ''}`}
          data-testid="artifact-list"
        >
          <h2 className="text-base font-semibold mb-4">{en.changeDetail.artifacts}</h2>
          <ul className="space-y-1">
            {(artifacts ?? []).map((a) => (
              <li key={a.relativePath}>
                <button
                  onClick={() => handleArtifactClick(a.relativePath)}
                  data-testid={`artifact-item-${a.relativePath}`}
                  className={`font-mono text-sm text-left hover:underline ${
                    selectedArtifact === a.relativePath
                      ? 'text-[var(--color-accent)] font-semibold'
                      : 'text-[var(--color-accent)]'
                  }`}
                >
                  {a.name}
                </button>
                <span className="ml-2 text-xs text-gray-400">{a.type}</span>
              </li>
            ))}
          </ul>
        </aside>
        {selectedArtifact && (
          <section
            className="overflow-auto border-l border-[var(--color-border)]"
            data-testid="artifact-viewer-panel"
          >
            <ArtifactViewer
              changeId={id!}
              relativePath={selectedArtifact}
              onClose={() => setSelectedArtifact(null)}
            />
          </section>
        )}
      </div>
    </div>
  );
}
