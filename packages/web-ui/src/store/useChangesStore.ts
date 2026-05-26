// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-002
// Change: mspec-web-ui
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-003
// Change: reading-mode-themes

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'sepia' | 'green' | 'dark';

const VALID_THEMES: Theme[] = ['light', 'sepia', 'green', 'dark'];

function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (VALID_THEMES as string[]).includes(v);
}

interface ChangesStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useChangesStore = create<ChangesStore>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'mspec-ui-store',
      merge: (persisted, current) => {
        const stored = (persisted as Partial<ChangesStore>).theme;
        return { ...current, theme: isTheme(stored) ? stored : 'light' };
      },
    },
  ),
);
