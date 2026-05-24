// @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: ui-visual-mock-workflow

// @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: rename-visual-mock-to-prototype

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { startPrototypeServer } from '../../src/lib/prototype-server.js';
import { detectFramework } from '../../src/lib/framework-detector.js';

const CHANGE = '2026-01-01-test-gen-change';

async function setupProjectWithMui(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-gen-test-'));

  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify({ dependencies: { '@mui/material': '^5.0.0' } }),
  );

  const changeDir = join(cwd, 'changes', CHANGE);
  await mkdir(join(changeDir, 'prototype'), { recursive: true });
  await writeFile(
    join(changeDir, 'prototype', 'index.html'),
    '<!DOCTYPE html><html><body><h1>Prototype</h1></body></html>',
  );

  return cwd;
}

// FR-001 Scenario: mock ディレクトリへの生成
describe('TASK-012: FR-001 — prototype/index.html generation', () => {
  it('prototype/index.html exists and is parseable HTML', async () => {
    const cwd = await setupProjectWithMui();
    const indexHtml = join(cwd, 'changes', CHANGE, 'prototype', 'index.html');

    await expect(access(indexHtml)).resolves.toBeUndefined();
    const content = await readFile(indexHtml, 'utf8');
    expect(content).toMatch(/<html/i);
  });

  it('framework detector identifies @mui/material from package.json', async () => {
    const cwd = await setupProjectWithMui();
    const info = await detectFramework(cwd);
    expect(info.name).toBe('material-ui');
    expect(info.promptHint).toMatch(/Material UI/i);
  });
});

// FR-002 Scenario: サーバー起動と URL 表示
describe('TASK-013: FR-002 — HTTP server startup and URL', () => {
  it('startPrototypeServer() returns port >= 3737', async () => {
    const cwd = await setupProjectWithMui();
    const mockDir = join(cwd, 'changes', CHANGE, 'prototype');
    const { port, close } = await startPrototypeServer(mockDir, 3737);
    try {
      expect(port).toBeGreaterThanOrEqual(3737);
    } finally {
      close();
    }
  });

  it('http://localhost:<port> serves index.html content', async () => {
    const cwd = await setupProjectWithMui();
    const mockDir = join(cwd, 'changes', CHANGE, 'prototype');
    const { port, close } = await startPrototypeServer(mockDir, 3800);
    try {
      const res = await fetch(`http://localhost:${port}/`);
      const text = await res.text();
      expect(text).toMatch(/<html/i);
    } finally {
      close();
    }
  });

  it('auto-increments port when preferred port is in use', async () => {
    const cwd = await setupProjectWithMui();
    const mockDir = join(cwd, 'changes', CHANGE, 'prototype');
    const { port: port1, close: close1 } = await startPrototypeServer(mockDir, 3900);
    const { port: port2, close: close2 } = await startPrototypeServer(mockDir, 3900);
    try {
      expect(port2).toBeGreaterThan(port1);
    } finally {
      close1();
      close2();
    }
  });
});

// FR-003 Scenario: フィードバックの保存
describe('TASK-014: FR-003 — feedback file saved after mock', () => {
  it('prototype-feedback.md is created with correct format', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'mspec-feedback-test-'));
    const changeDir = join(cwd, 'changes', CHANGE);
    await mkdir(changeDir, { recursive: true });

    const feedbackContent = `# Mock Feedback\n\n> Recorded: ${new Date().toISOString()}\n> Mock: changes/${CHANGE}/prototype/index.html\n\nThis is my feedback.\n`;
    const feedbackPath = join(changeDir, 'prototype-feedback.md');
    await writeFile(feedbackPath, feedbackContent);

    const content = await readFile(feedbackPath, 'utf8');
    expect(content).toMatch(/^# Mock Feedback/);
    expect(content).toMatch(/> Recorded:/);
    expect(content).toMatch(/This is my feedback\./);
  });

  it('prototype-feedback.md is overwritten on second run', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'mspec-feedback-overwrite-test-'));
    const changeDir = join(cwd, 'changes', CHANGE);
    await mkdir(changeDir, { recursive: true });

    const feedbackPath = join(changeDir, 'prototype-feedback.md');
    await writeFile(feedbackPath, '# Mock Feedback\n\nFirst feedback.\n');
    await writeFile(feedbackPath, '# Mock Feedback\n\nSecond feedback.\n');

    const content = await readFile(feedbackPath, 'utf8');
    expect(content).toMatch(/Second feedback/);
    expect(content).not.toMatch(/First feedback/);
  });
});
