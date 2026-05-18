// @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-archive/spec.md
// Requirements implemented: FR-013, FR-014
// Change: claude-core-completion
// @mspec-delta 2026-05-16-135317-fix-archive-record-done/specs/cli-core/spec.md
// Requirements implemented: FR-003
// Change: fix-archive-record-done
// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/claude-integration/spec.md
// Requirements implemented: FR-023
// Change: revise-artifact-taxonomy

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { archiveCommand, printReport } from '../../src/commands/archive.js';

const WORKFLOW_YAML = `version: 1
name: mspec-test
description: minimal workflow for archive tests
steps:
  - id: new
    command: /mspec:new
    skill: mspec-new
    produces: [readme.md]
    block: true
    removable: false
  - id: proposal
    command: /mspec:proposal
    skill: mspec-proposal
    produces: [proposal.md]
    block: true
    removable: false
  - id: delta
    command: /mspec:delta
    skill: mspec-delta
    produces: ["specs/*/spec.md"]
    block: false
    removable: false
  - id: tasks
    command: /mspec:tasks
    skill: mspec-tasks
    produces: [tasks.md]
    block: true
    removable: false
  - id: implement
    command: /mspec:implement
    skill: mspec-implement
    produces: []
    block: true
    removable: false
  - id: archive
    command: /mspec:archive
    skill: mspec-archive
    produces: []
    block: false
    removable: false
`;

const SOURCE_SPEC_ANCHOR = `# Capability: cli-anchor

## Purpose

The anchor capability.

## Requirements

### Requirement: FR-010 — Existing requirement
The system MUST do something.

#### Scenario: something
- GIVEN context
- WHEN action
- THEN result
`;

const SOURCE_SPEC_ARCHIVE = `# Capability: cli-archive

## Purpose

The archive capability.

## Requirements

### Requirement: FR-010 — Existing archive requirement
The system MUST archive correctly.

#### Scenario: archives
- GIVEN change
- WHEN archived
- THEN done
`;

const DELTA_ANCHOR = `# Delta Spec: cli-anchor

## ADDED Requirements

### Requirement: FR-015 — First added
Body text.

#### Scenario: first
- GIVEN context
- WHEN action
- THEN result

### Requirement: FR-016 — Second added
Body text.

#### Scenario: second
- GIVEN context
- WHEN action
- THEN result

## MODIFIED Requirements

### Requirement: FR-010 — Existing requirement
Modified body.

#### Scenario: something
- GIVEN context
- WHEN action
- THEN result
`;

const DELTA_ARCHIVE = `# Delta Spec: cli-archive

## ADDED Requirements

### Requirement: FR-013 — First archive added
Body text.

#### Scenario: archive added
- GIVEN context
- WHEN action
- THEN result
`;

interface Env {
  root: string;
  change: string;
}

async function setupProject(): Promise<Env> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-archive-summary-'));
  const change = '2026-05-14-093015-test-summary';

  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(join(root, '.mspec', 'workflow.yaml'), WORKFLOW_YAML, 'utf8');

  await mkdir(join(root, 'specs', 'cli-anchor'), { recursive: true });
  await writeFile(join(root, 'specs', 'cli-anchor', 'spec.md'), SOURCE_SPEC_ANCHOR, 'utf8');
  await mkdir(join(root, 'specs', 'cli-archive'), { recursive: true });
  await writeFile(join(root, 'specs', 'cli-archive', 'spec.md'), SOURCE_SPEC_ARCHIVE, 'utf8');

  await mkdir(join(root, 'changes', change, 'specs', 'cli-anchor'), { recursive: true });
  await writeFile(
    join(root, 'changes', change, 'specs', 'cli-anchor', 'spec.md'),
    DELTA_ANCHOR,
    'utf8',
  );
  await mkdir(join(root, 'changes', change, 'specs', 'cli-archive'), { recursive: true });
  await writeFile(
    join(root, 'changes', change, 'specs', 'cli-archive', 'spec.md'),
    DELTA_ARCHIVE,
    'utf8',
  );
  await writeFile(join(root, 'changes', change, 'readme.md'), '# change\n', 'utf8');

  return { root, change };
}

describe('FR-013: printReport includes capability summary lines', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject();
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('サマリ行に capability ごとの件数が並ぶ', async () => {
    const result = await archiveCommand({ change: env.change, yes: true, cwd: env.root });
    printReport(result.merged, result.change, result.moved, false);

    const joined = output.join('\n');
    // cli-anchor: +2 ~1 -0 ⇄0
    expect(joined).toMatch(/cli-anchor: \+2 ~1 -0 ⇄0/);
    // cli-archive: +1 ~0 -0 ⇄0
    expect(joined).toMatch(/cli-archive: \+1 ~0 -0 ⇄0/);
  });

  it('再実行でサマリがバイト一致する', async () => {
    const result = await archiveCommand({ change: env.change, yes: true, cwd: env.root });
    printReport(result.merged, result.change, result.moved, false);
    const first = [...output];

    output = [];
    printReport(result.merged, result.change, result.moved, false);
    const second = [...output];

    expect(first.join('\n')).toBe(second.join('\n'));
  });
});

