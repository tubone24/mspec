// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-005
// Change: revise-artifact-taxonomy

import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { newCommand } from '../../src/commands/new.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '../../templates/artifacts');

// FR-005: 新規 change の readme.md は Tutorial で末尾に Summary セクションを持つ
describe('FR-005: mspec new generates Tutorial readme with Summary placeholder', () => {
  it('readme.ja.md template has `## Summary (Lessons / Next Steps)` and placeholder comment', async () => {
    const content = await readFile(join(TEMPLATES_DIR, 'readme.ja.md'), 'utf8');
    expect(content).toContain('## Summary (Lessons / Next Steps)');
    expect(content).toContain('<!-- archive ステップで AI が生成 -->');
  });

  it('readme.en.md template has `## Summary (Lessons / Next Steps)` and placeholder comment', async () => {
    const content = await readFile(join(TEMPLATES_DIR, 'readme.en.md'), 'utf8');
    expect(content).toContain('## Summary (Lessons / Next Steps)');
    // en uses the en-locale placeholder wording
    expect(content).toMatch(/<!--\s*archive\s+step\s+will\s+auto-fill/);
  });

  it('mspec new <feature> generates readme.md whose end contains Summary section + placeholder', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mspec-new-readme-'));
    try {
      // Bootstrap minimal .mspec project
      await mkdir(join(root, '.mspec'), { recursive: true });
      await mkdir(join(root, 'changes'), { recursive: true });
      await writeFile(
        join(root, '.mspec', 'config.yaml'),
        ['version: 1', 'locale: "ja"'].join('\n'),
        'utf8',
      );
      await writeFile(
        join(root, '.mspec', 'workflow.yaml'),
        ['version: 1', 'name: x', 'steps: []'].join('\n'),
        'utf8',
      );

      await newCommand('summary-test', { cwd: root });

      // Find the generated change directory
      const { readdir } = await import('node:fs/promises');
      const entries = await readdir(join(root, 'changes'));
      const changeName = entries.find((e) => e.endsWith('-summary-test'));
      expect(changeName).toBeDefined();

      const readme = await readFile(
        join(root, 'changes', changeName as string, 'readme.md'),
        'utf8',
      );

      expect(readme).toContain('## Summary (Lessons / Next Steps)');
      // Placeholder comment for archive step to fill in (ja-locale wording)
      expect(readme).toContain('<!-- archive ステップで AI が生成 -->');

      // Summary section should be at the END of the file (no later H2 follows it)
      const summaryIdx = readme.indexOf('## Summary (Lessons / Next Steps)');
      const trailing = readme.slice(summaryIdx + '## Summary (Lessons / Next Steps)'.length);
      // No additional H2 heading after Summary
      expect(/^##\s+\S/m.test(trailing)).toBe(false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
