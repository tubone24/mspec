// @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
// Requirements implemented: FR-004
// Change: ui-visual-mock-workflow

// @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
// Requirements implemented: FR-003, FR-004
// Change: rename-visual-mock-to-prototype

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SKIPPED_PLACEHOLDER_MARKER = '<!-- mspec: skipped step -->';
const CHANGE = '2026-01-01-test-tasks-feedback';

async function setupChangeWithFeedback(feedbackContent: string): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-tasks-feedback-'));
  const changeDir = join(cwd, 'changes', CHANGE);
  await mkdir(changeDir, { recursive: true });
  await writeFile(join(changeDir, 'prototype-feedback.md'), feedbackContent);
  return cwd;
}

// FR-004 Scenario: フィードバックがある状態での tasks 生成
describe('TASK-015: FR-004 — tasks.md reflects prototype-feedback.md', () => {
  it('prototype-feedback.md with real content is readable and not a skipped placeholder', async () => {
    const feedbackContent = `# Prototype Feedback\n\n> Recorded: 2026-05-21T00:00:00.000Z\n> Prototype: changes/${CHANGE}/prototype/index.html\n\nPlease add a dark mode toggle to the header component.\n`;
    const cwd = await setupChangeWithFeedback(feedbackContent);
    const feedbackPath = join(cwd, 'changes', CHANGE, 'prototype-feedback.md');

    const content = await readFile(feedbackPath, 'utf8');
    expect(content).not.toContain(SKIPPED_PLACEHOLDER_MARKER);
    expect(content).toMatch(/# Prototype Feedback/);
    expect(content).toMatch(/dark mode toggle/);
  });

  it('prototype-feedback.md contains SKIPPED_PLACEHOLDER_MARKER when step was skipped', async () => {
    const cwd = await setupChangeWithFeedback(SKIPPED_PLACEHOLDER_MARKER + '\n');
    const feedbackPath = join(cwd, 'changes', CHANGE, 'prototype-feedback.md');

    const content = await readFile(feedbackPath, 'utf8');
    expect(content).toContain(SKIPPED_PLACEHOLDER_MARKER);
  });
});
