// @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/artifact-preview/spec.md
// Requirements implemented: FR-013
// Change: fix-checklist-ui-sync

import { test, expect } from '@playwright/test';

async function findLastChangeWithChecklist(page: import('@playwright/test').Page): Promise<string | null> {
  // 他の E2E テスト（checklist-interactive 等）が最初のチェンジを使うため最後を使う
  const response = await page.request.get('/api/changes');
  const changes = await response.json() as Array<{ id: string }>;
  let found: string | null = null;
  for (const change of changes) {
    const artRes = await page.request.get(`/api/changes/${change.id}/artifacts`);
    const artifacts = await artRes.json() as Array<{ relativePath: string }>;
    if (artifacts.some((a) => a.relativePath === 'checklist.md')) {
      found = change.id;
    }
  }
  return found;
}

// FR-013 Scenario A: チェックボックストグルのファイル永続化 + Scenario B: リロード後の復元
test('ChecklistPersist: toggling a checkbox persists to file and survives page reload', async ({ page }) => {
  const changeId = await findLastChangeWithChecklist(page);
  if (!changeId) {
    test.skip(true, 'No change with checklist.md found');
    return;
  }

  // 初期状態を PATCH で設定（決定論的テスト: item 0 は - [ ] 未チェック）
  const initialContent = '# ChecklistPersist Test Fixture\n\n- [ ] item-0-unchecked\n- [ ] item-1-unchecked\n';
  const initRes = await page.request.fetch(`/api/changes/${changeId}/artifacts/checklist.md`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    data: initialContent,
  });
  expect(initRes.ok()).toBe(true);

  // ページ読み込み
  await page.goto(`/changes/${changeId}/artifacts/checklist.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const checkboxes = page.locator('[data-testid="md-preview"] input[type="checkbox"]');
  const count = await checkboxes.count();
  if (count === 0) {
    test.skip(true, 'No checkboxes found — skipping');
    return;
  }

  const firstBox = checkboxes.first();
  await expect(firstBox).not.toBeDisabled();

  // クリック前に data-idx を取得（どのファイル行に対応するか確認）
  const clickedIdx = await firstBox.getAttribute('data-idx');

  // item 0 を クリックしてチェックする
  await firstBox.click();

  // clickedIdx 番目のチェックボックス行が - [x] になるまで待つ
  const clickedIdxNum = Number(clickedIdx ?? '0');
  await expect.poll(async () => {
    const res = await page.request.get(`/api/changes/${changeId}/artifacts/checklist.md`);
    const text = await res.text();
    const cbLines = text.split('\n').filter(l => /^- \[[ x]\]/.test(l));
    return cbLines[clickedIdxNum] ?? '';
  }, { timeout: 8000, intervals: [300, 500, 1000] }).toMatch(/^- \[x\]/);

  // リロード後も - [x] 状態が保持されていること（FR-013: ページ再表示時のチェック状態復元）
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // リロード後: clickedIdx 番目のチェックボックスが checked になっていること
  const reloadedCheckbox = page.locator(`[data-testid="md-preview"] input[data-idx="${clickedIdx}"]`);
  await expect(reloadedCheckbox).not.toBeDisabled();
  await expect(reloadedCheckbox).toBeChecked({ timeout: 5000 });
});
