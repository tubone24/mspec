import { describe, it, expect } from 'vitest';
import { lintSpecContent } from './spec-linter.js';
import { DEFAULT_FORBIDDEN_RULES } from './spec-forbidden.js';

const FAKE_PATH = 'specs/cli-archive/spec.md';

describe('lintSpecContent', () => {
  it('detects the canonical `git mv` violation', () => {
    const v = lintSpecContent(
      '- THEN the system MUST move the directory using `git mv` (preserving the name verbatim).\n',
      FAKE_PATH,
    );
    expect(v).toHaveLength(1);
    expect(v[0]!.ruleId).toBe('shell-git-mv');
    expect(v[0]!.category).toBe('shell-command');
    expect(v[0]!.matched.toLowerCase()).toBe('git mv');
    expect(v[0]!.line).toBe(1);
    expect(v[0]!.hint).toMatch(/behaviour/i);
  });

  it('ignores forbidden vocabulary inside HTML comments', () => {
    const src = [
      '<!-- mspec: example using `git mv` is documentation only -->',
      'The system renames the directory.',
      '',
    ].join('\n');
    const v = lintSpecContent(src, FAKE_PATH);
    expect(v).toEqual([]);
  });

  it('ignores forbidden vocabulary inside fenced code blocks', () => {
    const src = [
      '```bash',
      'git mv changes/foo changes/archive/foo',
      '```',
      '',
      'The system renames the directory verbatim.',
      '',
    ].join('\n');
    const v = lintSpecContent(src, FAKE_PATH);
    expect(v).toEqual([]);
  });

  it('reports multiple violations on the same line', () => {
    const src = 'The system uses `git mv` and then `rm -rf` on the source.\n';
    const v = lintSpecContent(src, FAKE_PATH);
    const ids = v.map((x) => x.ruleId).sort();
    expect(ids).toContain('shell-git-mv');
    expect(ids).toContain('shell-rm-rf');
    expect(v.every((x) => x.line === 1)).toBe(true);
  });

  it('reports the correct column (1-indexed) of the match', () => {
    const src = 'Then we run `git mv` on the path.\n';
    const v = lintSpecContent(src, FAKE_PATH);
    expect(v).toHaveLength(1);
    // "git mv" begins at character index 13 → column 14 (1-indexed).
    expect(v[0]!.column).toBe(14);
  });

  it('catches a library-name violation', () => {
    const v = lintSpecContent(
      'The command is parsed with commander before dispatch.\n',
      FAKE_PATH,
    );
    expect(v.map((x) => x.ruleId)).toContain('lib-commander');
  });

  it('catches an impl-verb violation', () => {
    const v = lintSpecContent(
      'The status step calls renderTable() when ready.\n',
      FAKE_PATH,
    );
    expect(v.map((x) => x.ruleId)).toContain('verb-calls');
  });

  it('does not flag YAML used as a format name or filename', () => {
    const v = lintSpecContent(
      'The workflow YAML file `.mspec/workflow.yaml` declares step dependencies.\n',
      FAKE_PATH,
    );
    expect(v.map((x) => x.ruleId)).not.toContain('lib-yaml');
  });

  it('flags the js-yaml library identifier', () => {
    const v = lintSpecContent(
      'The schema is validated by js-yaml at load time.\n',
      FAKE_PATH,
    );
    expect(v.map((x) => x.ruleId)).toContain('lib-yaml');
  });

  it('supports the --allow ruleId workflow via rules filter', () => {
    const filtered = DEFAULT_FORBIDDEN_RULES.filter(
      (r) => r.id !== 'shell-git-mv',
    );
    const v = lintSpecContent('Move via `git mv` here.\n', FAKE_PATH, {
      rules: filtered,
    });
    expect(v.map((x) => x.ruleId)).not.toContain('shell-git-mv');
  });

  it('respects ignoreCommentBlocks=false when explicitly disabled', () => {
    const v = lintSpecContent('<!-- uses `git mv` -->\n', FAKE_PATH, {
      ignoreCommentBlocks: false,
    });
    expect(v.map((x) => x.ruleId)).toContain('shell-git-mv');
  });

  it('respects ignoreCodeFences=false when explicitly disabled', () => {
    const src = ['```bash', 'git mv a b', '```', ''].join('\n');
    const v = lintSpecContent(src, FAKE_PATH, { ignoreCodeFences: false });
    expect(v.map((x) => x.ruleId)).toContain('shell-git-mv');
  });
});
