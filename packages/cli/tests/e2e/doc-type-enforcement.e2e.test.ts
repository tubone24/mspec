// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-015
// Change: revise-artifact-taxonomy
// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-001, FR-002
// Change: revise-artifact-taxonomy
// @mspec-delta 2026-05-18-074640-rename-fr-002-doc-type-title/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-002
// Change: rename-fr-002-doc-type-title

import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_ENTRY = join(__dirname, '../../dist/index.js');

interface ScaffoldOpts {
  /** content for changes/<id>/readme.md (or null to skip writing the file) */
  readmeContent: string | null;
}

async function scaffoldProject(opts: ScaffoldOpts): Promise<{ root: string; changeId: string }> {
  const root = await mkdtemp(join(tmpdir(), 'mspec-doctype-'));
  const changeId = '2026-05-18-000000-doctype-test';

  await mkdir(join(root, '.mspec'), { recursive: true });
  await writeFile(
    join(root, '.mspec', 'config.yaml'),
    ['version: 1', 'locale: "ja"'].join('\n'),
    'utf8',
  );
  // Minimal workflow with a single step producing readme.md; doc_type validation
  // applies independently of step semantics.
  // Minimal valid workflow containing all REQUIRED_STEP_IDS so that loadWorkflow
  // accepts it; only the `new` step produces `readme.md` (the file under test).
  await writeFile(
    join(root, '.mspec', 'workflow.yaml'),
    [
      'version: 1',
      'name: mspec-doctype-test',
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
    ].join('\n'),
    'utf8',
  );

  const changeDir = join(root, 'changes', changeId);
  await mkdir(changeDir, { recursive: true });
  if (opts.readmeContent !== null) {
    await writeFile(join(changeDir, 'readme.md'), opts.readmeContent, 'utf8');
  }

  return { root, changeId };
}

function runValidate(root: string, changeId: string): { status: number; stdout: string; stderr: string } {
  const res = spawnSync(process.execPath, [CLI_ENTRY, 'validate', '--change', changeId], {
    cwd: root,
    encoding: 'utf8',
  });
  return { status: res.status ?? -1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

describe('FR-015: doc_type value enforcement (artifact-taxonomy FR-002)', () => {
  it('rejects invalid doc_type "Mixed" with the spec-mandated error message', async () => {
    const { root, changeId } = await scaffoldProject({
      readmeContent: ['---', 'doc_type: Mixed', '---', '', '# readme', ''].join('\n'),
    });
    try {
      const { status, stdout, stderr } = runValidate(root, changeId);
      const combined = stdout + stderr;
      expect(status).not.toBe(0);
      expect(combined).toContain(
        'Mixed is not a valid doc_type; allowed: Reference, Explanation, How-to, Tutorial, AI-Internal',
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('accepts a template declaring doc_type: AI-Internal (exit 0)', async () => {
    const { root, changeId } = await scaffoldProject({
      readmeContent: ['---', 'doc_type: AI-Internal', '---', '', '# readme', ''].join('\n'),
    });
    try {
      const { status, stdout, stderr } = runValidate(root, changeId);
      const combined = stdout + stderr;
      expect(combined).not.toContain('is not a valid doc_type');
      expect(status).toBe(0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects an artifact missing the doc_type field', async () => {
    const { root, changeId } = await scaffoldProject({
      // Frontmatter present but doc_type field absent
      readmeContent: ['---', 'title: foo', '---', '', '# readme', ''].join('\n'),
    });
    try {
      const { status, stdout, stderr } = runValidate(root, changeId);
      const combined = stdout + stderr;
      expect(status).not.toBe(0);
      expect(combined).toMatch(/doc_type/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
