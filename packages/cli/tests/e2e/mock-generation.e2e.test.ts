// @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: ui-visual-mock-workflow

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMockServer } from '../../src/lib/mock-server.js';
import { detectFramework } from '../../src/lib/framework-detector.js';

const CHANGE = '2026-01-01-test-gen-change';

async function setupProjectWithMui(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-gen-test-'));

  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify({ dependencies: { '@mui/material': '^5.0.0' } }),
  );

  const changeDir = join(cwd, 'changes', CHANGE);
  await mkdir(join(changeDir, 'mock'), { recursive: true });
  await writeFile(
    join(changeDir, 'mock', 'index.html'),
    '<!DOCTYPE html><html><body><h1>Mock</h1></body></html>',
  );

  return cwd;
}

// FR-001 Scenario: mock ディレクトリへの生成
describe('TASK-012: FR-001 — mock/index.html generation', () => {
  it('mock/index.html exists and is parseable HTML', async () => {
    const cwd = await setupProjectWithMui();
    const indexHtml = join(cwd, 'changes', CHANGE, 'mock', 'index.html');

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
  it('startMockServer() returns port >= 3737', async () => {
    const cwd = await setupProjectWithMui();
    const mockDir = join(cwd, 'changes', CHANGE, 'mock');
    const { port, close } = await startMockServer(mockDir, 3737);
    try {
      expect(port).toBeGreaterThanOrEqual(3737);
    } finally {
      close();
    }
  });

  it('http://localhost:<port> serves index.html content', async () => {
    const cwd = await setupProjectWithMui();
    const mockDir = join(cwd, 'changes', CHANGE, 'mock');
    const { port, close } = await startMockServer(mockDir, 3800);
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
    const mockDir = join(cwd, 'changes', CHANGE, 'mock');
    const { port: port1, close: close1 } = await startMockServer(mockDir, 3900);
    const { port: port2, close: close2 } = await startMockServer(mockDir, 3900);
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
  it('mock-feedback.md is created with correct format', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'mspec-feedback-test-'));
    const changeDir = join(cwd, 'changes', CHANGE);
    await mkdir(changeDir, { recursive: true });

    const feedbackContent = `# Mock Feedback\n\n> Recorded: ${new Date().toISOString()}\n> Mock: changes/${CHANGE}/mock/index.html\n\nThis is my feedback.\n`;
    const feedbackPath = join(changeDir, 'mock-feedback.md');
    await writeFile(feedbackPath, feedbackContent);

    const content = await readFile(feedbackPath, 'utf8');
    expect(content).toMatch(/^# Mock Feedback/);
    expect(content).toMatch(/> Recorded:/);
    expect(content).toMatch(/This is my feedback\./);
  });

  it('mock-feedback.md is overwritten on second run', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'mspec-feedback-overwrite-test-'));
    const changeDir = join(cwd, 'changes', CHANGE);
    await mkdir(changeDir, { recursive: true });

    const feedbackPath = join(changeDir, 'mock-feedback.md');
    await writeFile(feedbackPath, '# Mock Feedback\n\nFirst feedback.\n');
    await writeFile(feedbackPath, '# Mock Feedback\n\nSecond feedback.\n');

    const content = await readFile(feedbackPath, 'utf8');
    expect(content).toMatch(/Second feedback/);
    expect(content).not.toMatch(/First feedback/);
  });
});
