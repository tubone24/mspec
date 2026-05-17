// @mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-011, FR-012, FR-013, FR-014
// Change: spec-grep

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { specListCapabilitiesCommand } from '../../src/commands/spec-list-capabilities.js';
import { specListRequirementsCommand } from '../../src/commands/spec-list-requirements.js';
import { specGrepCommand } from '../../src/commands/spec-grep.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface Env {
  root: string;
}

async function setupProject(
  specs: Record<string, string> = {},
  changes: Record<string, Record<string, string>> = {},
): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-spec-grep-'));
  await mkdir(join(root, 'specs'), { recursive: true });
  await mkdir(join(root, 'changes'), { recursive: true });

  for (const [capName, content] of Object.entries(specs)) {
    await mkdir(join(root, 'specs', capName), { recursive: true });
    await writeFile(join(root, 'specs', capName, 'spec.md'), content, 'utf8');
  }

  for (const [changeName, changeSpecs] of Object.entries(changes)) {
    for (const [capName, content] of Object.entries(changeSpecs)) {
      await mkdir(join(root, 'changes', changeName, 'specs', capName), { recursive: true });
      await writeFile(
        join(root, 'changes', changeName, 'specs', capName, 'spec.md'),
        content,
        'utf8',
      );
    }
  }

  return { root };
}

// ---------------------------------------------------------------------------
// FR-013: mspec spec list-capabilities
// ---------------------------------------------------------------------------

describe('FR-013 Scenario 1: capability 名が昇順で列挙される', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'workflow-core': '# Spec\n\n### Requirement: FR-001 — foo\nFoo MUST bar.\n\n#### Scenario: s\n- GIVEN g\n- WHEN w\n- THEN t\n',
      'cli-delta': '# Spec\n\n### Requirement: FR-001 — bar\nBar MUST baz.\n\n#### Scenario: s\n- GIVEN g\n- WHEN w\n- THEN t\n',
      'cli-spec-lint': '# Spec\n\n### Requirement: FR-001 — baz\nBaz MUST qux.\n\n#### Scenario: s\n- GIVEN g\n- WHEN w\n- THEN t\n',
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('capability 名がアルファベット昇順で出力される', async () => {
    await specListCapabilitiesCommand({ cwd: env.root });
    const joined = output.join('\n');
    expect(joined).toContain('cli-delta');
    expect(joined).toContain('cli-spec-lint');
    expect(joined).toContain('workflow-core');
    const lines = joined.split('\n').filter((l) => l.trim().length > 0);
    const names = lines.map((l) => l.trim());
    expect(names).toEqual(['cli-delta', 'cli-spec-lint', 'workflow-core']);
  });
});

