// @mspec-delta 2026-05-31-010428-fix-webui-archive-initial-count/specs/change-dashboard/spec.md
// Requirements implemented: FR-011
// Change: fix-webui-archive-initial-count

import { test, expect } from '@playwright/test';

// T305: change-dashboard FR-011 — Archive count API call fires on initial page load
test('Dashboard: GET /api/changes?includeArchived=true is called on initial load without user interaction', async ({ page }) => {
  const archivedApiCallPromise = page.waitForRequest(
    req => req.url().includes('/api/changes') && req.url().includes('includeArchived=true'),
    { timeout: 5000 },
  );

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // The parallel query for archived count must have fired on mount (not after user click)
  await archivedApiCallPromise;
});

// T306: change-dashboard FR-011 — Archive count badge shows a numeric value on initial load
test('Dashboard: archive count badge contains a number on initial load', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const filterArchived = page.locator('[data-testid="filter-archived"]');
  await expect(filterArchived).toBeVisible();

  // The count text inside the button should be a number (0 or positive integer)
  const countText = await filterArchived.locator('span.mono').textContent();
  expect(Number(countText)).toBeGreaterThanOrEqual(0);
  expect(isNaN(Number(countText))).toBe(false);
});
