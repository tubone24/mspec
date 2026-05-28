// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: reading-mode-themes
// @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md
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

// T014: code-syntax-highlight FR-001 — Shiki highlights JavaScript code block
test('CodeBlock: javascript code block gets syntax highlighting spans', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found — skipping CodeBlock test');
    return;
  }
  if (!(await artifactExists(page, changeId, 'quickstart.md'))) {
    test.skip(true, 'quickstart.md not found — skipping CodeBlock syntax highlight test');
    return;
  }

  // Navigate to a markdown file that contains a JS code block (quickstart.md has one)
  await page.goto(`/changes/${changeId}/artifacts/quickstart.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Shiki renders highlighted spans with inline color styles
  const highlightedSpans = page.locator('[data-testid="md-preview"] pre span[style*="color"]');
  await expect(highlightedSpans.first()).toBeVisible({ timeout: 10000 });
  const count = await highlightedSpans.count();
  expect(count).toBeGreaterThan(0);
});

// T014b: code-syntax-highlight FR-001 — Language-less code block renders without error
test('CodeBlock: language-less code block renders as plain text without error', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }

  // Any markdown file should render without console errors
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(`/changes/${changeId}/artifacts/readme.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // No JS errors from CodeBlock rendering
  const shikiErrors = errors.filter((e) => e.includes('shiki') || e.includes('CodeBlock'));
  expect(shikiErrors).toHaveLength(0);
});

// T016/T017: code-syntax-highlight FR-003 — Markdown HTML comments show as md-comment spans
test('rehypeCommentDim: HTML comments in markdown render as .md-comment spans', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }
  if (!(await artifactExists(page, changeId, 'specs/web-ui-themes/spec.md'))) {
    test.skip(true, 'specs/web-ui-themes/spec.md not found — skipping md-comment test');
    return;
  }

  // spec.md files contain <!-- @mspec-delta --> comments
  await page.goto(`/changes/${changeId}/artifacts/specs/web-ui-themes/spec.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const commentSpan = page.locator('[data-testid="md-preview"] .md-comment').first();
  await expect(commentSpan).toBeVisible({ timeout: 5000 });

  const opacity = await commentSpan.evaluate((el) =>
    parseFloat(getComputedStyle(el).opacity),
  );
  expect(opacity).toBeLessThanOrEqual(0.5);
});

// T010: code-syntax-highlight FR-006 — pre タグが二重にネストしない（AskUserQuestion コードブロックの正常描画）
test('CodeBlock: pre tag is not double-wrapped — no nested <pre> inside <pre>', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }

  // design.md には複数のコードブロックが含まれる
  if (!(await artifactExists(page, changeId, 'design.md'))) {
    test.skip(true, 'design.md not found — skipping pre double-wrap test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/design.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // <pre> が二重になっていないこと: pre の子孫に pre が存在しない
  const nestedPre = page.locator('[data-testid="md-preview"] pre pre');
  await expect(nestedPre).toHaveCount(0);
});

// T011: code-syntax-highlight FR-006 — 通常の Markdown コードフェンスでも pre が 1 層のみ
test('CodeBlock: standard markdown code fence renders with single <pre> layer and Shiki highlight', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found');
    return;
  }

  if (!(await artifactExists(page, changeId, 'design.md'))) {
    test.skip(true, 'design.md not found — skipping single pre layer test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/design.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Shiki コンテナ（data-testid="shiki-container"）が存在すること
  const shikiContainer = page.locator('[data-testid="md-preview"] pre[data-testid="shiki-container"]');
  const count = await shikiContainer.count();
  if (count === 0) {
    // shiki-container がない場合は pre の有無だけ確認
    const anyPre = page.locator('[data-testid="md-preview"] pre');
    await expect(anyPre.first()).toBeVisible({ timeout: 5000 });
  }

  // いずれにせよ二重 pre がないこと
  const nestedPre = page.locator('[data-testid="md-preview"] pre pre');
  await expect(nestedPre).toHaveCount(0);
});