describe('FR-013 Scenario 2: `specs/` が存在しない場合のエラー', () => {
  let env: Env;
  let errOutput: string[];

  beforeEach(async () => {
    const root = await mkdtemp(join(tmpdir(), 'mspec-spec-grep-nospec-'));
    env = { root };
    errOutput = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      errOutput.push(args.map(String).join(' '));
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('specs/ が存在しないとき exit code が非ゼロになる', async () => {
    process.exitCode = 0;
    await specListCapabilitiesCommand({ cwd: env.root });
    expect(process.exitCode).not.toBe(0);
  });
});

describe('FR-013 (追加): archive ディレクトリが capability 一覧に含まれない', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({ 'cli-lint': '# Spec\n\n### Requirement: FR-001 — x\nX MUST y.\n\n#### Scenario: s\n- GIVEN g\n- WHEN w\n- THEN t\n' });
    await mkdir(join(env.root, 'specs', 'archive'), { recursive: true });
    await writeFile(join(env.root, 'specs', 'archive', 'spec.md'), '# Archive', 'utf8');
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('archive が capability 一覧に含まれない', async () => {
    await specListCapabilitiesCommand({ cwd: env.root });
    const joined = output.join('\n');
    expect(joined).not.toContain('archive');
    expect(joined).toContain('cli-lint');
  });
});

describe('FR-014 Scenario 3: list-capabilities --json が構造化 JSON を返す', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cli-alpha': '# Spec\n\n### Requirement: FR-001 — a\nA MUST b.\n\n#### Scenario: s\n- GIVEN g\n- WHEN w\n- THEN t\n',
      'cli-beta': '# Spec\n\n### Requirement: FR-001 — b\nB MUST c.\n\n#### Scenario: s\n- GIVEN g\n- WHEN w\n- THEN t\n',
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('--json が {command, results, meta} 構造を返す', async () => {
    await specListCapabilitiesCommand({ json: true, cwd: env.root });
    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveProperty('command', 'list-capabilities');
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(parsed.results[0]).toHaveProperty('capability');
    expect(parsed).toHaveProperty('meta');
    expect(typeof parsed.meta.count).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// FR-011: mspec spec list-requirements
// ---------------------------------------------------------------------------

const SAMPLE_SPEC = `# cli-spec-lint Specification

## Requirements

### Requirement: FR-001 — 3 カテゴリ分類の禁止語彙リンタ
システムは MUST 禁止語彙を報告する。

#### Scenario: 違反が出力される
- GIVEN 違反を含むファイル
- WHEN lint を実行
- THEN 違反が報告される

### Requirement: FR-002 — 安定したルール識別子
システムは MUST ルール ID を公開する。

#### Scenario: ルール ID が出力される
- GIVEN 違反を含むファイル
- WHEN lint を実行
- THEN ルール ID が含まれる
`;

describe('FR-011 Scenario 1: 全 capability の Requirement が capability ヘッダ付きグループで出力される', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cap-a': SAMPLE_SPEC,
      'cap-b': SAMPLE_SPEC,
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('各 capability のヘッダと FR-ID・タイトルが出力される', async () => {
    await specListRequirementsCommand(undefined, { cwd: env.root });
    const joined = output.join('\n');
    expect(joined).toContain('cap-a');
    expect(joined).toContain('cap-b');
    expect(joined).toContain('FR-001');
    expect(joined).toContain('FR-002');
  });
});

describe('FR-011 Scenario 2: glob フィルタが正しく適用される', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({
      'cli-spec-lint': SAMPLE_SPEC,
      'cli-delta': SAMPLE_SPEC,
    });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('glob "cli-spec*" で cli-spec-lint のみが含まれる', async () => {
    await specListRequirementsCommand('cli-spec*', { cwd: env.root });
    const joined = output.join('\n');
    expect(joined).toContain('cli-spec-lint');
    expect(joined).not.toContain('cli-delta');
  });
});

describe('FR-011 (追加): glob でゼロ件一致のとき空の結果を exit 0 で返す', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({ 'cli-lint': SAMPLE_SPEC });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('マッチしない glob は exit 0 で空の結果を返す', async () => {
    process.exitCode = 0;
    await specListRequirementsCommand('no-match-*', { cwd: env.root });
    expect(process.exitCode).toBe(0);
  });
});

describe('FR-014 Scenario 1: list-requirements --json が構造化 JSON を返す', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({ 'cli-spec-lint': SAMPLE_SPEC });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('--json が {command, results:[{capability, fr_id, title}], meta} を返す', async () => {
    await specListRequirementsCommand(undefined, { json: true, cwd: env.root });
    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveProperty('command', 'list-requirements');
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(parsed.results[0]).toHaveProperty('capability');
    expect(parsed.results[0]).toHaveProperty('fr_id');
    expect(parsed.results[0]).toHaveProperty('title');
    expect(parsed).toHaveProperty('meta');
  });
});

// ---------------------------------------------------------------------------
// FR-012: mspec spec grep
// ---------------------------------------------------------------------------

