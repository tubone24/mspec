// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: reading-mode-themes

import { useEffect } from 'react';
import { useChangesStore, type Theme } from '../store/useChangesStore.js';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'green', label: 'Green' },
  { value: 'dark',  label: 'Dark' },
];

const SWATCH_BG: Record<Theme, string> = {
  light: '#fbfaf7', sepia: '#f4ead5', green: '#dee9d3', dark: '#15151a',
};
const SWATCH_INK: Record<Theme, string> = {
  light: '#1a1a1f', sepia: '#3b2c1a', green: '#1f3320', dark: '#e8e2d4',
};

export function ThemePicker() {
  const { theme, setTheme } = useChangesStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div
      role="radiogroup"
      aria-label="Reading theme"
      data-testid="theme-picker"
      style={{
        display: 'inline-flex', gap: 2, padding: 3,
        border: '1px solid var(--rule)', borderRadius: 8,
        background: 'var(--paper)',
      }}
    >
      {THEMES.map((t) => {
        const active = t.value === theme;
        return (
          <button
            key={t.value}
            role="radio"
            aria-checked={active}
            aria-label={t.value}
            onClick={() => setTheme(t.value)}
            title={`${t.label} theme`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', border: '1px solid transparent',
              borderRadius: 5,
              background: active ? 'var(--accent-soft)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-soft)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'background-color .15s, color .15s',
            }}
          >
            {/* Swatch */}
            <span aria-hidden style={{
              width: 14, height: 14, borderRadius: 3,
              background: SWATCH_BG[t.value],
              border: '1px solid var(--rule)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: active ? '0 0 0 1px var(--accent) inset' : 'none',
              flexShrink: 0,
            }}>
              <span style={{ width: 6, height: 1.5, background: SWATCH_INK[t.value], borderRadius: 1, display: 'inline-block' }} />
            </span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
