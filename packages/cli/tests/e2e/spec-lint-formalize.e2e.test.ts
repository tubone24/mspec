// @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010
// Change: claude-core-completion

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { specLintCommand } from '../../src/commands/spec-lint.js';

interface Env {
  root: string;
}

async function setupProject(specs: Record<string, string> = {}): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-spec-lint-'));
  await mkdir(join(root, 'specs'), { recursive: true });
  for (const [name, content] of Object.entries(specs)) {
    await mkdir(join(root, 'specs', name), { recursive: true });
    await writeFile(join(root, 'specs', name, 'spec.md'), content, 'utf8');
  }
  return { root };
}

describe('FR-001: 3 カテゴリの違反がそれぞれ出力される', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'my-cap': [
        '# Spec: my-cap',
        '',
        'It uses git mv to rename.',
        'It calls zod to validate.',
        'It calls handleRequest() for the request.',
      ].join('\n'),
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('3 カテゴリ (shell-command/library-name/impl-verb) の違反がそれぞれ出力される', async () => {
    await specLintCommand(undefined, { cwd: env.root });
    const joined = output.join('\n');
    expect(joined).toMatch(/shell-command|shell-git-mv/);
    expect(joined).toMatch(/library-name|lib-zod/);
    expect(joined).toMatch(/impl-verb|verb-calls/);
  });
});

describe('FR-002: 違反レポートにルール ID とヒントが含まれる', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cap': '# Spec\n\nUse git mv to move files.\n',
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('違反レポートに kebab-case ルール ID とヒントが含まれる', async () => {
    await specLintCommand('specs/cap/spec.md', { cwd: env.root, json: true });
    const parsed = JSON.parse(output.join(''));
    expect(parsed.violations[0].ruleId).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(parsed.violations[0].hint.length).toBeGreaterThan(0);
  });
});

describe('FR-003: デフォルト走査で全 SoT スペックがカバーされる', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cap-a': '# Spec A\n\nUse git mv here.\n',
      'cap-b': '# Spec B\n\nUse git add here.\n',
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('デフォルト走査で全 SoT スペックがカバーされる', async () => {
    await specLintCommand(undefined, { cwd: env.root, json: true });
    const parsed = JSON.parse(output.join(''));
    const files = new Set(parsed.violations.map((v: { file: string }) => v.file));
    expect(files.size).toBe(2);
  });
});

describe('FR-004: HTML コメント内の禁止トークンは沈黙する', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cap': '# Spec\n\n<!-- git mv is forbidden -->\n\nNormal content.\n',
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('HTML コメント内の禁止トークンは沈黙する (0 件)', async () => {
    await specLintCommand('specs/cap/spec.md', { cwd: env.root, json: true });
    const parsed = JSON.parse(output.join(''));
    expect(parsed.violations).toHaveLength(0);
  });
});

describe('FR-005: フェンス内の禁止トークンは沈黙する', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cap': '# Spec\n\n```\ngit mv old new\n```\n\nNormal content.\n',
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('フェンス内の禁止トークンは沈黙する (0 件)', async () => {
    await specLintCommand('specs/cap/spec.md', { cwd: env.root, json: true });
    const parsed = JSON.parse(output.join(''));
    expect(parsed.violations).toHaveLength(0);
  });
});

describe('FR-006: 再実行で出力がバイト一致する', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cap': '# Spec\n\nUse git mv then git add here.\n',
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('--json 2 回でバイト一致', async () => {
    await specLintCommand('specs/cap/spec.md', { cwd: env.root, json: true });
    const first = output.join('\n');
    output = [];
    await specLintCommand('specs/cap/spec.md', { cwd: env.root, json: true });
    const second = output.join('\n');
    expect(first).toBe(second);
  });
});

describe('FR-007: --allow でルール個別無効化', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cap': '# Spec\n\nUse zod for validation.\n',
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('--allow lib-zod で違反が抑制される', async () => {
    process.exitCode = 0;
    await specLintCommand('specs/cap/spec.md', { cwd: env.root, allow: ['lib-zod'] });
    const joined = output.join('\n');
    expect(joined).toMatch(/0 violations/);
    expect(process.exitCode).toBe(0);
  });
});

describe('FR-008: --json エンベロープに violations と summary が含まれる', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cap-a': '# Spec A\n\nUse git mv here.\n',
      'cap-b': '# Spec B\n\nUse git add and git mv.\n',
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('--json に violations と summary 2 キーが含まれる', async () => {
    await specLintCommand(undefined, { cwd: env.root, json: true });
    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveProperty('violations');
    expect(parsed).toHaveProperty('summary');
    expect(typeof parsed.summary.files).toBe('number');
    expect(typeof parsed.summary.violations).toBe('number');
  });
});

describe('FR-009: 違反検出で非ゼロ終了コード', () => {
  let env: Env;

  beforeEach(async () => {
    env = await setupProject({
      'cap': '# Spec\n\nUse git mv to rename.\n',
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('違反検出で process.exitCode が非ゼロになる', async () => {
    process.exitCode = 0;
    await specLintCommand('specs/cap/spec.md', { cwd: env.root });
    expect(process.exitCode).not.toBe(0);
    process.exitCode = 0; // cleanup
  });
});

describe('FR-010: mspec validate --strict への組み込み', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cap': '# Spec\n\nUse git mv to rename.\n',
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('spec-lint は lintSotSpecs 関数経由で validate --strict から呼べる', async () => {
    // This test verifies the lintSotSpecs function works - the actual --strict
    // integration is wired in validate.ts which calls specLintCommand / lintSotSpecs
    const { lintSotSpecs } = await import('../../src/lib/spec-linter.js');
    const violations = lintSotSpecs(env.root);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.ruleId).toMatch(/shell-git-mv/);
  });
});
