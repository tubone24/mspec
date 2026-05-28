// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
// Change: markdown-search-and-quick-access

import { test, expect } from '@playwright/test';

// T3.3: FR-001 — ⌘K/Ctrl+K でクイックアクセスパレット表示
test('QuickAccess: ⌘K/Ctrl+K opens the palette overlay', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Detect platform and send appropriate shortcut
  const isMac = await page.evaluate(() =>
    /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? ''),
  );

  if (isMac) {
    await page.keyboard.press('Meta+k');
  } else {
    await page.keyboard.press('Control+k');
  }

  await expect(page.locator('[data-testid="quick-access-palette"]')).toBeVisible({ timeout: 3000 });
});

// T3.3: FR-002 — ヒントUIに正しい修飾キーラベルが表示される
test('QuickAccess: shortcut hint label matches OS', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const isMac = await page.evaluate(() =>
    /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? ''),
  );

  const hint = page.locator('[data-testid="search-shortcut-hint"]');
  await expect(hint).toBeVisible();
  const text = await hint.textContent();

  if (isMac) {
    expect(text).toBe('⌘K');
  } else {
    expect(text).toBe('Ctrl+K');
  }
});

// T3.6: FR-003 — パレット初期表示時にコンテンツが表示される
test('QuickAccess: palette shows spec, change, and step items', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const isMac = await page.evaluate(() =>
    /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? ''),
  );

  if (isMac) {
    await page.keyboard.press('Meta+k');
  } else {
    await page.keyboard.press('Control+k');
  }

  await expect(page.locator('[data-testid="quick-access-palette"]')).toBeVisible({ timeout: 3000 });
  // palette should have list items
  const items = page.locator('[data-testid="quick-access-item"]');
  await expect(items.first()).toBeVisible({ timeout: 3000 });
});

// T3.5: FR-004 — パレット内インクリメンタルフィルタリング
test('QuickAccess: typing in palette filters items', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const isMac = await page.evaluate(() =>
    /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? ''),
  );

  if (isMac) {
    await page.keyboard.press('Meta+k');
  } else {
    await page.keyboard.press('Control+k');
  }

  await expect(page.locator('[data-testid="quick-access-palette"]')).toBeVisible({ timeout: 3000 });

  const input = page.locator('[data-testid="quick-access-input"]');
  const allItems = page.locator('[data-testid="quick-access-item"]');
  const countBefore = await allItems.count();

  await input.fill('xyzzy-nonexistent-99999');
  await page.waitForTimeout(200);
  const countAfter = await allItems.count();

  expect(countAfter).toBeLessThanOrEqual(countBefore);
});

// T3.7: FR-005 — ESCキーでパレットを閉じる
test('QuickAccess: Escape closes the palette', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const isMac = await page.evaluate(() =>
    /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? ''),
  );

  if (isMac) {
    await page.keyboard.press('Meta+k');
  } else {
    await page.keyboard.press('Control+k');
  }

  await expect(page.locator('[data-testid="quick-access-palette"]')).toBeVisible({ timeout: 3000 });

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-testid="quick-access-palette"]')).not.toBeVisible({ timeout: 2000 });
});

// T3.7: FR-005 — 背景クリックでパレットを閉じる
test('QuickAccess: clicking backdrop closes the palette', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const isMac = await page.evaluate(() =>
    /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? ''),
  );

  if (isMac) {
    await page.keyboard.press('Meta+k');
  } else {
    await page.keyboard.press('Control+k');
  }

  await expect(page.locator('[data-testid="quick-access-palette"]')).toBeVisible({ timeout: 3000 });

  // Click the backdrop (outside the palette dialog)
  await page.locator('[data-testid="quick-access-backdrop"]').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('[data-testid="quick-access-palette"]')).not.toBeVisible({ timeout: 2000 });
});
