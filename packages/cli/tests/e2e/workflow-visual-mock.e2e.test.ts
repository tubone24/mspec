// @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-023
// Change: ui-visual-mock-workflow

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { continueCommand } from '../../src/commands/continue.js';
import { skipCommand } from '../../src/commands/skip.js';
import { statusCommand } from '../../src/commands/status.js';

const CHANGE = '2026-01-01-test-change';
const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOW_TEMPLATE = join(__dirname, '..', '..', 'templates', 'workflow.default.yaml');

async function setupProjectWithRealWorkflow(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'mspec-visual-mock-test-'));
  await mkdir(join(cwd, '.mspec'), { recursive: true });

  // Use the real workflow.default.yaml — this is what makes the test red before TASK-004
  const workflowContent = await readFile(WORKFLOW_TEMPLATE, 'utf8');
  await writeFile(join(cwd, '.mspec', 'workflow.yaml'), workflowContent);

  const changeDir = join(cwd, 'changes', CHANGE);
  await mkdir(changeDir, { recursive: true });
  await writeFile(join(changeDir, 'readme.md'), '# Test\n\n> Status: active\n');
  // proposal.md needs doc_type frontmatter + ## Constitution Check (constitution_check: true in real workflow)
  await writeFile(
    join(changeDir, 'proposal.md'),
    '---\ndoc_type: AI-Internal\n---\n\n# Proposal\n\n## Goals\n\nTest goals.\n\n## Constitution Check\n\n| Principle | Phase 0 |\n|-----------|--------|\n| I | ✅ |\n',
  );

  return cwd;
}

function captureStdout(fn: () => Promise<void>): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let captured = '';
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array): boolean => {
      if (typeof chunk === 'string') captured += chunk;
      return true;
    };
    try {
      await fn();
      resolve(captured);
    } catch (e) {
      reject(e);
    } finally {
      process.stdout.write = origWrite;
    }
  });
}

// FR-023 Scenario: visual-mock ステップがワークフローに出現する
describe('TASK-008: FR-023 — visual-mock step appears in workflow after proposal', () => {
  it('mspec continue returns current_step: "visual-mock" with block_after: true', async () => {
    const cwd = await setupProjectWithRealWorkflow();

    const json = await captureStdout(() =>
      continueCommand({ change: CHANGE, json: true, cwd }),
    );
    const result = JSON.parse(json);

    expect(result.current_step).toBe('visual-mock');
    expect(result.block_after).toBe(true);
    expect(result.next_action).toBe('execute');
  });
});

// FR-023 Scenario: visual-mock を skip する
describe('TASK-009: FR-023 — visual-mock skip flow', () => {
  it('after skip, mspec continue returns delta as next step', async () => {
    const cwd = await setupProjectWithRealWorkflow();

    await skipCommand('visual-mock', {
      change: CHANGE,
      reason: 'skipping for test purposes',
      cwd,
    });

    const json = await captureStdout(() =>
      continueCommand({ change: CHANGE, json: true, cwd }),
    );
    const result = JSON.parse(json);

    expect(result.current_step).toBe('delta');
  });

  it('after skip, mspec status returns visual-mock as skipped', async () => {
    const cwd = await setupProjectWithRealWorkflow();

    await skipCommand('visual-mock', {
      change: CHANGE,
      reason: 'skipping for test purposes',
      cwd,
    });

    const json = await captureStdout(() =>
      statusCommand({ change: CHANGE, json: true, cwd }),
    );
    const result = JSON.parse(json);

    const vmStep = result.steps.find((s: { id: string }) => s.id === 'visual-mock');
    expect(vmStep).toBeDefined();
    expect(vmStep.state).toBe('skipped');
  });
});
