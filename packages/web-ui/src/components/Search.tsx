// @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
// Requirements implemented: FR-001, FR-007
// Change: spec-viewer-fulltext-search
// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
// Requirements implemented: FR-002
// Change: markdown-search-and-quick-access

const isMacPlatform =
  typeof navigator !== 'undefined' &&
  /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? '');

interface SearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onClear?: () => void;
  inputTestId?: string;
  clearTestId?: string;
}

export function Search({
  value,
  onChange,
  placeholder = 'Search changes, tags…',
  onClear,
  inputTestId,
  clearTestId,
}: SearchProps) {
  const shortcutLabel = isMacPlatform ? '⌘K' : 'Ctrl+K';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '5px 10px',
      border: '1px solid var(--rule)', borderRadius: 8,
      background: 'var(--paper)', minWidth: 240,
    }}>
      <span aria-hidden style={{ color: 'var(--ink-mute)', fontSize: 13 }}>⌕</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={inputTestId}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          color: 'var(--ink)', fontSize: 13,
          fontFamily: 'inherit',
        }}
      />
      {onClear && value ? (
        <button
          onClick={onClear}
          data-testid={clearTestId}
          aria-label="Clear search"
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--ink-mute)', fontSize: 14, padding: '0 2px',
            lineHeight: 1,
          }}
        >×</button>
      ) : (
        <span
          data-testid="search-shortcut-hint"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, border: '1px solid var(--rule)', borderBottomWidth: 2,
            padding: '1px 5px', borderRadius: 4, color: 'var(--ink-soft)',
            background: 'var(--paper)',
          }}
        >{shortcutLabel}</span>
      )}
    </div>
  );
}
