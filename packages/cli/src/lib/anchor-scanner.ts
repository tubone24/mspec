import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parseAnchorsFromFile, type ParsedAnchor } from '../parser/anchor.js';

const DEFAULT_IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.mspec',
]);

const TEXT_EXT_RE = /\.(ts|tsx|js|jsx|mjs|cjs|py|rs|go|rb|java|kt|swift|c|h|cpp|hpp|cs|md|sh)$/i;

// Matches SoT spec paths:  specs/<capability>/spec.md  (archive included)
const SOT_SPEC_RE = /(?:^|\/)specs\/[^/]+\/spec\.md$/;
// Matches Delta Spec paths: changes/<change-dir>/specs/<capability>/spec.md
const DELTA_SPEC_RE = /(?:^|\/)changes\/[^/]+\/specs\/[^/]+\/spec\.md$/;
// Matches template files: packages/cli/templates/**  (or any templates/ subtree)
const TEMPLATES_RE = /(?:^|\/)templates\//;

function isExcludedPath(relPath: string): boolean {
  return SOT_SPEC_RE.test(relPath) || DELTA_SPEC_RE.test(relPath) || TEMPLATES_RE.test(relPath);
}

export interface ScanResult {
  anchors: ParsedAnchor[];
  warnings: string[];
}

export async function scanAnchors(rootDir: string): Promise<ScanResult> {
  const anchors: ParsedAnchor[] = [];
  const warnings: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (DEFAULT_IGNORE.has(entry.name)) continue;
      const abs = join(dir, entry.name);
      const relPath = relative(rootDir, abs);
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile() && TEXT_EXT_RE.test(entry.name)) {
        if (isExcludedPath(relPath)) continue;
        try {
          const s = await stat(abs);
          if (s.size > 256 * 1024) continue; // skip huge files (>256KB)
          const { anchors: a, warnings: w } = await parseAnchorsFromFile(abs);
          for (const x of a) anchors.push({ ...x, source_file: relPath });
          warnings.push(...w);
        } catch {
          // ignore unreadable files
        }
      }
    }
  }

  await walk(rootDir);
  return { anchors, warnings };
}
