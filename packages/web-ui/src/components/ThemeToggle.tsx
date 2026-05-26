// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
// Requirements implemented: FR-004
// Change: mspec-web-ui
// Deprecated: replaced by ThemePicker (reading-mode-themes change)

import { useEffect } from 'react';
import { useChangesStore } from '../store/useChangesStore.js';
import { en } from '../i18n/en.js';

/** @deprecated Use ThemePicker instead */
export function ThemeToggle() {
  const { theme, setTheme } = useChangesStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={en.theme.toggle}
      data-testid="theme-toggle"
      className="px-3 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)]"
    >
      {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
    </button>
  );
}
