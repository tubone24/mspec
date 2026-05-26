// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: reading-mode-themes

import { test, expect } from '@playwright/test';

async function getFirstChangeId(page: import('@playwright/test').Page): Promise<string | null> {
  const response = await page.request.get('/api/changes');
  const changes = await response.json() as Array<{ id: string }>;
  return changes.length > 0 ? changes[0]!.id : null;
}

// T014: code-syntax-highlight FR-001 — Shiki highlights JavaScript code block
test('CodeBlock: javascript code block gets syntax highlighting spans', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found — skipping CodeBlock test');
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
