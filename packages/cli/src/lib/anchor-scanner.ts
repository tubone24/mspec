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
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile() && TEXT_EXT_RE.test(entry.name)) {
        try {
          const s = await stat(abs);
          if (s.size > 256 * 1024) continue; // skip huge files (>256KB)
          const { anchors: a, warnings: w } = await parseAnchorsFromFile(abs);
          const relPath = relative(rootDir, abs);
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
