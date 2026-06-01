// @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md
// Requirements implemented: FR-001
// Change: fix-e2e-flakiness-verify-cmd-auto-execute
import { test } from '@playwright/test';
test('debug pre pre', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  
  const r = await page.request.get('/api/changes');
  const changes = await r.json();
  const id = changes[0]?.id;
  console.log('changeId:', id);
  
  await page.goto(`/changes/${id}/artifacts/design.md`);
  await page.waitForLoadState('networkidle');

  const nested = page.locator('[data-testid="md-preview"] pre pre').first();
  const count = await page.locator('[data-testid="md-preview"] pre pre').count();
  console.log('pre pre count:', count);
  
  if (count > 0) {
    console.log('--- NESTED PRE outerHTML ---');
    console.log(await nested.evaluate(el => el.outerHTML.slice(0, 800)));
    console.log('--- PARENT outerHTML ---');
    console.log(await nested.evaluate(el => el.parentElement?.outerHTML?.slice(0, 300) ?? 'N/A'));
  }
  
  console.log('--- ERRORS ---');
  console.log(errors.join('\n'));
});
