// @mspec-delta 2026-05-26-113511-webui-keyword-badge-style/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-004, FR-005
// Change: webui-keyword-badge-style

import { test, expect } from '@playwright/test';

async function getFirstChangeId(page: import('@playwright/test').Page): Promise<string | null> {
  const response = await page.request.get('/api/changes');
  const changes = await response.json() as Array<{ id: string }>;
  return changes.length > 0 ? changes[0]!.id : null;
}

// T101: code-syntax-highlight FR-004 — GIVEN keyword renders as badge (blue-100 background)
test('KeywordBadge: GIVEN keyword has badge background-color and border-radius', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found — skipping keyword badge test');
    return;
  }

  // Navigate to a spec file with Gherkin keywords (delta spec for this change)
  await page.goto(`/changes/${changeId}/artifacts/specs/code-syntax-highlight/spec.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const givenSpan = page.locator('[data-testid="md-preview"] span.k-given').first();
  await expect(givenSpan).toBeVisible({ timeout: 5000 });

  const styles = await givenSpan.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      backgroundColor: cs.backgroundColor,
      borderRadius: cs.borderRadius,
      paddingLeft: cs.paddingLeft,
      paddingRight: cs.paddingRight,
    };
  });

  // Background should be blue-100 (#dbeafe = rgb(219, 234, 254)), not transparent
  expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(styles.backgroundColor).not.toBe('transparent');
  // Border radius should be set (3px)
  expect(parseFloat(styles.borderRadius)).toBeGreaterThan(0);
  // Padding should be set
  expect(parseFloat(styles.paddingLeft)).toBeGreaterThan(0);
  expect(parseFloat(styles.paddingRight)).toBeGreaterThan(0);
});

// T102: code-syntax-highlight FR-004 — SHALL keyword renders as badge (red-100 background)
test('KeywordBadge: SHALL keyword has badge background-color', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found — skipping keyword badge test');
    return;
  }

  await page.goto(`/changes/${changeId}/artifacts/specs/code-syntax-highlight/spec.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const shallSpan = page.locator('[data-testid="md-preview"] span.k-shall').first();
  await expect(shallSpan).toBeVisible({ timeout: 5000 });

  const styles = await shallSpan.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      backgroundColor: cs.backgroundColor,
      borderRadius: cs.borderRadius,
      paddingLeft: cs.paddingLeft,
    };
  });

  // Background should have a reddish tint (not transparent)
  expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(styles.backgroundColor).not.toBe('transparent');
  expect(parseFloat(styles.borderRadius)).toBeGreaterThan(0);
  expect(parseFloat(styles.paddingLeft)).toBeGreaterThan(0);
});

// T103: code-syntax-highlight FR-005 — code block has 1px outline
test('CodeBlock: prose pre has 1px outline border', async ({ page }) => {
  const changeId = await getFirstChangeId(page);
  if (!changeId) {
    test.skip(true, 'No active changes found — skipping code block border test');
    return;
  }

  // Navigate to a file that contains a code block (design.md has CSS code blocks)
  await page.goto(`/changes/${changeId}/artifacts/design.md`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const pre = page.locator('[data-testid="md-preview"] pre').first();
  await expect(pre).toBeVisible({ timeout: 5000 });

  const borderWidth = await pre.evaluate((el) =>
    getComputedStyle(el).borderTopWidth,
  );

  expect(borderWidth).toBe('1px');
});
