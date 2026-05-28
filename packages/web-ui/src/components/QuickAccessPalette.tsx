// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
// Change: markdown-search-and-quick-access

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChanges, useSpecs } from '../api/client.js';
import { STEP_LABELS } from '../components/StepProgress.js';

interface QuickAccessItem {
  id: string;
  type: 'spec' | 'change' | 'next-step';
  label: string;
  href: string;
}

interface QuickAccessPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAccessPalette({ isOpen, onClose }: QuickAccessPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data: changes = [] } = useChanges(false);
  const { data: specs = [] } = useSpecs();

  // Reset query when palette opens
  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  // Build items list (FR-003)
  const items: QuickAccessItem[] = [];

  // Next Step navigation — most recently updated in-progress change (D6)
  const inProgressChanges = changes
    .filter((c) => !c.isArchived)
    .sort((a, b) =>
      new Date(b.updatedAt ?? b.createdAt).getTime() -
      new Date(a.updatedAt ?? a.createdAt).getTime(),
    );
  if (inProgressChanges.length > 0) {
    const top = inProgressChanges[0]!;
    const stepLabel = STEP_LABELS[top.currentStep] ?? top.currentStep;
    items.push({
      id: `next-step-${top.id}`,
      type: 'next-step',
      label: `→ ${top.name}: ${stepLabel}`,
      href: `/changes/${top.id}`,
    });
  }

  // Changes
  for (const c of changes.slice(0, 20)) {
    items.push({
      id: `change-${c.id}`,
      type: 'change',
      label: c.title ?? c.name,
      href: `/changes/${c.id}`,
    });
  }

  // Specs (capabilities)
  for (const s of specs.slice(0, 30)) {
    items.push({
      id: `spec-${s.capability}`,
      type: 'spec',
      label: s.capability,
      href: `/spec-viewer/${s.capability}`,
    });
  }

  // FR-004: incremental filtering (literal, case-insensitive, no regex)
  const filtered = query.trim()
    ? items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  const handleSelect = useCallback(
    (item: QuickAccessItem) => {
      onClose();
      navigate(item.href);
    },
    [navigate, onClose],
  );

  // FR-005: ESC key handled by backdrop keydown
  const handleBackdropKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    // FR-005: backdrop click closes palette
    <div
      data-testid="quick-access-backdrop"
      onClick={onClose}
      onKeyDown={handleBackdropKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Quick access"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
    >
      <div
        data-testid="quick-access-palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: 12,
          width: '100%', maxWidth: 560,
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px',
          borderBottom: '1px solid var(--rule)',
        }}>
          <span style={{ color: 'var(--ink-mute)', fontSize: 14 }}>⌕</span>
          <input
            data-testid="quick-access-input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Go to spec, change, or next step…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: 'var(--ink)',
              fontSize: 15, fontFamily: 'inherit',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
            }}
          />
          <kbd style={{
            fontSize: 11, border: '1px solid var(--rule)', borderBottomWidth: 2,
            padding: '1px 5px', borderRadius: 4, color: 'var(--ink-mute)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>ESC</kbd>
        </div>

        {/* Results list */}
        <ul style={{ margin: 0, padding: '6px 0', listStyle: 'none', maxHeight: 360, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <li style={{ padding: '10px 16px', color: 'var(--ink-mute)', fontSize: 13 }}>
              No results
            </li>
          )}
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                data-testid="quick-access-item"
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '8px 16px',
                  border: 'none', background: 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                  color: 'var(--ink)',
                  fontSize: 13,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rule-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  fontSize: 10, color: 'var(--ink-mute)',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.5px', minWidth: 60,
                }}>
                  {item.type === 'next-step' ? 'next' : item.type}
                </span>
                <span style={{ flex: 1, fontFamily: item.type === 'spec' ? "'JetBrains Mono', monospace" : 'inherit' }}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
