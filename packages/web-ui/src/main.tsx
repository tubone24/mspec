import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.js';

// Apply persisted theme before first render to avoid flash
(function applyPersistedTheme() {
  try {
    const raw = localStorage.getItem('mspec-ui-store');
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state?: { theme?: string } };
    const theme = parsed?.state?.theme;
    if (typeof theme === 'string' && theme.length > 0) {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') document.documentElement.classList.add('dark');
    }
  } catch {
    // ignore parse errors
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
