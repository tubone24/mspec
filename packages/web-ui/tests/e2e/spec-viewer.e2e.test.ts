// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
// Requirements implemented: FR-009
// Change: web-ui-enhancements

import { test, expect } from '@playwright/test';

// T401: change-dashboard FR-009 — Spec Viewer link is present on dashboard
test('Dashboard: Spec Viewer navigation link is present', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Spec Viewer')).toBeVisible();
});

// T402: change-dashboard FR-009 — Spec Viewer route loads capability list
test('Spec Viewer: /spec-viewer shows capability list', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  // Left pane should show at least one capability
  const items = page.locator('[data-testid="capability-item"]');
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
});

// T403: change-dashboard FR-009 — Clicking capability renders markdown
test('Spec Viewer: clicking a capability renders spec content', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  const firstItem = page.locator('[data-testid="capability-item"]').first();
  await firstItem.click();
  await page.waitForTimeout(500);
  // Right pane should show rendered markdown (look for headings)
  const heading = page.locator('[data-testid="spec-content"] h1, [data-testid="spec-content"] h2').first();
  await expect(heading).toBeVisible();
});
