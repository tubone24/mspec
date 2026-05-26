// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: reading-mode-themes

import { useEffect } from 'react';
import { useChangesStore, type Theme } from '../store/useChangesStore.js';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: '☀ Light' },
  { value: 'sepia', label: '📖 Sepia' },
  { value: 'green', label: '🌿 Green' },
  { value: 'dark', label: '🌙 Dark' },
];

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
    <div className="flex gap-1" data-testid="theme-picker">
      {THEMES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          aria-label={value}
          className={`px-2 py-1 text-xs border rounded transition-colors ${
            theme === value
              ? 'bg-[var(--color-accent)] text-white border-transparent'
              : 'border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
