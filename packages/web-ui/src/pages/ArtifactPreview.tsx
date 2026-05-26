// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
// Change: mspec-web-ui
// @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md
// Requirements implemented: FR-009
// Change: web-ui-viewer-improvements
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001, FR-002
// Change: reading-mode-themes

import { useParams, useNavigate } from 'react-router-dom';
import { ArtifactViewer } from '../components/ArtifactViewer.js';
import { ThemePicker } from '../components/ThemePicker.js';

export function ArtifactPreview() {
  const { id, '*': relativePath } = useParams<{ id: string; '*': string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-border)]">
        <button
          onClick={() => navigate(`/changes/${id}`)}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          ← Back
        </button>
        <span className="font-mono text-sm">{relativePath}</span>
        <ThemePicker />
      </header>
      <main>
        <ArtifactViewer changeId={id!} relativePath={relativePath!} />
      </main>
    </div>
  );
}
