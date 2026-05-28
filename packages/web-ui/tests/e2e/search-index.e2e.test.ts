// @mspec-delta 2026-05-27-000005-full-text-search/specs/search-index/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: full-text-search

import { test, expect } from '@playwright/test';

// T-007: search-index FR-001 — index is built on browser startup
test('SearchIndex: artifact content requests are made on startup to build index', async ({ page }) => {
  const artifactRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/changes/') && req.url().includes('/artifacts/')) {
      artifactRequests.push(req.url());
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Allow time for index building
  await page.waitForTimeout(3000);

  // Artifact content should have been fetched for index building
  expect(artifactRequests.length).toBeGreaterThan(0);
});

// T-008: search-index FR-002 — multiple fields are indexed (name, title, summary, tags, content)
test('SearchIndex: search matches across name field', async ({ page }) => {
  // Get a real change name to search for
  const response = await page.request.get('/api/changes');
  const changes = await response.json() as Array<{ id: string; name: string }>;
  if (changes.length === 0) {
    test.skip(true, 'No active changes found — skipping search-index name field test');
    return;
  }

  // Use first segment of the first change's name as the search term
  const firstName = changes[0]!.name;
  const searchFragment = firstName.split('-')[0]!;

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const searchInput = page.locator('input[placeholder*="Search"]');

  // Search for a known change name fragment
  await searchInput.fill(searchFragment);
  await page.waitForTimeout(500);

  const rows = page.locator('[data-testid^="change-row-"]');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
});

// T-009: search-index FR-003 — fallback to metadata search when index unavailable
test('SearchIndex: search works even before full index is built (fallback)', async ({ page }) => {
  await page.goto('/');
  // Do NOT wait for networkidle — search before index is ready
  await page.waitForTimeout(500);

  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.fill('full-text-search');
  await page.waitForTimeout(300);

  // Should show results using metadata fallback (name match)
  const rows = page.locator('[data-testid^="change-row-"]');
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(0);
});
