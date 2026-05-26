// @mspec-delta 2026-05-26-131033-p1-llm-verify/specs/cli-core/spec.md
// Requirements implemented: FR-005
// Change: p1-llm-verify

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { verifyLlmCommand } from '../../src/commands/verify.js';

interface Env {
  root: string;
}

async function setupChange(
  changeName: string,
  deltaSpec: string,
  designMd?: string,
): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-verify-llm-'));
  const changeDir = join(root, 'changes', changeName);
  await mkdir(join(changeDir, 'specs', 'my-cap'), { recursive: true });
  await writeFile(join(changeDir, 'specs', 'my-cap', 'spec.md'), deltaSpec, 'utf8');
  await writeFile(
    join(changeDir, 'readme.md'),
    '---\ndoc_type: Tutorial\n---\n# test\n> Mode: minor\n## Request\ntest\n## Artifacts\n## Skipped Steps\n## Summary (Lessons / Next Steps)\n<!-- archive step will auto-fill -->\n',
    'utf8',
  );
  if (designMd) {
    await writeFile(join(changeDir, 'design.md'), designMd, 'utf8');
  }
  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(
    join(root, '.mspec', 'workflow.yaml'),
    'version: 1\nname: test\nsteps:\n  - id: new\n    command: /mspec:new\n    skill: mspec-new\n    block: true\n    removable: false\n',
    'utf8',
  );
  await writeFile(join(root, '.mspec', 'config.yaml'), 'locale: ja\n', 'utf8');
  return { root };
}

const DELTA_SPEC = `# Delta Spec: my-cap

## Security Capabilities

## ADDED Requirements

### Requirement: FR-001 — テスト要件A

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL テスト機能Aを提供する.

#### Scenario: 正常動作
- GIVEN システムが稼働している
- WHEN ユーザーが操作する
- THEN 結果が返される

### Requirement: FR-002 — テスト要件B

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL テスト機能Bを提供する.

#### Scenario: 基本動作
- GIVEN 前提条件
- WHEN 操作
- THEN 結果

## MODIFIED Requirements

## REMOVED Requirements

## RENAMED Requirements
`;

describe('FR-005: mspec verify --llm コマンド', () => {
  let env: Env;
  const changeName = '2026-05-26-000000-test-verify';

  beforeEach(async () => {
    env = await setupChange(changeName, DELTA_SPEC);
    vi.spyOn(process, 'cwd').mockReturnValue(env.root);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('Scenario 1: FR-IDごとのプロンプトJSONを stdout に出力する', async () => {
    const lines: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((data) => {
      lines.push(typeof data === 'string' ? data : data.toString());
      return true;
    });

    await verifyLlmCommand({ change: changeName });

    const output = lines.join('');
    const parsed = JSON.parse(output) as {
      change: string;
      fr_checks: Array<{ fr_id: string; title: string; prompt: string; acceptance_criteria: string[] }>;
    };

    expect(parsed.change).toBe(changeName);
    expect(parsed.fr_checks).toHaveLength(2);
    expect(parsed.fr_checks[0]?.fr_id).toBe('FR-001');
    expect(parsed.fr_checks[0]?.title).toBe('テスト要件A');
    expect(typeof parsed.fr_checks[0]?.prompt).toBe('string');
    expect(parsed.fr_checks[0]?.prompt.length).toBeGreaterThan(0);
    expect(Array.isArray(parsed.fr_checks[0]?.acceptance_criteria)).toBe(true);
    expect(parsed.fr_checks[0]?.acceptance_criteria.length).toBeGreaterThan(0);
  });

  it('Scenario 2: --json フラグでも同一の JSON が出力される', async () => {
    const lines: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((data) => {
      lines.push(typeof data === 'string' ? data : data.toString());
      return true;
    });

    await verifyLlmCommand({ change: changeName, json: true });

    const output = lines.join('');
    const parsed = JSON.parse(output) as { change: string; fr_checks: unknown[] };
    expect(parsed.change).toBe(changeName);
    expect(parsed.fr_checks).toHaveLength(2);
  });

  it('Scenario 3: specs/*/spec.md が存在しない場合は exit code 1 で終了する', async () => {
    const root2 = await mkdtemp(join(tmpdir(), 'mspec-verify-llm-empty-'));
    const changeDir2 = join(root2, 'changes', changeName);
    await mkdir(changeDir2, { recursive: true });
    await writeFile(
      join(changeDir2, 'readme.md'),
      '---\ndoc_type: Tutorial\n---\n# test\n## Request\ntest\n## Artifacts\n## Skipped Steps\n## Summary (Lessons / Next Steps)\n<!-- archive step will auto-fill -->\n',
      'utf8',
    );
    await mkdir(join(root2, '.mspec'), { recursive: true });
    await writeFile(
      join(root2, '.mspec', 'workflow.yaml'),
      'version: 1\nname: test\nsteps:\n  - id: new\n    command: /mspec:new\n    skill: mspec-new\n    block: true\n    removable: false\n',
      'utf8',
    );
    await writeFile(join(root2, '.mspec', 'config.yaml'), 'locale: ja\n', 'utf8');

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(root2);
    const origExitCode = process.exitCode;

    await verifyLlmCommand({ change: changeName });

    expect(process.exitCode).toBe(1);
    process.exitCode = origExitCode;
    cwdSpy.mockRestore();
    await rm(root2, { recursive: true, force: true });
  });
});
