#!/usr/bin/env node
// One-shot normalizer: rewrites `.claude/**.md` so that every file follows
// canonical layout — `frontmatter -> blank line -> anchor block -> blank line -> body`.
// Targets templates AND runtime copies in the repo. Idempotent.

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const TARGET_ROOTS = [
  join(repoRoot, 'packages/cli/templates/claude/commands'),
  join(repoRoot, 'packages/cli/templates/claude/skills'),
  join(repoRoot, '.claude/commands'),
  join(repoRoot, '.claude/skills'),
];

const ANCHOR_LINE_RE =
  /<!--\s*(?:@mspec-delta\s+.+?|Requirements implemented:.+?|Change:.+?)\s*-->/g;

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (e.isFile() && e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function extractFrontmatter(src) {
  // We accept a stray fragment such as "...stuff---\ndescription:..." OR a
  // valid `---\n...\n---` block at the top. Return {frontmatter, rest}.
  // Strategy: find the FIRST `---` followed later by another `---` on its
  // own line. Capture everything between as frontmatter body, and everything
  // OUTSIDE (before first `---` and after second `---`) as non-frontmatter.
  const lines = src.split('\n');
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---' || lines[i].trim().startsWith('---<')) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return { frontmatter: null, rest: src };
  let endIdx = -1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---' || lines[i].trim().startsWith('---<')) {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) return { frontmatter: null, rest: src };
  // Frontmatter body is lines between markers (exclusive).
  const fmBody = lines.slice(startIdx + 1, endIdx).join('\n');
  // Re-emit canonical frontmatter.
  const frontmatter = `---\n${fmBody}\n---`;
  // Collect everything outside as `rest`, joining with newlines but stripping
  // the marker lines themselves. We also pull any stray content fused to the
  // marker lines (e.g. `---<!-- ... -->`).
  const before = lines.slice(0, startIdx).join('\n');
  const startTail = lines[startIdx].trim().replace(/^---/, '').trim();
  const endTail = lines[endIdx].trim().replace(/^---/, '').trim();
  const after = lines.slice(endIdx + 1).join('\n');
  const rest = [before, startTail, endTail, after].filter(Boolean).join('\n');
  return { frontmatter, rest };
}

function normalize(src) {
  const { frontmatter, rest } = extractFrontmatter(src);
  const target = rest ?? src;
  const anchors = target.match(ANCHOR_LINE_RE) ?? [];
  const body = target.replace(ANCHOR_LINE_RE, '').replace(/\r?\n{3,}/g, '\n\n').trim();
  const parts = [];
  if (frontmatter) parts.push(frontmatter);
  if (anchors.length > 0) parts.push(anchors.join('\n'));
  if (body) parts.push(body);
  return parts.join('\n\n') + '\n';
}

async function main() {
  let changed = 0;
  for (const root of TARGET_ROOTS) {
    const files = await walk(root);
    for (const f of files) {
      const raw = await readFile(f, 'utf8');
      const next = normalize(raw);
      if (next !== raw) {
        await writeFile(f, next, 'utf8');
        changed++;
        console.log(`  ~ ${f.replace(repoRoot + '/', '')}`);
      }
    }
  }
  console.log(`\nNormalized ${changed} file(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
