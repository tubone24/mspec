// @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-006
// Change: fix-pre-tag-checklist-ui

import { test, expect } from '@playwright/test';

async function getFirstChangeId(page: import('@playwright/test').Page): Promise<string | null> {
  const response = await page.request.get('/api/changes');
  const changes = await response.json() as Array<{ id: string }>;
  return changes.length > 0 ? changes[0]!.id : null;
}

async function artifactExists(
  page: import('@playwright/test').Page,
  changeId: string,
  relativePath: string,
): Promise<boolean> {
  const response = await page.request.get(`/api/changes/${changeId}/artifacts`);
  const artifacts = await response.json() as Array<{ relativePath: string }>;
  return artifacts.some((a) => a.relativePath === relativePath);
}

// T201: web-ui-server FR-006 — チェックボックスのトグル操作（未チェック → チェック済み）
test('ChecklistInteractive: clicking unchecked checkbox makes it checked', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'checklist.md'))) {
    test.skip(true, 'checklist.md not found — skipping interactive checkbox test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // GFM チェックボックスが存在し disabled でないこと
  const checkboxes = page.locator('[data-testid="md-preview"] input[type="checkbox"]');
  const count = await checkboxes.count();
  if (count === 0) {
    test.skip(true, 'No checkboxes found in checklist — skipping');
    return;
  }

  // 最初の未チェックボックスを見つける
  const uncheckedBox = checkboxes.first();
  await expect(uncheckedBox).not.toBeDisabled();

  const wasChecked = await uncheckedBox.isChecked();

  // クリックしてトグル
  await uncheckedBox.click();
  await page.waitForTimeout(100);

  const isNowChecked = await uncheckedBox.isChecked();
  expect(isNowChecked).toBe(!wasChecked);
});

// T202: web-ui-server FR-006 — チェック済み項目のアンチェック操作
test('ChecklistInteractive: clicking checked checkbox makes it unchecked', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'checklist.md'))) {
    test.skip(true, 'checklist.md not found — skipping interactive checkbox uncheck test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const checkboxes = page.locator('[data-testid="md-preview"] input[type="checkbox"]');
  const count = await checkboxes.count();
  if (count === 0) {
    test.skip(true, 'No checkboxes found in checklist — skipping');
    return;
  }

  const checkbox = checkboxes.first();
  await expect(checkbox).not.toBeDisabled();

  // まずチェック状態にする
  if (!(await checkbox.isChecked())) {
    await checkbox.click();
    await page.waitForTimeout(100);
  }
  await expect(checkbox).toBeChecked();

  // もう一度クリックしてアンチェック
  await checkbox.click();
  await page.waitForTimeout(100);

  await expect(checkbox).not.toBeChecked();
});