describe('FR-014: dry-run output has preview header and no summary', () => {
  let env: Env;
  let output: string[];

  beforeEach(async () => {
    env = await setupProject();
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      output.push(args.map(String).join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(env.root, { recursive: true, force: true });
  });

  it('dry-run 出力はプレビューヘッダを持ちサマリ行を含まない', async () => {
    const result = await archiveCommand({ change: env.change, dryRun: true, yes: true, cwd: env.root });
    printReport(result.merged, result.change, result.moved, true);

    const joined = output.join('\n');
    // Should have dry-run preview header
    expect(joined).toMatch(/dry-run\s*preview|dry-run preview/i);
    // Should NOT have the summary format
    expect(joined).not.toMatch(/cli-anchor: \+\d/);
    expect(joined).not.toMatch(/cli-archive: \+\d/);
  });
});

// ── FR-023: archive step fills readme Summary section ─────────────────────────
// T140: archive-completed readme.md structure test (fixture-based; tests structure validator)
// T141: placeholder-only Summary triggers validate warning / --strict error

import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_ENTRY = join(__dirname, '../../dist/index.js');

/** Minimal workflow YAML that includes all REQUIRED_STEP_IDS and produces readme.md from "new" step */
const SUMMARY_WORKFLOW_YAML = [
  'version: 1',
  'name: mspec-summary-test',
  'steps:',
  '  - id: new',
  '    command: /mspec:new',
  '    skill: mspec-new',
  '    produces: [readme.md]',
  '    block: true',
  '    removable: false',
  '    ask_questions: false',
  '  - id: proposal',
  '    command: /mspec:proposal',
  '    skill: mspec-proposal',
  '    produces: []',
  '    block: false',
  '    removable: false',
  '    ask_questions: false',
  '  - id: delta',
  '    command: /mspec:delta',
  '    skill: mspec-delta',
  '    produces: []',
  '    block: false',
  '    removable: false',
  '    ask_questions: false',
  '  - id: tasks',
  '    command: /mspec:tasks',
  '    skill: mspec-tasks',
  '    produces: []',
  '    block: false',
  '    removable: false',
  '    ask_questions: false',
  '  - id: implement',
  '    command: /mspec:implement',
  '    skill: mspec-implement',
  '    produces: []',
  '    block: false',
  '    removable: false',
  '    ask_questions: false',
  '  - id: archive',
  '    command: /mspec:archive',
  '    skill: mspec-archive',
  '    produces: []',
  '    block: false',
  '    removable: false',
  '    ask_questions: false',
].join('\n');

/** readme.md with FILLED Summary (archive step has already run; real content present) */
const README_WITH_FILLED_SUMMARY = [
  '---',
  'doc_type: Tutorial',
  '---',
  '',
  '# test-feature',
  '',
  '> Status: archived',
  '',
  '## Request',
  '',
  'Test feature request.',
  '',
  '## Summary (Lessons / Next Steps)',
  '',
  '### Lessons',
  '',
  '- Learned that the artifact taxonomy needs clear doc_type boundaries.',
  '- The design-rationale.md separation improved review quality.',
  '- Constitution Check Phase 0/1 columns caught two structural issues early.',
  '',
  '### Next Steps',
  '',
  '- Follow-up: rename FR-002 title to remove "four Diátaxis" wording (FR-002).',
  '- Consider adding a quickstart template update for design-rationale workflow.',
].join('\n');

/** readme.md where Summary section contains ONLY the placeholder comment (not yet filled) */
const README_WITH_PLACEHOLDER_SUMMARY_JA = [
  '---',
  'doc_type: Tutorial',
  '---',
  '',
  '# test-feature',
  '',
  '> Status: in-progress',
  '',
  '## Request',
  '',
  'Test feature request.',
  '',
  '## Summary (Lessons / Next Steps)',
  '',
  '<!-- archive ステップで AI が生成 -->',
].join('\n');

/** readme.md where Summary section contains ONLY the en-locale placeholder comment */
const README_WITH_PLACEHOLDER_SUMMARY_EN = [
  '---',
  'doc_type: Tutorial',
  '---',
  '',
  '# test-feature',
  '',
  '> Status: in-progress',
  '',
  '## Request',
  '',
  'Test feature request.',
  '',
  '## Summary (Lessons / Next Steps)',
  '',
  '<!-- archive step will auto-fill -->',
].join('\n');

async function scaffoldSummaryProject(readmeContent: string): Promise<{ root: string; changeId: string }> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-summary-'));
  const changeId = '2026-05-18-000001-summary-test';

  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(
    join(root, '.mspec', 'config.yaml'),
    ['version: 1', 'locale: "ja"'].join('\n'),
    'utf8',
  );
  await writeFile(join(root, '.mspec', 'workflow.yaml'), SUMMARY_WORKFLOW_YAML, 'utf8');

  const changeDir = join(root, 'changes', changeId);
  await mkdir(changeDir, { recursive: true });
  await writeFile(join(changeDir, 'readme.md'), readmeContent, 'utf8');

  return { root, changeId };
}

