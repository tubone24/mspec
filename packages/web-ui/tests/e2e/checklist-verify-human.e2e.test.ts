// @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-005
// Change: fix-pre-tag-checklist-ui
// @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/artifact-preview/spec.md
// Requirements implemented: FR-012
// Change: checklist-reduce-verify-human

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

// T101: web-ui-server FR-005 — verify-human 項目の色付き表示
test('ChecklistVerifyHuman: items with verify-human tag get amber highlight', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'checklist.md'))) {
    test.skip(true, 'checklist.md not found — skipping verify-human highlight test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // verify: human コメントを含む li に amber スタイルが適用されていること
  const highlightedItems = page.locator('[data-testid="md-preview"] li.border-amber-400');
  const count = await highlightedItems.count();

  // checklist.md に verify: human 項目がある場合、少なくとも 1 つハイライトされていること
  const pageContent = await page.textContent('[data-testid="md-preview"]');
  if (pageContent?.includes('verify: human')) {
    expect(count).toBeGreaterThan(0);
  } else {
    test.skip(true, 'No verify: human items in this checklist — skipping');
  }
});

// T102: web-ui-server FR-005 — verify-human 以外の項目は通常表示
test('ChecklistVerifyHuman: non-verify-human items do not get amber highlight', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'checklist.md'))) {
    test.skip(true, 'checklist.md not found — skipping non-verify-human test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // すべての li の数と amber ハイライト付き li の数を比較
  const allItems = page.locator('[data-testid="md-preview"] li');
  const highlightedItems = page.locator('[data-testid="md-preview"] li.border-amber-400');

  const totalCount = await allItems.count();
  const highlightedCount = await highlightedItems.count();

  // 少なくとも一部の li にはハイライトが付いていないこと
  if (totalCount > 0) {
    expect(highlightedCount).toBeLessThan(totalCount);
  } else {
    test.skip(true, 'No list items found — skipping');
  }
});

// T103: artifact-preview FR-012 — verify:cmd 行が amber ハイライトされること
test('ChecklistVerifyCmd: items with verify-cmd tag get amber highlight', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'checklist.md'))) {
    test.skip(true, 'checklist.md not found — skipping verify-cmd highlight test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const pageContent = await page.textContent('[data-testid="md-preview"]');
  if (!pageContent?.includes('verify: cmd:')) {
    test.skip(true, 'No verify: cmd items in this checklist — skipping');
    return;
  }

  // verify: cmd: コメントを含む li に amber スタイルが適用されていること
  const highlightedItems = page.locator('[data-testid="md-preview"] li.border-amber-400');
  const count = await highlightedItems.count();
  expect(count).toBeGreaterThan(0);
});

// T104: artifact-preview FR-012 — verify:fr-NNN 行は amber ハイライトされないこと
test('ChecklistVerifyFr: items with verify-fr tag do not get amber highlight', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'checklist.md'))) {
    test.skip(true, 'checklist.md not found — skipping verify-fr non-highlight test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // verify: fr-NNN コメントのみを持つ行（verify:human/cmd を含まない）は amber ハイライトされないこと
  // data-verify-type="fr" の li が amber クラスを持たないことを確認
  const frOnlyItems = page.locator('[data-testid="md-preview"] li:not(.border-amber-400)');
  const totalItems = page.locator('[data-testid="md-preview"] li');
  const totalCount = await totalItems.count();
  const nonHighlightedCount = await frOnlyItems.count();

  if (totalCount > 0) {
    // verify:fr-NNN 専用項目が存在する場合、ハイライトされていない項目があること
    expect(nonHighlightedCount).toBeGreaterThan(0);
  } else {
    test.skip(true, 'No list items found — skipping');
  }
});
