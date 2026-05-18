#!/usr/bin/env node
// One-shot: for each pair (`.claude/<sub>/<file>`, `packages/cli/templates/claude/<sub>/<file>`),
// union the anchor blocks they each contain, and write the unioned set back to
// BOTH files so they become byte-identical. Idempotent.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const PAIRS = [
  ['.claude/commands', 'packages/cli/templates/claude/commands'],
  ['.claude/skills', 'packages/cli/templates/claude/skills'],
  ['.claude/agents', 'packages/cli/templates/claude/agents'],
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

function splitParts(src) {
  // Same canonical layout we previously normalized to:
  //   ---\n<frontmatter>\n---\n\n<anchorLines>\n\n<body>
  const lines = src.split('\n');
  let fmStart = -1;
  let fmEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (fmStart === -1) fmStart = i;
      else {
        fmEnd = i;
        break;
      }
    }
  }
  const frontmatter =
    fmStart !== -1 && fmEnd !== -1 ? lines.slice(fmStart, fmEnd + 1).join('\n') : null;
  const rest = frontmatter ? lines.slice(fmEnd + 1).join('\n') : src;
  const anchors = rest.match(ANCHOR_LINE_RE) ?? [];
  const body = rest.replace(ANCHOR_LINE_RE, '').replace(/\r?\n{3,}/g, '\n\n').trim();
  return { frontmatter, anchors, body };
}

function unionAnchors(a, b) {
  const seen = new Set();
  const out = [];
  for (const line of [...a, ...b]) {
    const key = line.trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(line.trim());
    }
  }
  return out;
}

function groupAnchorTriples(anchors) {
  // Re-emit anchors as 3-line blocks separated by blank lines so the output
  // stays readable when multiple changes have touched the file.
  const blocks = [];
  let i = 0;
  while (i < anchors.length) {
    const block = anchors.slice(i, i + 3);
    blocks.push(block.join('\n'));
    i += 3;
  }
  return blocks.join('\n\n');
}

function compose({ frontmatter, anchors, body }) {
  const parts = [];
  if (frontmatter) parts.push(frontmatter);
  if (anchors.length > 0) parts.push(groupAnchorTriples(anchors));
  if (body) parts.push(body);
  return parts.join('\n\n') + '\n';
}

async function syncPair(runtimeDir, templatesDir) {
  const runtimeAbs = join(repoRoot, runtimeDir);
  const templatesAbs = join(repoRoot, templatesDir);
  const runtimeFiles = await walk(runtimeAbs);
  let changed = 0;
  for (const rf of runtimeFiles) {
    const rel = relative(runtimeAbs, rf);
    const tf = join(templatesAbs, rel);
    let runtimeRaw;
    let templateRaw;
    try {
      runtimeRaw = await readFile(rf, 'utf8');
      templateRaw = await readFile(tf, 'utf8');
    } catch {
      continue; // pair missing — skip silently
    }
    const r = splitParts(runtimeRaw);
    const t = splitParts(templateRaw);
    // Frontmatter: prefer the one with more keys (proxy: longer text).
    const frontmatter =
      (r.frontmatter ?? '').length >= (t.frontmatter ?? '').length
        ? r.frontmatter
        : t.frontmatter;
    // Anchors: union, preserving runtime order first then templates additions.
    const anchors = unionAnchors(r.anchors, t.anchors);
    // Body: pick the longer one (assumes most-recent edit lives there).
    const body = r.body.length >= t.body.length ? r.body : t.body;
    const next = compose({ frontmatter, anchors, body });
    if (next !== runtimeRaw) {
      await writeFile(rf, next, 'utf8');
      changed++;
      console.log(`  ~ ${relative(repoRoot, rf)}`);
    }
    if (next !== templateRaw) {
      await writeFile(tf, next, 'utf8');
      changed++;
      console.log(`  ~ ${relative(repoRoot, tf)}`);
    }
  }
  return changed;
}

async function main() {
  let total = 0;
  for (const [runtimeDir, templatesDir] of PAIRS) {
    total += await syncPair(runtimeDir, templatesDir);
  }
  console.log(`\nSynced ${total} file write(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
