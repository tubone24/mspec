/**
 * Forbidden-vocabulary dictionary for Source-of-Truth specs.
 *
 * SoT specs (`specs/<capability>/spec.md`) describe behaviour (BDD). They MUST
 * NOT leak implementation choices: shell commands, library names, or
 * code-level verbs. This dictionary feeds `mspec spec lint`, a deterministic
 * regex linter that prevents drift between design rules and what gets written.
 *
 * Each rule provides a hint explaining WHY the term is forbidden and offering
 * a behaviour-level replacement so authors (LLM or human) can self-correct.
 */

export type ForbiddenCategory = 'shell-command' | 'library-name' | 'impl-verb';

export interface ForbiddenRule {
  /** Stable rule id (kebab-case). Used by `--allow <id>` to suppress. */
  id: string;
  category: ForbiddenCategory;
  /**
   * Case-insensitive regex. Implementation should not rely on the global flag
   * because the linter normalises matching via `matchAll` with a freshly
   * sourced RegExp.
   */
  pattern: RegExp;
  /** One-sentence English hint: why it's forbidden + a behaviour-level wording. */
  hint: string;
}

/**
 * Default forbidden vocabulary. Authors of `specs/<capability>/spec.md` MUST
 * rephrase any matched term into behaviour-level wording.
 */
