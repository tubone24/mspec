// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: reading-mode-themes

import { test, expect } from '@playwright/test';

// T009: web-ui-themes FR-001 — ThemePicker shows 4 theme buttons
test('ThemePicker: renders 4 theme pill buttons', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const picker = page.locator('[data-testid="theme-picker"]');
  await expect(picker).toBeVisible();

  const buttons = picker.locator('button');
  await expect(buttons).toHaveCount(4);

  const labels = await buttons.allTextContents();
  expect(labels.join(' ')).toContain('Light');
  expect(labels.join(' ')).toContain('Sepia');
  expect(labels.join(' ')).toContain('Green');
  expect(labels.join(' ')).toContain('Dark');
});

// T011: web-ui-themes FR-002 — Sepia theme applies correct CSS variable
test('ThemePicker: sepia theme sets data-theme and CSS variable', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const sepiaBtn = page.locator('[data-testid="theme-picker"] button[aria-label="sepia"]');
  await sepiaBtn.click();
  await page.waitForTimeout(100);

  const dataTheme = await page.locator('html').getAttribute('data-theme');
  expect(dataTheme).toBe('sepia');

  const bg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
  );
  expect(bg.toLowerCase()).toBe('#f4ead5');
});

// T011b: web-ui-themes FR-002 — Green theme applies data-theme
test('ThemePicker: green theme sets data-theme attribute', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.locator('[data-testid="theme-picker"] button[aria-label="green"]').click();
  await page.waitForTimeout(100);

  const dataTheme = await page.locator('html').getAttribute('data-theme');
  expect(dataTheme).toBe('green');
});

// T011c: web-ui-themes FR-002 — Dark theme adds .dark class
test('ThemePicker: dark theme sets data-theme="dark" and adds html.dark class', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.locator('[data-testid="theme-picker"] button[aria-label="dark"]').click();
  await page.waitForTimeout(100);

  const dataTheme = await page.locator('html').getAttribute('data-theme');
  expect(dataTheme).toBe('dark');

  const hasDark = await page.locator('html').evaluate((el) => el.classList.contains('dark'));
  expect(hasDark).toBe(true);
});

// T013: web-ui-themes FR-003 — Theme persists after page reload
test('ThemePicker: selected theme persists across page reload', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => localStorage.removeItem('mspec-ui-store'));
  await page.reload();
  await page.waitForLoadState('networkidle');

  await page.locator('[data-testid="theme-picker"] button[aria-label="dark"]').click();
  await page.waitForTimeout(300);

  await page.reload();
  await page.waitForLoadState('networkidle');

  const dataTheme = await page.locator('html').getAttribute('data-theme');
  expect(dataTheme).toBe('dark');

  const stored = await page.evaluate(() => localStorage.getItem('mspec-ui-store'));
  expect(stored).toBeTruthy();
  const parsed = JSON.parse(stored!) as { state: { theme: string } };
  expect(parsed.state.theme).toBe('dark');
});
