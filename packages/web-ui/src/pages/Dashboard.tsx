// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: mspec-web-ui
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001, FR-002
// Change: reading-mode-themes
// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
// Requirements implemented: FR-008, FR-009
// Change: web-ui-enhancements
// @mspec-delta 2026-05-27-000005-full-text-search/specs/web-ui-search/spec.md
// Requirements implemented: FR-001, FR-002
// Change: full-text-search
// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/web-ui-search/spec.md
// Requirements implemented: FR-004, FR-005
// Change: markdown-search-and-quick-access

import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useSearchIndex } from '../hooks/useSearchIndex.js';
import { extractSnippet } from '../lib/extractSnippet.js';
import { useChanges, type ChangeInfo } from '../api/client.js';
import { StepProgress, StepLegend, STEP_LABELS } from '../components/StepProgress.js';
import { ModeFilter, type ModeFilterValue } from '../components/ModeFilter.js';
import { ModeChip } from '../components/ModeChip.js';
import { ThemePicker } from '../components/ThemePicker.js';
import { AppBar } from '../components/AppBar.js';
import { Search } from '../components/Search.js';

type StatusFilter = 'all' | 'in-progress' | 'ready' | 'shipped' | 'archived';

function relativeTime(iso: string | undefined): string {
  if (!iso) return '—';
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = (now - t) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isShipped(c: ChangeInfo) {
  return c.steps.length > 0 && c.steps.every((s) => s.state === 'done');
}
function isInProgress(c: ChangeInfo) {
  return !isShipped(c) && !c.isArchived;
}
function isReady(c: ChangeInfo) {
  return isInProgress(c) && (c.currentStep === 'spec' || c.currentStep === 'plan');
}


export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const showArchivedParam = searchParams.get('showArchived') === 'true';
  const [statusFilter, setStatusFilterState] = useState<StatusFilter>(
    showArchivedParam ? 'archived' : 'all',
  );
  const [modeFilter, setModeFilter] = useState<ModeFilterValue>('all');
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const setStatusFilter = (updater: StatusFilter | ((prev: StatusFilter) => StatusFilter)) => {
    setStatusFilterState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next === 'archived') {
        setSearchParams({ showArchived: 'true' }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
      return next;
    });
  };

  const includeArchived = statusFilter === 'archived';
  const { data: changes = [], isLoading, error } = useChanges(includeArchived);

  const { index: searchIndex, contentCache, isBuilding: indexBuilding } = useSearchIndex(changes);

  const counts = useMemo(() => ({
    inProgress: changes.filter(isInProgress).length,
    ready:      changes.filter(isReady).length,
    shipped:    changes.filter((c) => isShipped(c) && !c.isArchived).length,
    archived:   changes.filter((c) => c.isArchived).length,
  }), [changes]);

  const modeCount = (m: string) =>
    m === 'all' ? changes.length : changes.filter((c) => c.mode === m).length;

  // Build score map from full-text search results (D-04) with AND condition (FR-005)
  const { matchedIds, scoreMap, snippetMap } = useMemo(() => {
    const trimmed = q.trim();
    if (!trimmed || indexBuilding || !searchIndex) {
      return { matchedIds: null, scoreMap: new Map<string, number>(), snippetMap: new Map<string, string>() };
    }
    const results = searchIndex.search(trimmed, { combineWith: 'AND' });
    const scoreMap = new Map<string, number>();
    const snippetMap = new Map<string, string>();
    for (const r of results) {
      const changeId = r['changeId'] as string;
      const prev = scoreMap.get(changeId) ?? 0;
      if (r.score > prev) scoreMap.set(changeId, r.score);
      if (!snippetMap.has(changeId)) {
        const snippet = extractSnippet(contentCache.get(changeId) ?? '', trimmed);
        if (snippet) snippetMap.set(changeId, snippet);
      }
    }
    return { matchedIds: new Set(scoreMap.keys()), scoreMap, snippetMap };
  }, [q, searchIndex, contentCache, indexBuilding]);

  const filtered = useMemo(() => {
    return changes
      .filter((c) => {
        switch (statusFilter) {
          case 'in-progress': return isInProgress(c);
          case 'ready':       return isReady(c);
          case 'shipped':     return isShipped(c) && !c.isArchived;
          case 'archived':    return c.isArchived;
          default:            return !c.isArchived;
        }
      })
      .filter((c) => modeFilter === 'all' || c.mode === modeFilter)
      .filter((c) => {
        if (!q.trim()) return true;
        // Full-text search when index is ready; fall back to includes() (D-03)
        if (matchedIds) return matchedIds.has(c.id);
        const searchable = [c.name, c.title, c.summary, ...(c.tags ?? [])].join(' ').toLowerCase();
        return searchable.includes(q.toLowerCase());
      })
      .sort((a, b) => {
        // Score-based sort when full-text results available (D-04)
        if (q.trim() && scoreMap.size > 0) {
          const sa = scoreMap.get(a.id) ?? -1;
          const sb = scoreMap.get(b.id) ?? -1;
          if (sa !== sb) return sb - sa;
        }
        return new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime();
      });
  }, [changes, statusFilter, modeFilter, q, matchedIds, scoreMap]);

  const STATUS_ITEMS: Array<{ id: StatusFilter; label: string; count: number }> = [
    { id: 'in-progress', label: 'In progress',   count: counts.inProgress },
    { id: 'ready',       label: 'Ready to read',  count: counts.ready },
    { id: 'shipped',     label: 'Shipped',         count: counts.shipped },
    { id: 'archived',    label: 'Archived',        count: counts.archived },
  ];

  return (
    <>
      <AppBar
        breadcrumb={
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', marginLeft: 8 }}>
            / dashboard
          </span>
        }
        right={
          <>
            <Search value={q} onChange={setQ} />
            <ThemePicker />
          </>
        }
      />

      <main style={{
        display: 'grid', gridTemplateColumns: '260px 1fr', gap: 0,
        maxWidth: 1400, margin: '0 auto',
      }}>
        {/* Left rail */}
        <aside style={{
          padding: '32px 8px 32px 28px',
          borderRight: '1px solid var(--rule)',
          minHeight: 'calc(100vh - 57px)',
        }}>
          <RailSectionLabel>Status</RailSectionLabel>
          {STATUS_ITEMS.map(({ id, label, count }) => (
            <RailButton
              key={id}
              label={label}
              count={count}
              active={statusFilter === id}
              onClick={() => setStatusFilter(prev => prev === id ? 'all' : id)}
            />
          ))}

          <RailSectionLabel style={{ marginTop: 28 }}>Mode</RailSectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(['all', 'full', 'bugfix', 'minor', 'typo'] as const).map((m) => {
              const active = modeFilter === m;
              return (
                <button key={m} onClick={() => setModeFilter(m)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 10px',
                  border: 'none', background: active ? 'var(--accent-soft)' : 'transparent',
                  borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                  borderRadius: '0 4px 4px 0',
                  fontSize: 13, color: active ? 'var(--ink)' : 'var(--ink-soft)',
                  fontWeight: active ? 600 : 400, cursor: 'pointer', textAlign: 'left',
                  width: '100%',
                }}>
                  <span>{m === 'all' ? 'All' : m.charAt(0).toUpperCase() + m.slice(1)}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{modeCount(m)}</span>
                </button>
              );
            })}
          </div>

          <RailSectionLabel style={{ marginTop: 28 }}>Navigate</RailSectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Link
              to="/spec-viewer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px', borderRadius: 4,
                fontSize: 13, color: 'var(--ink-soft)', textDecoration: 'none',
                borderLeft: '2px solid transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rule-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span aria-hidden style={{ fontSize: 12, color: 'var(--ink-mute)' }}>◈</span>
              Spec Viewer
            </Link>
            <button
              onClick={() => setStatusFilter(prev => prev === 'archived' ? 'all' : 'archived')}
              data-testid="filter-archived"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px',
                border: 'none',
                background: statusFilter === 'archived' ? 'var(--accent-soft)' : 'transparent',
                borderLeft: `2px solid ${statusFilter === 'archived' ? 'var(--accent)' : 'transparent'}`,
                borderRadius: '0 4px 4px 0',
                fontSize: 13,
                color: statusFilter === 'archived' ? 'var(--ink)' : 'var(--ink-soft)',
                fontWeight: statusFilter === 'archived' ? 600 : 400,
                cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              <span aria-hidden style={{ fontSize: 12, color: 'var(--ink-mute)' }}>⊘</span>
              Archived
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-mute)' }}>
                {counts.archived}
              </span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <section style={{ padding: '36px 36px 80px' }}>
          <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 className="serif" style={{
              margin: 0, fontSize: 32, fontWeight: 600, letterSpacing: '-0.015em',
              color: 'var(--ink)',
            }}>Changes</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)', maxWidth: '60ch' }}>
              Specifications in flight, sorted by most-recently-updated. Open a change to read its requirements, scenarios and design notes.
            </p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                {filtered.length} of {changes.length}
              </span>
              <StepLegend />
            </div>
            <ModeFilter value={modeFilter} onChange={setModeFilter} />
          </div>

          {isLoading && (
            <p style={{ color: 'var(--ink-mute)', padding: '24px 0' }}>Loading…</p>
          )}
          {error && (
            <p style={{ color: 'var(--invalid)', padding: '24px 0' }}>Error loading changes.</p>
          )}
          {!isLoading && !error && (
            <div>
              {filtered.length === 0 ? (
                <p style={{ color: 'var(--ink-mute)', padding: '24px 0' }}>No active changes found.</p>
              ) : (
                filtered.map((c) => (
                  <ChangeRow
                    key={c.id}
                    change={c}
                    snippet={snippetMap.get(c.id)}
                    onClick={() => navigate(`/changes/${c.id}`)}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RailSectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="mono" style={{
      fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase',
      color: 'var(--ink-mute)', marginBottom: 12, paddingLeft: 10,
      ...style,
    }}>{children}</div>
  );
}

function RailButton({
  label, count, active, onClick,
}: {
  label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '5px 10px', border: 'none',
        background: active ? 'var(--accent-soft)' : 'transparent',
        borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        borderRadius: '0 4px 4px 0',
        fontSize: 13, color: active ? 'var(--ink)' : 'var(--ink-soft)',
        fontWeight: active ? 600 : 400, cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span>{label}</span>
      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{count}</span>
    </button>
  );
}

function ChangeRow({ change, snippet, onClick }: { change: ChangeInfo; snippet?: string; onClick: () => void }) {
  const hasTitle = !!change.title && change.title !== change.name;
  const displayTitle = hasTitle ? change.title! : change.name;
  const ago = relativeTime(change.updatedAt ?? change.createdAt);

  return (
    <article
      onClick={onClick}
      data-testid={`change-row-${change.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 110px 130px',
        gap: 24, alignItems: 'center',
        padding: '20px 0',
        borderBottom: '1px solid var(--rule)',
        cursor: 'pointer',
        transition: 'background-color .15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rule-soft)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Main info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h3 className="serif" style={{
            margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.005em',
            color: 'var(--ink)',
          }}>{displayTitle}</h3>
          {/* show mono slug only when a separate human-readable title exists */}
          {hasTitle && (
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{change.name}</span>
          )}
          {change.isArchived && (
            <span
              data-testid="archived-badge"
              className="mono"
              style={{
                fontSize: 10, padding: '1px 6px',
                border: '1px solid var(--rule)', borderRadius: 4,
                color: 'var(--ink-mute)', opacity: 0.7,
              }}
            >archived</span>
          )}
        </div>

        {/* Description — shown when available from API */}
        {change.summary && (
          <p style={{
            margin: 0, fontSize: 13.5, color: 'var(--ink-soft)',
            lineHeight: 1.5, maxWidth: '72ch',
          }}>
            {change.summary}
          </p>
        )}

        {/* Search snippet — XSS-safe: textContent only, line-clamp-3 */}
        {snippet && (
          <p
            data-testid="change-snippet"
            className="line-clamp-3"
            style={{
              margin: 0, fontSize: 12, color: 'var(--ink-mute)',
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.5, maxWidth: '80ch', whiteSpace: 'pre-wrap',
            }}
          >
            {snippet}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>
          <ModeChip mode={change.mode} size="sm" />
          {change.counts && (
            <span>{change.counts.reqs} reqs · {change.counts.scenarios} scenarios · {change.counts.artifacts} artifacts</span>
          )}
          <span>·</span>
          <span>updated {ago}</span>
        </div>
      </div>

      {/* Current step */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>Current</span>
        <span className="serif" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
          {STEP_LABELS[change.currentStep] ?? change.currentStep}
        </span>
      </div>

      {/* Step progress */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <StepProgress steps={change.steps} />
      </div>
    </article>
  );
}
