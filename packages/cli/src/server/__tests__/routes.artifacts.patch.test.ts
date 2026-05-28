// @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/web-ui-server/spec.md
// Requirements implemented: FR-007
// Change: fix-checklist-ui-sync

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Fastify from 'fastify';
import { registerArtifactsRoutes } from '../routes/artifacts.js';

const CHANGE_ID = 'test-change-001';
const INITIAL_CONTENT = `# Checklist

- [ ] FR-007 verify <!-- verify: fr-007 -->
- [x] FR-001 done <!-- verify: fr-001 -->
`;

let tmpRoot: string;
let changeDir: string;
let checklistPath: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), 'mspec-patch-test-'));
  changeDir = join(tmpRoot, 'changes', CHANGE_ID);
  checklistPath = join(changeDir, 'checklist.md');
  await mkdir(changeDir, { recursive: true });
  await writeFile(checklistPath, INITIAL_CONTENT, 'utf8');
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

async function buildApp(root: string) {
  const app = Fastify({ logger: false });
  await registerArtifactsRoutes(app, root);
  return app;
}

describe('PATCH /api/changes/:id/artifacts/checklist.md', () => {
  it('FR-007 Scenario A: 有効な change ID → 200 OK かつファイルが更新される', async () => {
    const app = await buildApp(tmpRoot);
    const updatedContent = INITIAL_CONTENT.replace('- [ ]', '- [x]');

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/changes/${CHANGE_ID}/artifacts/checklist.md`,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      payload: updatedContent,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { ok: boolean };
    expect(body.ok).toBe(true);

    const written = await readFile(checklistPath, 'utf8');
    expect(written).toBe(updatedContent);
  });

  it('FR-007 Scenario B: 存在しない change ID → 404 かつファイル変化なし', async () => {
    const app = await buildApp(tmpRoot);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/changes/nonexistent-change-xyz/artifacts/checklist.md',
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      payload: 'updated content',
    });

    expect(res.statusCode).toBe(404);

    // 元のファイルは変化しない
    const unchanged = await readFile(checklistPath, 'utf8');
    expect(unchanged).toBe(INITIAL_CONTENT);
  });

  it('FR-007 Scenario C: design.md への PATCH は 404（ルート未登録）', async () => {
    const app = await buildApp(tmpRoot);

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/changes/${CHANGE_ID}/artifacts/design.md`,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      payload: 'should not be written',
    });

    expect(res.statusCode).toBe(404);
  });
});