export const DEFAULT_FORBIDDEN_RULES: ForbiddenRule[] = [
  // ─── shell-command ────────────────────────────────────────────────────────
  {
    id: 'shell-git-mv',
    category: 'shell-command',
    pattern: /\bgit\s+mv\b/i,
    hint: 'SoT specs describe behaviour, not commands; use wording like "rename the directory verbatim (filesystem-level move)" instead of "git mv".',
  },
  {
    id: 'shell-git-add',
    category: 'shell-command',
    pattern: /\bgit\s+add\b/i,
    hint: 'Avoid naming `git add`; describe the observable outcome (e.g. "stage the resulting files for the next commit") instead.',
  },
  {
    id: 'shell-git-commit',
    category: 'shell-command',
    pattern: /\bgit\s+commit\b/i,
    hint: 'Avoid `git commit` in specs; describe the outcome (e.g. "record the change as a new revision") rather than the command.',
  },
  {
    id: 'shell-git-push',
    category: 'shell-command',
    pattern: /\bgit\s+push\b/i,
    hint: 'Avoid `git push`; describe the behaviour (e.g. "publish the change to the remote repository") instead.',
  },
  {
    id: 'shell-rm-rf',
    category: 'shell-command',
    pattern: /\brm\s+-rf\b/i,
    hint: '`rm -rf` is an implementation detail; describe the result (e.g. "remove the directory and its contents").',
  },
  {
    id: 'node-fs-rename',
    category: 'shell-command',
    pattern: /\bfs\.rename\b/i,
    hint: '`fs.rename` is an implementation API; describe the behaviour (e.g. "rename the file") instead of naming the call.',
  },
  {
    id: 'node-fs-copyfile',
    category: 'shell-command',
    pattern: /\bfs\.copyFile\b/i,
    hint: '`fs.copyFile` is an implementation API; describe the behaviour (e.g. "copy the file to the destination") instead of naming the call.',
  },
  {
    id: 'node-spawn',
    category: 'shell-command',
    pattern: /\bspawn\s*\(/i,
    hint: '`spawn(...)` is an implementation API; describe the effect (e.g. "execute the configured test command") instead of naming the call.',
  },
  {
    id: 'node-exec',
    category: 'shell-command',
    pattern: /\bchild_process\b|\bexec\s*\(/i,
    hint: '`child_process` / `exec(...)` are implementation APIs; describe the observable behaviour (e.g. "run the configured command") instead.',
  },
  {
    id: 'web-fetch',
    category: 'shell-command',
    pattern: /\bfetch\s*\(/i,
    hint: '`fetch(...)` is an implementation API; describe the network behaviour (e.g. "issue a request to the endpoint") instead.',
  },
  {
    id: 'web-axios',
    category: 'shell-command',
    pattern: /\baxios\./i,
    hint: '`axios.*` is a library-specific API; describe the network behaviour (e.g. "issue an HTTP request") instead.',
  },

  // ─── library-name ─────────────────────────────────────────────────────────
  {
    id: 'lib-commander',
    category: 'library-name',
    pattern: /\bcommander\b/i,
    hint: 'Do not name the `commander` library; describe the role instead (e.g. "the CLI argument parser").',
  },
  {
    id: 'lib-yaml',
    category: 'library-name',
    // Only flag the library identifier `js-yaml`. Bare "yaml" / "YAML" is the
    // format name and is used adjectivally throughout legitimate prose
    // ("YAML file", "workflow.yaml", "the YAML schema"); over-matching there
    // would create more noise than the rule's drift-prevention value.
    pattern: /\bjs-yaml\b/i,
    hint: 'Do not name the `js-yaml` library; describe the role (e.g. "the YAML loader" or "the workflow schema parser") instead.',
  },
  {
    id: 'lib-remark',
    category: 'library-name',
    pattern: /\bremark\b/i,
    hint: 'Do not name the `remark` library; describe the role (e.g. "the Markdown parser") instead.',
  },
  {
    id: 'lib-zod',
    category: 'library-name',
    pattern: /\bzod\b/i,
    hint: 'Do not name the `zod` library; describe the role (e.g. "the schema validator") instead.',
  },
  {
    id: 'lib-vitest',
    category: 'library-name',
    pattern: /\bvitest\b/i,
    hint: 'Do not name the `vitest` library; describe the role (e.g. "the test runner") instead.',
  },
  {
    id: 'lib-jest',
    category: 'library-name',
    pattern: /\bjest\b/i,
    hint: 'Do not name the `jest` library; describe the role (e.g. "the test runner") instead.',
  },
  {
    id: 'lib-tsup',
    category: 'library-name',
    pattern: /\btsup\b/i,
    hint: 'Do not name the `tsup` bundler; describe the role (e.g. "the build tool") instead.',
  },
  {
    id: 'lib-chalk',
    category: 'library-name',
    pattern: /\bchalk\b/i,
    hint: 'Do not name the `chalk` library; describe the role (e.g. "the terminal colouriser") instead.',
  },
  {
    id: 'lib-picocolors',
    category: 'library-name',
    pattern: /\bpicocolors\b/i,
    hint: 'Do not name the `picocolors` library; describe the role (e.g. "the terminal colouriser") instead.',
  },
  {
    id: 'lib-minisearch',
    category: 'library-name',
    pattern: /\bminisearch\b/i,
    hint: 'Do not name the `minisearch` library; describe the role (e.g. "the in-memory full-text index") instead.',
  },

  // ─── impl-verb ────────────────────────────────────────────────────────────
  {
    id: 'verb-calls',
    category: 'impl-verb',
    pattern: /\bcalls\s+\w+\(/i,
    hint: 'Avoid "calls `foo()`"; describe the resulting behaviour (e.g. "produces ...", "results in ...") rather than the function invocation.',
  },
  {
    id: 'verb-invokes-fn',
    category: 'impl-verb',
    pattern: /\binvokes\s+\w+\(/i,
    hint: 'Avoid "invokes `foo()`"; describe the resulting behaviour (e.g. "the search step runs", "results in ...") rather than the function call.',
  },
  {
    id: 'verb-imports',
    category: 'impl-verb',
    pattern: /\bimports?\s+(?:from\s+)?["']/i,
    hint: 'Avoid describing imports in specs; describe the capability dependency (e.g. "depends on the workflow schema") rather than a code-level import.',
  },
  {
    id: 'verb-uses-library',
    category: 'impl-verb',
    pattern: /\buses\s+(?:the\s+)?\S+\s+library\b/i,
    hint: 'Avoid "uses the X library"; name the role (e.g. "uses a Markdown parser") rather than the specific library.',
  },
  {
    id: 'verb-via-library',
    category: 'impl-verb',
    pattern: /\bvia\s+(?:the\s+)?\S+\s+library\b/i,
    hint: 'Avoid "via the X library"; name the role (e.g. "via a Markdown parser") rather than the specific library.',
  },
];
