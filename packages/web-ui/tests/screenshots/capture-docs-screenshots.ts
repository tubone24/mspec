import { test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Output directory: monorepo root /docs/public/images/web-ui/
const outputDir = path.resolve(__dirname, '..', '..', '..', '..', 'docs', 'public', 'images', 'web-ui');
fs.mkdirSync(outputDir, { recursive: true });

function screenshotPath(name: string): string {
  return path.join(outputDir, name);
}

async function fetchFirstChangeId(baseURL: string): Promise<string> {
  const res = await fetch(`${baseURL.replace('5173', '3847')}/api/changes?includeArchived=true`);
  if (!res.ok) throw new Error(`Failed to fetch /api/changes: ${res.status}`);
  const data = (await res.json()) as Array<{ id: string }>;
  if (!data.length) throw new Error('No changes returned from /api/changes');
  return data[0].id;
}

async function fetchFirstCapability(baseURL: string): Promise<string> {
  const res = await fetch(`${baseURL.replace('5173', '3847')}/api/specs`);
  if (!res.ok) throw new Error(`Failed to fetch /api/specs: ${res.status}`);
  const data = (await res.json()) as Array<{ capability: string }>;
  if (!data.length) throw new Error('No specs returned from /api/specs');
  return data[0].capability;
}

const VIEWPORT = { width: 1440, height: 900 };

// --- Dashboard: 4 theme screenshots (viewport only, Archived filter active) ---

test.describe('Dashboard theme screenshots', () => {
  const themes = ['light', 'dark', 'sepia', 'green'] as const;

  for (const theme of themes) {
    test(`Dashboard - ${theme} theme`, async ({ page, baseURL }) => {
      await page.setViewportSize(VIEWPORT);

      await page.addInitScript((t: string) => {
        window.localStorage.setItem(
          'mspec-ui-store',
          JSON.stringify({ state: { theme: t }, version: 0 })
        );
      }, theme);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.evaluate((t: string) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);

      // Show archived changes so the change list is populated
      const archivedBtn = page.locator('[data-testid="filter-archived"]');
      if (await archivedBtn.count() > 0) {
        await archivedBtn.click();
        await page.waitForLoadState('networkidle');
      }

      await page.waitForTimeout(300);

      await page.screenshot({ path: screenshotPath(`dashboard-${theme}.png`) });
    });
  }
});

// --- ChangeDetail (artifact list) ---

test('ChangeDetail - artifact list', async ({ page, baseURL }) => {
  await page.setViewportSize(VIEWPORT);

  const changeId = await fetchFirstChangeId(baseURL ?? 'http://localhost:5173');

  await page.goto(`/changes/${changeId}`);
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: screenshotPath('change-detail.png') });
});

// --- ChangeDetail with split panel (artifact selected) ---

test('ChangeDetail - split panel with artifact selected', async ({ page, baseURL }) => {
  await page.setViewportSize(VIEWPORT);

  const changeId = await fetchFirstChangeId(baseURL ?? 'http://localhost:5173');

  await page.goto(`/changes/${changeId}`);
  await page.waitForLoadState('networkidle');

  const firstArtifact = page.locator('[data-testid^="artifact-item-"]').first();
  if (await firstArtifact.count() > 0) {
    await firstArtifact.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
  }

  await page.screenshot({ path: screenshotPath('change-detail-split.png') });
});

// --- SpecViewer ---

test('SpecViewer - markdown content', async ({ page, baseURL }) => {
  await page.setViewportSize(VIEWPORT);

  const capability = await fetchFirstCapability(baseURL ?? 'http://localhost:5173');

  await page.goto(`/spec-viewer/${encodeURIComponent(capability)}`);
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: screenshotPath('spec-viewer.png') });
});

// --- TestResults ---
// Use the change that has e2e-results/ data for a meaningful screenshot

test('TestResults page', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);

  // This archived change has a results.json with pass/fail/skip examples
  const changeId = '2026-05-25-012714-mspec-web-ui-e2e';

  await page.goto(`/changes/${changeId}/test-results`);
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: screenshotPath('test-results.png') });
});
