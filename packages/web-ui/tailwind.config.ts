import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"], .dark'],
  theme: {
    extend: {
      backgroundColor: {
        theme: 'var(--color-bg)',
        surface: 'var(--color-surface)',
      },
      textColor: {
        theme: 'var(--color-fg)',
      },
      borderColor: {
        theme: 'var(--color-border)',
      },
    },
  },
  plugins: [typography],
} satisfies Config;
