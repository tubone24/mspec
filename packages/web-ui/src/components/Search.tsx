interface SearchProps {
  value: string;
  onChange: (v: string) => void;
}

export function Search({ value, onChange }: SearchProps) {
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
        placeholder="Search changes, tags…"
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          color: 'var(--ink)', fontSize: 13,
          fontFamily: 'inherit',
        }}
      />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, border: '1px solid var(--rule)', borderBottomWidth: 2,
        padding: '1px 5px', borderRadius: 4, color: 'var(--ink-soft)',
        background: 'var(--paper)',
      }}>⌘K</span>
    </div>
  );
}
