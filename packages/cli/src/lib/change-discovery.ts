import { stat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectPaths } from '../workflow/paths.js';

export interface ChangeLocation {
  name: string;
  dir: string;
  isArchived: boolean;
}

export async function findChange(
  paths: ProjectPaths,
  name: string,
): Promise<ChangeLocation | null> {
  const live = join(paths.changesDir, name);
  if (await dirExists(live)) {
    return { name, dir: live, isArchived: false };
  }
  const archived = join(paths.changesArchiveDir, name);
  if (await dirExists(archived)) {
    return { name, dir: archived, isArchived: true };
  }
  return null;
}

export async function listChanges(
  paths: ProjectPaths,
  opts: { includeArchived?: boolean } = {},
): Promise<ChangeLocation[]> {
  const out: ChangeLocation[] = [];
  if (await dirExists(paths.changesDir)) {
    for (const entry of await readdir(paths.changesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'archive') continue;
      out.push({
        name: entry.name,
        dir: join(paths.changesDir, entry.name),
        isArchived: false,
      });
    }
  }
  if (opts.includeArchived && (await dirExists(paths.changesArchiveDir))) {
    for (const entry of await readdir(paths.changesArchiveDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      out.push({
        name: entry.name,
        dir: join(paths.changesArchiveDir, entry.name),
        isArchived: true,
      });
    }
  }
  return out;
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

export async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Resolve a `produces` entry which may be a glob like `specs/*\/spec.md`.
 * Returns absolute paths of matching files inside the change directory.
 */
export async function resolveProduces(
  changeDir: string,
  pattern: string,
): Promise<string[]> {
  if (pattern.includes('*')) {
    // Glob pattern: specs/*/spec.md → enumerate subdirs of specs/
    const parts = pattern.split('/');
    const starIdx = parts.findIndex((p) => p.includes('*'));
    if (starIdx < 0) return [];
    const prefix = parts.slice(0, starIdx).join('/');
    const suffix = parts.slice(starIdx + 1).join('/');
    const baseDir = join(changeDir, prefix);
    if (!(await dirExists(baseDir))) return [];
    const entries = await readdir(baseDir, { withFileTypes: true });
    const results: string[] = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const candidate = suffix ? join(baseDir, e.name, suffix) : join(baseDir, e.name);
      if (await fileExists(candidate)) results.push(candidate);
    }
    return results;
  }
  const abs = join(changeDir, pattern);
  return (await fileExists(abs)) ? [abs] : [];
}
