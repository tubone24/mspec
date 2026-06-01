// @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md
// Requirements implemented: FR-001
// Change: fix-e2e-flakiness-verify-cmd-auto-execute

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
  // capabilities が読み込まれるまで待機してから件数を記録
  await expect(allItems.first()).toBeVisible();
  const totalCount = await allItems.count();
  await page.locator('[data-testid="spec-search-input"]').fill('search');
  // highlight が現れたら debounce 完了とみなす
  await expect(page.locator('[data-testid="capability-item"] mark').first()).toBeVisible();
  const filteredCount = await allItems.count();
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(totalCount);
});

// T406: spec-viewer-search FR-007 — × ボタンでリセット
test('Spec Viewer: clear button resets search', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  const allItems = page.locator('[data-testid="capability-item"]');
  // capabilities が読み込まれるまで待機してから件数を記録
  await expect(allItems.first()).toBeVisible();
  const totalCount = await allItems.count();
  await page.locator('[data-testid="spec-search-input"]').fill('search');
  await expect(page.locator('[data-testid="capability-item"] mark').first()).toBeVisible();
  await page.locator('[data-testid="spec-search-clear"]').click();
  // debounce リセット後に全件が戻ることを条件ベースで待機
  await expect(allItems).toHaveCount(totalCount);
});

// T407: spec-viewer-search FR-006 — 結果なし時のメッセージ
test('Spec Viewer: shows no-results message', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="spec-search-input"]').fill('xyzzy-nonexistent-9999');
  await expect(page.locator('[data-testid="spec-no-results"]')).toBeVisible();
});

// T408: spec-viewer-search FR-004 — サイドバーにハイライト表示
test('Spec Viewer: capability name highlight shown in sidebar', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="spec-search-input"]').fill('search');
  const mark = page.locator('[data-testid="capability-item"] mark').first();
  await expect(mark).toBeVisible();
});

// T409: spec-viewer-search FR-005 — 大文字クエリでもヒット
test('Spec Viewer: search is case-insensitive', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="spec-search-input"]').fill('FR-001');
  const items = page.locator('[data-testid="capability-item"]');
  await expect(items.first()).toBeVisible();
  expect(await items.count()).toBeGreaterThan(0);
});

// T2.1: spec-viewer-search FR-008 — Markdown本文ヒット行スニペット表示
test('Spec Viewer: snippet shown for body-only keyword match', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="spec-search-input"]').fill('SHALL');
  // インデックスビルド完了後にスニペットが表示されるまで条件ベースで待機
  const snippet = page.locator('[data-testid="spec-snippet"]').first();
  await expect(snippet).toBeVisible({ timeout: 10000 });
});

// T2.3: spec-viewer-search FR-009 — AND条件で複数キーワードを絞り込む
test('Spec Viewer: AND condition narrows results with space-separated keywords', async ({ page }) => {
  await page.goto('/spec-viewer');
  await page.waitForLoadState('networkidle');
  const singleKeyword = page.locator('[data-testid="capability-item"]');
  await page.locator('[data-testid="spec-search-input"]').fill('SHALL');
  // インデックスビルド完了後、スニペット表示を条件として待機
  await expect(page.locator('[data-testid="spec-snippet"]').first()).toBeVisible({ timeout: 10000 });
  const singleCount = await singleKeyword.count();

  await page.locator('[data-testid="spec-search-input"]').fill('SHALL nonexistent-xyz-9999');
  // AND 絞り込み後は no-results または件数ゼロになるまで待機
  await expect(page.locator('[data-testid="spec-no-results"]')).toBeVisible();
  const andCount = await singleKeyword.count();

  // AND condition: must be subset of single-keyword results
  expect(andCount).toBeLessThan(singleCount);
});
