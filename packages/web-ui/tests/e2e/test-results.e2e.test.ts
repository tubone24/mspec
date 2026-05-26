// @mspec-delta 2026-05-25-012714-mspec-web-ui-e2e/specs/test-result-viewer/spec.md
// Requirements implemented: FR-005, FR-006
// Change: mspec-web-ui-e2e

import { test, expect } from '@playwright/test';

async function getFirstChangeId(page: import('@playwright/test').Page): Promise<string | null> {
  const response = await page.request.get('/api/changes');
  const changes = await response.json() as Array<{ id: string }>;
  return changes.length > 0 ? changes[0]!.id : null;
}

// T206: test-result-viewer FR-005 — Test result badges or no-results message
test('TestResults: badges or no-results message are visible', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found — skipping test results test');
    return;
  }

  await page.goto(`/changes/${changeId}/test-results`);
  await page.waitForLoadState('networkidle');

  const passBadge = page.locator('[data-testid="test-case-pass"]');
  const failBadge = page.locator('[data-testid="test-case-fail"]');
  const skipBadge = page.locator('[data-testid="test-case-skip"]');
  const noResults = page.locator('text=No test results found.');

  const passCount = await passBadge.count();
  const failCount = await failBadge.count();
  const skipCount = await skipBadge.count();
  const hasNoResults = await noResults.isVisible();

  // Either some badges exist or the no-results message is shown
  expect(passCount + failCount + skipCount > 0 || hasNoResults).toBe(true);
});

// T207: test-result-viewer FR-006 — Fail trace panel expands on click
test('TestResults: fail trace-panel expands when fail badge is clicked', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found — skipping trace panel test');
    return;
  }

  await page.goto(`/changes/${changeId}/test-results`);
  await page.waitForLoadState('networkidle');

  const failBadge = page.locator('[data-testid="test-case-fail"]').first();
  const failCount = await failBadge.count();

  if (failCount === 0) {
    test.skip(true, 'No failed tests in this change — skipping trace panel test');
    return;
  }

  await failBadge.click();
  await expect(page.locator('[data-testid="trace-panel"]').first()).toBeVisible({ timeout: 3000 });
});
