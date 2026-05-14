import { readdirSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import pc from 'picocolors';
import { DEFAULT_FORBIDDEN_RULES } from '../lib/spec-forbidden.js';
import {
  collectSotSpecs,
  lintSpecContent,
  type LintViolation,
} from '../lib/spec-linter.js';
import { readFileSync } from 'node:fs';

export interface SpecLintOptions {
  json?: boolean;
  allow?: string[];
  /** Override cwd (for testing). */
  cwd?: string;
}

const DEFAULT_GLOB = 'specs/*/spec.md';

export async function specLintCommand(
  glob: string | undefined,
  opts: SpecLintOptions,
): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const pattern = glob && glob.length > 0 ? glob : DEFAULT_GLOB;
  const allow = new Set(opts.allow ?? []);

  const rules = DEFAULT_FORBIDDEN_RULES.filter((r) => !allow.has(r.id));

  // Resolve files matching the (very small) glob grammar we support.
  const files = resolveFiles(cwd, pattern);

  const violations: LintViolation[] = [];
  for (const abs of files) {
    const rel = relative(cwd, abs).split(sep).join('/');
    const contents = readFileSync(abs, 'utf8');
    violations.push(...lintSpecContent(contents, rel, { rules }));
  }

  const fileCount = new Set(violations.map((v) => v.file)).size;

  if (opts.json) {
    const payload = {
      violations,
      summary: { files: fileCount, violations: violations.length },
    };
    console.log(JSON.stringify(payload, null, 2));
  } else {
    for (const v of violations) {
      console.log(
        `${pc.cyan(v.file)}:${pc.yellow(String(v.line))}:${pc.yellow(String(v.column))} ${pc.red('[' + v.ruleId + ']')} ${pc.bold(v.matched)} — ${v.hint}`,
      );
    }
    if (violations.length === 0) {
      console.log(`${pc.green('✓')} 0 violations across ${files.length} file(s)`);
    } else {
      console.log();
      console.log(
        `${pc.red('✗')} ${violations.length} violation(s) across ${fileCount} file(s)`,
      );
    }
  }

  if (violations.length > 0) {
    process.exitCode = 1;
  }
}

/**
 * Tiny glob resolver supporting only the patterns mspec needs:
 *
 *   - Literal paths (`specs/cli-archive/spec.md`)
 *   - One `*` segment matching a single directory name
 *     (`specs/*\/spec.md`, `specs/cli-*\/spec.md`)
 *
 * Multi-segment globstars (`**`) are intentionally not supported; SoT specs
 * live exactly one capability directory deep.
 */
function resolveFiles(cwd: string, pattern: string): string[] {
  // Normalise.
  const norm = pattern.replace(/\\/g, '/');

  // Absolute pattern? Use as-is; otherwise root at cwd.
  const isAbs = isAbsolute(norm);
  const segments = norm.split('/').filter((s) => s.length > 0);

  let candidates: string[] = [isAbs ? '/' : cwd];

  for (const seg of segments) {
    const next: string[] = [];
    const hasStar = seg.includes('*');
    for (const base of candidates) {
      if (!hasStar) {
        next.push(join(base, seg));
        continue;
      }
      const re = globSegmentToRegExp(seg);
      let entries: string[];
      try {
        entries = readdirSync(base);
      } catch {
        continue;
      }
      for (const name of entries.sort()) {
        if (!re.test(name)) continue;
        next.push(join(base, name));
      }
    }
    candidates = next;
  }

  // Keep only existing regular files. (Directories matched mid-pattern were
  // already filtered by `readdirSync`-driven expansion above.)
  const files: string[] = [];
  for (const c of candidates) {
    try {
      const s = statSync(c);
      if (s.isFile()) files.push(resolve(c));
    } catch {
      // ignore missing matches
    }
  }
  // If the pattern was an entire directory (e.g. `specs`), fall back to the
  // SoT collector. This keeps a friendly UX when callers pass `specs/`.
  if (files.length === 0 && segments.length === 1) {
    return collectSotSpecs(join(cwd, segments[0]!));
  }
  return files;
}

function globSegmentToRegExp(seg: string): RegExp {
  let src = '^';
  for (const ch of seg) {
    if (ch === '*') src += '[^/]*';
    else if (/[a-zA-Z0-9_-]/.test(ch)) src += ch;
    else src += '\\' + ch;
  }
  src += '$';
  return new RegExp(src);
}
