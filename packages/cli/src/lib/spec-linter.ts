import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import {
  DEFAULT_FORBIDDEN_RULES,
  type ForbiddenCategory,
  type ForbiddenRule,
} from './spec-forbidden.js';
import { blankOutHtmlComments, blankOutFences } from './text-mask.js';

/**
 * A single lint violation produced by the SoT-spec linter.
 */
export interface LintViolation {
  /** Path of the offending file (typically project-relative). */
  file: string;
  /** 1-indexed line number. */
  line: number;
  /** 1-indexed column where the match starts. */
  column: number;
  ruleId: string;
  category: ForbiddenCategory;
  /** Substring that triggered the rule. */
  matched: string;
  hint: string;
  /** Full original line text (without trailing newline). */
  lineText: string;
}

export interface LintOptions {
  /** Override the rule set. Defaults to {@link DEFAULT_FORBIDDEN_RULES}. */
  rules?: ForbiddenRule[];
  /**
   * If true (default), text inside HTML comments (`<!-- ... -->`) is ignored.
   * This protects mspec's own header comments from being flagged.
   */
  ignoreCommentBlocks?: boolean;
  /**
   * If true (default), text inside fenced code blocks (` ``` ... ``` `) is
   * ignored. Example code in a spec MAY legitimately contain implementation
   * details.
   */
  ignoreCodeFences?: boolean;
}

/**
 * Lint markdown content for forbidden vocabulary. Skips HTML comments and
 * fenced code blocks by default. Returns one violation per match, in
 * file order; multiple matches per line are reported individually.
 */
export function lintSpecContent(
  content: string,
  filePath: string,
  opts: LintOptions = {},
): LintViolation[] {
  const rules = opts.rules ?? DEFAULT_FORBIDDEN_RULES;
  const ignoreComments = opts.ignoreCommentBlocks ?? true;
  const ignoreFences = opts.ignoreCodeFences ?? true;

  // Strip ignored regions by replacing them with whitespace of the same
  // length. Preserving offsets keeps line/column reporting accurate against
  // the original `content`.
  let scrubbed = content;
  if (ignoreComments) scrubbed = blankOutHtmlComments(scrubbed);
  if (ignoreFences) scrubbed = blankOutFences(scrubbed);

  const violations: LintViolation[] = [];
  const lines = scrubbed.split('\n');
  const originalLines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const scrubbedLine = lines[i] ?? '';
    const originalLine = originalLines[i] ?? '';
    if (scrubbedLine.length === 0) continue;

    for (const rule of rules) {
      const re = withFlags(rule.pattern, 'g');
      for (const match of scrubbedLine.matchAll(re)) {
        const idx = match.index ?? 0;
        violations.push({
          file: filePath,
          line: i + 1,
          column: idx + 1,
          ruleId: rule.id,
          category: rule.category,
          matched: match[0],
          hint: rule.hint,
          lineText: originalLine,
        });
      }
    }
  }

  // Stable order: by line, then column, then ruleId.
  violations.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    if (a.column !== b.column) return a.column - b.column;
    return a.ruleId.localeCompare(b.ruleId);
  });

  return violations;
}

/**
 * Lint a single spec file from disk.
 */
export function lintSpecFile(filePath: string, opts: LintOptions = {}): LintViolation[] {
  const contents = readFileSync(filePath, 'utf8');
  return lintSpecContent(contents, filePath, opts);
}

/**
 * Lint every Source-of-Truth spec under `<repoRoot>/specs/<capability>/spec.md`.
 * Skips the `specs/archive/` directory if present. File paths in the result
 * are repo-relative.
 */
export function lintSotSpecs(repoRoot: string, opts: LintOptions = {}): LintViolation[] {
  const specsDir = join(repoRoot, 'specs');
  const files = collectSotSpecs(specsDir);
  const all: LintViolation[] = [];
  for (const abs of files) {
    const rel = relative(repoRoot, abs).split(sep).join('/');
    const contents = readFileSync(abs, 'utf8');
    all.push(...lintSpecContent(contents, rel, opts));
  }
  return all;
}

/**
 * Collect `specs/<capability>/spec.md` files under `specsDir`. Returns
 * absolute paths. Returns an empty array when `specsDir` does not exist.
 */
export function collectSotSpecs(specsDir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(specsDir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const name of entries.sort()) {
    if (name === 'archive') continue;
    const capDir = join(specsDir, name);
    let s;
    try {
      s = statSync(capDir);
    } catch {
      continue;
    }
    if (!s.isDirectory()) continue;
    const candidate = join(capDir, 'spec.md');
    try {
      const sp = statSync(candidate);
      if (sp.isFile()) out.push(candidate);
    } catch {
      // missing spec.md is not an error here; lint of "no files" is valid.
    }
  }
  return out;
}

/**
 * Return capability names (directory names) for all capabilities that have
 * a `spec.md` file under `specsDir`. Names are alphabetically sorted
 * (inherits the sort from `collectSotSpecs`). Synchronous.
 */
export function listCapabilityNames(specsDir: string): string[] {
  return collectSotSpecs(specsDir).map((p) => basename(dirname(p)));
}

/**
 * Return a copy of `re` with the requested flags merged in. The source
 * RegExp may have any flag combination; we always ensure `g` is present for
 * `matchAll` and preserve original `i`/`m`/`s`/`u` flags.
 */
function withFlags(re: RegExp, extra: string): RegExp {
  const merged = new Set((re.flags + extra).split(''));
  return new RegExp(re.source, [...merged].join(''));
}
