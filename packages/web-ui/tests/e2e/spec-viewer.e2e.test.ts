// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
// Requirements implemented: FR-009
// Change: web-ui-enhancements

// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/spec-viewer-search/spec.md
// Requirements implemented: FR-008, FR-009
// Change: markdown-search-and-quick-access

import { test, expect } from '@playwright/test';

// @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007
// Change: spec-viewer-fulltext-search

// T401: change-dashboard FR-009 — Spec Viewer link is present on dashboard
test('Dashboard: Spec Viewer navigation link is present', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('link', { name: 'Spec Viewer' })).toBeVisible();
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

// T404: spec-viewer-search FR-001 — 検索ボックスが表示される
test('Spec Viewer: search box is visible', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-testid="spec-search-input"]')).toBeVisible();
});

// T405: spec-viewer-search FR-002/FR-003 — 検索でフィルタリングされる
test('Spec Viewer: search filters capability list', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  const allItems = page.locator('[data-testid="capability-item"]');
  const totalCount = await allItems.count();
  await page.locator('[data-testid="spec-search-input"]').fill('search');
  await page.waitForTimeout(400);
  const filteredCount = await allItems.count();
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(totalCount);
});

// T406: spec-viewer-search FR-007 — × ボタンでリセット
test('Spec Viewer: clear button resets search', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  const allItems = page.locator('[data-testid="capability-item"]');
  const totalCount = await allItems.count();
  await page.locator('[data-testid="spec-search-input"]').fill('search');
  await page.waitForTimeout(400);
  await page.locator('[data-testid="spec-search-clear"]').click();
  await page.waitForTimeout(300); // debounce is 200ms; wait longer to ensure filter resets
  expect(await allItems.count()).toBe(totalCount);
});

// T407: spec-viewer-search FR-006 — 結果なし時のメッセージ
test('Spec Viewer: shows no-results message', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="spec-search-input"]').fill('xyzzy-nonexistent-9999');
  await page.waitForTimeout(400);
  await expect(page.locator('[data-testid="spec-no-results"]')).toBeVisible();
});

// T408: spec-viewer-search FR-004 — サイドバーにハイライト表示
test('Spec Viewer: capability name highlight shown in sidebar', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="spec-search-input"]').fill('search');
  await page.waitForTimeout(400);
  const mark = page.locator('[data-testid="capability-item"] mark').first();
  await expect(mark).toBeVisible();
});

// T409: spec-viewer-search FR-005 — 大文字クエリでもヒット
test('Spec Viewer: search is case-insensitive', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="spec-search-input"]').fill('FR-001');
  await page.waitForTimeout(400);
  const items = page.locator('[data-testid="capability-item"]');
  expect(await items.count()).toBeGreaterThan(0);
});

// T2.1: spec-viewer-search FR-008 — Markdown本文ヒット行スニペット表示
test('Spec Viewer: snippet shown for body-only keyword match', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  // Wait for index to build
  await page.waitForTimeout(3000);
  await page.locator('[data-testid="spec-search-input"]').fill('SHALL');
  await page.waitForTimeout(600);
  const items = page.locator('[data-testid="capability-item"]');
  expect(await items.count()).toBeGreaterThan(0);
  // snippet should appear under at least one capability item
  const snippet = page.locator('[data-testid="spec-snippet"]').first();
  await expect(snippet).toBeVisible({ timeout: 5000 });
});

// T2.3: spec-viewer-search FR-009 — AND条件で複数キーワードを絞り込む
test('Spec Viewer: AND condition narrows results with space-separated keywords', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const singleKeyword = page.locator('[data-testid="capability-item"]');
  await page.locator('[data-testid="spec-search-input"]').fill('SHALL');
  await page.waitForTimeout(600);
  const singleCount = await singleKeyword.count();

  await page.locator('[data-testid="spec-search-input"]').fill('SHALL nonexistent-xyz-9999');
  await page.waitForTimeout(600);
  const andCount = await singleKeyword.count();

  // AND condition: must be subset of single-keyword results
  expect(andCount).toBeLessThan(singleCount);
});