const SOT_SPEC_CONTENT = `# cli-spec-lint Specification

## Requirements

### Requirement: FR-001 — 3 カテゴリ分類の禁止語彙リンタ
システムは MUST 禁止語彙を報告する。

#### Scenario: 違反が出力される
- GIVEN 違反を含むファイル
- WHEN lint を実行
- THEN 違反が報告される
`;

const DELTA_SPEC_CONTENT = `# Delta Spec: cli-spec-lint

## ADDED Requirements

### Requirement: FR-011 — list-requirements コマンド
システムは MUST list-requirements を提供する。

#### Scenario: requirements が出力される
- GIVEN specs/ が存在する
- WHEN list-requirements を実行
- THEN FR-ID と title が出力される
`;

describe('FR-012 Scenario 1: SoT スペックの FR が正確に返される', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({ 'cli-spec-lint': SOT_SPEC_CONTENT });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('SoT spec の FR-001 ブロックが返される', async () => {
    await specGrepCommand('FR-001', { cwd: env.root });
    const joined = output.join('\n');
    expect(joined).toContain('FR-001');
    expect(joined).toContain('cli-spec-lint');
  });
});

describe('FR-012 Scenario 2: Delta Spec の FR も検索対象に含まれる', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject(
      { 'cli-spec-lint': SOT_SPEC_CONTENT },
      { 'test-change': { 'cli-spec-lint': DELTA_SPEC_CONTENT } },
    );
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('Delta Spec 内の FR-011 ブロックが返される', async () => {
    await specGrepCommand('FR-011', { cwd: env.root });
    const joined = output.join('\n');
    expect(joined).toContain('FR-011');
    expect(joined).toContain('test-change');
  });
});

describe('FR-012 Scenario 3: 不正な形式の ID はエラーになる', () => {
  let env: Env;
  let errOutput: string[];

  beforeEach(async () => {
    env = await setupProject({ 'cli-spec-lint': SOT_SPEC_CONTENT });
    errOutput = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      errOutput.push(args.map(String).join(' '));
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('INVALID-ID は exit 1 でエラーメッセージを出力する', async () => {
    process.exitCode = 0;
    await specGrepCommand('INVALID-ID', { cwd: env.root });
    expect(process.exitCode).not.toBe(0);
    expect(errOutput.join(' ')).toMatch(/invalid|format|FR-/i);
  });

  it('FR-12345 (5桁) は exit 1 でエラーになる', async () => {
    process.exitCode = 0;
    await specGrepCommand('FR-12345', { cwd: env.root });
    expect(process.exitCode).not.toBe(0);
  });

  it('fr-001 (小文字) は有効フォーマットとして受理される (i フラグ)', async () => {
    process.exitCode = 0;
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      errOutput.push(args.map(String).join(' '));
    });
    await specGrepCommand('fr-001', { cwd: env.root });
    expect(process.exitCode).toBe(0);
  });
});

describe('FR-012 Scenario 4: 有効な形式だが存在しない FR-ID は exit 0 で空の結果を返す', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({ 'cli-spec-lint': SOT_SPEC_CONTENT });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('FR-999 は exit 0 で空の結果を返す', async () => {
    process.exitCode = 0;
    await specGrepCommand('FR-999', { cwd: env.root });
    expect(process.exitCode).toBe(0);
  });
});

describe('FR-014 Scenario 2: spec grep --json が構造化 JSON を返す', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject({ 'cli-spec-lint': SOT_SPEC_CONTENT });
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
    process.exitCode = 0;
  });

  it('--json が {command, results:[{fr_id, file, block}], meta} を返す', async () => {
    await specGrepCommand('FR-001', { json: true, cwd: env.root });
    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveProperty('command', 'spec-grep');
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(parsed.results[0]).toHaveProperty('fr_id');
    expect(parsed.results[0]).toHaveProperty('file');
    expect(parsed.results[0]).toHaveProperty('block');
    expect(parsed).toHaveProperty('meta');
    expect(parsed.meta).toHaveProperty('query', 'FR-001');
  });
});
