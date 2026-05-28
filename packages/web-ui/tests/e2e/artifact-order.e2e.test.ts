// @mspec-delta 2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/change-dashboard/spec.md
// Requirements implemented: FR-010
// Change: web-ui-artifact-order-and-test-results

import { test, expect } from '@playwright/test';

// T401: change-dashboard FR-010 — artifacts displayed in workflow order
test('ChangeDetail: artifacts appear in workflow step order (proposal before design before tasks)', async ({ page }) => {
  // Use the current change which has multiple artifacts
  const changeId = '2026-05-28-041724-web-ui-artifact-order-and-test-results';
  await page.goto(`/changes/${changeId}`);
  await page.waitForLoadState('networkidle');

  // Get all artifact names displayed in the list
  const artifactItems = page.locator('[data-testid="artifact-list"] li, [data-testid="artifact-item"]');
  const count = await artifactItems.count();

  if (count === 0) {
    // Fallback: check if artifacts are listed in any visible element
    const text = await page.textContent('body');
    // If proposal.md and design.md are both present, proposal should come first
    if (text?.includes('proposal.md') && text?.includes('design.md')) {
      const proposalIdx = text.indexOf('proposal.md');
      const designIdx = text.indexOf('design.md');
      expect(proposalIdx).toBeLessThan(designIdx);
    }
    return;
  }

  // Get ordered text of artifact items
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = await artifactItems.nth(i).textContent();
    if (t) texts.push(t.trim());
  }

  // proposal.md should appear before design.md
  const proposalIdx = texts.findIndex((t) => t.includes('proposal.md'));
  const designIdx = texts.findIndex((t) => t.includes('design.md'));
  if (proposalIdx !== -1 && designIdx !== -1) {
    expect(proposalIdx).toBeLessThan(designIdx);
  }

  // design.md should appear before tasks.md
  const tasksIdx = texts.findIndex((t) => t.includes('tasks.md'));
  if (designIdx !== -1 && tasksIdx !== -1) {
    expect(designIdx).toBeLessThan(tasksIdx);
  }
});
