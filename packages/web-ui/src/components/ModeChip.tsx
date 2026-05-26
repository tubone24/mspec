const MODE_TONE: Record<string, { label: string; dot: string }> = {
  full:   { label: 'Full-flow', dot: 'oklch(0.55 0.14 250)' },
  bugfix: { label: 'Bugfix',    dot: 'oklch(0.58 0.18 25)' },
  minor:  { label: 'Minor',     dot: 'oklch(0.55 0.12 160)' },
  typo:   { label: 'Typo',      dot: 'oklch(0.65 0.10 80)' },
};

interface ModeChipProps {
  mode: string;
  size?: 'sm' | 'md';
}

export function ModeChip({ mode, size = 'md' }: ModeChipProps) {
  const tone = MODE_TONE[mode] ?? { label: mode, dot: 'var(--ink-mute)' };
  const px = size === 'sm' ? '2px 7px' : '3px 9px';
  const fs = size === 'sm' ? 10.5 : 11.5;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: px, fontSize: fs, fontWeight: 500,
      letterSpacing: '0.2px',
      color: 'var(--ink-soft)',
      background: 'var(--paper)',
      border: '1px solid var(--rule)',
      borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: tone.dot, display: 'inline-block' }} />
      {tone.label}
    </span>
  );
}