function runValidateSummary(
  root: string,
  changeId: string,
  strict = false,
): { status: number; stdout: string; stderr: string } {
  const args = [CLI_ENTRY, 'validate', '--change', changeId];
  if (strict) args.push('--strict');
  const res = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  return { status: res.status ?? -1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

// ── T140: archive-completed readme structure (GREEN — fixture has real content) ──
describe('FR-023 T140: archive-completed readme has filled Summary section', () => {
  it('readme.md with real Lessons + Next Steps passes validate (exit 0)', async () => {
    const { root, changeId } = await scaffoldSummaryProject(README_WITH_FILLED_SUMMARY);
    try {
      const { status, stdout, stderr } = runValidateSummary(root, changeId);
      const combined = stdout + stderr;
      // Should not report any Summary placeholder warning
      expect(combined).not.toMatch(/Summary section not filled/i);
      expect(status).toBe(0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('filled Summary has ## Summary (Lessons / Next Steps) with ### Lessons (≥3 bullets) and ### Next Steps (≥2 bullets)', () => {
    // Structural assertion on the fixture content itself
    expect(README_WITH_FILLED_SUMMARY).toContain('## Summary (Lessons / Next Steps)');
    expect(README_WITH_FILLED_SUMMARY).toContain('### Lessons');
    expect(README_WITH_FILLED_SUMMARY).toContain('### Next Steps');

    // Count bullet points in Lessons
    const lessonsSection = README_WITH_FILLED_SUMMARY.slice(
      README_WITH_FILLED_SUMMARY.indexOf('### Lessons'),
      README_WITH_FILLED_SUMMARY.indexOf('### Next Steps'),
    );
    const lessonsBullets = (lessonsSection.match(/^- /gm) ?? []).length;
    expect(lessonsBullets).toBeGreaterThanOrEqual(3);

    // Count bullet points in Next Steps
    const nextStepsSection = README_WITH_FILLED_SUMMARY.slice(
      README_WITH_FILLED_SUMMARY.indexOf('### Next Steps'),
    );
    const nextStepsBullets = (nextStepsSection.match(/^- /gm) ?? []).length;
    expect(nextStepsBullets).toBeGreaterThanOrEqual(2);

    // Total length constraint: ≤ 30 lines / 1,500 characters for the Summary block
    const summaryBlock = README_WITH_FILLED_SUMMARY.slice(
      README_WITH_FILLED_SUMMARY.indexOf('## Summary (Lessons / Next Steps)'),
    );
    const lineCount = summaryBlock.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(30);
    expect(summaryBlock.length).toBeLessThanOrEqual(1500);
  });
});

// ── T141: placeholder-only Summary triggers warning/error (RED until T151) ────
describe('FR-023 T141: placeholder-only Summary triggers validate warning/error', () => {
  it('ja placeholder in Summary section: non-strict validate emits warning text (exit 0)', async () => {
    const { root, changeId } = await scaffoldSummaryProject(README_WITH_PLACEHOLDER_SUMMARY_JA);
    try {
      const { status, stdout, stderr } = runValidateSummary(root, changeId, false);
      const combined = stdout + stderr;
      // Warning should be present in output
      expect(combined).toMatch(/Summary section not filled/i);
      // Non-strict: exit 0 (warning, not error)
      expect(status).toBe(0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('ja placeholder in Summary section: --strict validate escalates to error (exit non-zero)', async () => {
    const { root, changeId } = await scaffoldSummaryProject(README_WITH_PLACEHOLDER_SUMMARY_JA);
    try {
      const { status, stdout, stderr } = runValidateSummary(root, changeId, true);
      const combined = stdout + stderr;
      expect(combined).toMatch(/Summary section not filled/i);
      expect(status).not.toBe(0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('en placeholder in Summary section: non-strict validate emits warning text (exit 0)', async () => {
    const { root, changeId } = await scaffoldSummaryProject(README_WITH_PLACEHOLDER_SUMMARY_EN);
    try {
      const { status, stdout, stderr } = runValidateSummary(root, changeId, false);
      const combined = stdout + stderr;
      expect(combined).toMatch(/Summary section not filled/i);
      expect(status).toBe(0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('readme.md WITHOUT Summary section at all: no placeholder warning triggered', async () => {
    const readmeNoSummary = [
      '---',
      'doc_type: Tutorial',
      '---',
      '',
      '# test-feature',
      '',
      '## Request',
      '',
      'Test feature request.',
      '',
    ].join('\n');
    const { root, changeId } = await scaffoldSummaryProject(readmeNoSummary);
    try {
      const { status, stdout, stderr } = runValidateSummary(root, changeId, false);
      const combined = stdout + stderr;
      expect(combined).not.toMatch(/Summary section not filled/i);
      expect(status).toBe(0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
