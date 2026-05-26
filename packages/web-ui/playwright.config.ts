import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.{test,spec}.ts', '**/screenshots/**/*.ts'],
  fullyParallel: true,
  reporter: [['json', { outputFile: 'test-results/results.json' }], ['html']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env['CI'],
    },
    {
      command: 'npx tsx tests/e2e/setup/api-server.ts',
      url: 'http://localhost:3847/api/health',
      reuseExistingServer: !process.env['CI'],
    },
  ],
});
