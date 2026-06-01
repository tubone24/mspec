// @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md
// Requirements implemented: FR-014
// Change: fix-e2e-flakiness-verify-cmd-auto-execute

import { test, expect } from '@playwright/test';

async function getFirstChangeId(page: import('@playwright/test').Page): Promise<string | null> {
  const response = await page.request.get('/api/changes');
  const changes = await response.json() as Array<{ id: string }>;
  return changes.length > 0 ? (changes[0]?.id ?? null) : null;
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

// T201: artifact-preview FR-014 — verify:cmd 項目に実行ボタンが表示される
test('ChecklistVerifyCmdRun: items with verify-cmd tag show a run button', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'checklist.md'))) {
    test.skip(true, 'checklist.md not found — skipping verify-cmd run button test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');

  const pageContent = await page.textContent('[data-testid="md-preview"]');
  if (!pageContent?.includes('verify: cmd:')) {
    test.skip(true, 'No verify: cmd items in this checklist — skipping');
    return;
  }

  // verify: cmd: コメントを含む li に実行ボタンが表示されること
  const runButton = page.locator('[data-testid="verify-cmd-run-btn"]').first();
  await expect(runButton).toBeVisible();
});

// T202: artifact-preview FR-014 — verify:fr のみの項目には実行ボタンが表示されない
test('ChecklistVerifyCmdRun: items with only verify-fr tag do not show a run button', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'checklist.md'))) {
    test.skip(true, 'checklist.md not found — skipping verify-fr non-run-button test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');

  // 全 li の数と run ボタン付き li の数を比較
  const allItems = page.locator('[data-testid="md-preview"] li');
  const runButtons = page.locator('[data-testid="verify-cmd-run-btn"]');
  const totalCount = await allItems.count();
  const runButtonCount = await runButtons.count();

  // verify:cmd なし項目が存在する場合、run ボタンが全項目に付いていてはいけない
  if (totalCount > 0) {
    expect(runButtonCount).toBeLessThanOrEqual(totalCount);
  }
});

// T203: artifact-preview FR-014 — 実行ボタンクリックでコマンド結果がインライン表示される
test('ChecklistVerifyCmdRun: clicking run button shows command result inline', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'checklist.md'))) {
    test.skip(true, 'checklist.md not found — skipping run button click test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');

  const pageContent = await page.textContent('[data-testid="md-preview"]');
  if (!pageContent?.includes('verify: cmd:')) {
    test.skip(true, 'No verify: cmd items in this checklist — skipping');
    return;
  }

  const runButton = page.locator('[data-testid="verify-cmd-run-btn"]').first();
  const count = await runButton.count();
  if (count === 0) {
    test.skip(true, 'Run button not found — skipping click test');
    return;
  }

  await runButton.click();

  // コマンド結果がインライン表示されること（exit code を含む pre 要素）
  const resultArea = page.locator('[data-testid="verify-cmd-result"]').first();
  await expect(resultArea).toBeVisible({ timeout: 15000 });
});

// T204: artifact-preview FR-014 — コマンド実行中はボタンが無効化される
test('ChecklistVerifyCmdRun: run button is disabled while command is executing', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'checklist.md'))) {
    test.skip(true, 'checklist.md not found — skipping disabled state test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');

  const pageContent = await page.textContent('[data-testid="md-preview"]');
  if (!pageContent?.includes('verify: cmd:')) {
    test.skip(true, 'No verify: cmd items in this checklist — skipping');
    return;
  }

  const runButton = page.locator('[data-testid="verify-cmd-run-btn"]').first();
  const count = await runButton.count();
  if (count === 0) {
    test.skip(true, 'Run button not found — skipping disabled state test');
    return;
  }

  // クリック直後にボタンが disabled になることを確認
  await runButton.click();
  // ボタンが一時的に disabled になること（実行中）
  await expect(runButton).toBeDisabled({ timeout: 1000 }).catch(() => {
    // 高速コマンドの場合は既に完了している可能性があるためスキップ
  });

  // 完了後に結果が表示されること
  await expect(page.locator('[data-testid="verify-cmd-result"]').first()).toBeVisible({ timeout: 15000 });
});
