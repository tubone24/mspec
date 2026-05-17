// @mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-012, FR-014
// Change: spec-grep

import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import pc from 'picocolors';
import { collectSotSpecs } from '../lib/spec-linter.js';
import { listChanges } from '../lib/change-discovery.js';
import { parseMd, sectionsByDepth, sliceSource } from '../parser/markdown.js';
import { projectPaths } from '../workflow/paths.js';

export interface SpecGrepOptions {
  json?: boolean;
  cwd?: string;
}

const FR_ID_RE = /^FR-\d{1,4}$/i;

interface GrepHit {
  fr_id: string;
  file: string;
  block: string;
}

function searchSpecFile(
  specPath: string,
  targetId: string,
  cwd: string,
): GrepHit[] {
  const source = readFileSync(specPath, 'utf8');
  const root = parseMd(source);
  const sections = sectionsByDepth(root, 3);
  const hits: GrepHit[] = [];
  const normalizedTarget = targetId.toUpperCase();
  for (const sec of sections) {
    const headingUpper = sec.heading.toUpperCase();
    if (!headingUpper.includes(normalizedTarget)) continue;
    const block = sliceSource(source, sec.startLine, sec.endLine);
    hits.push({
      fr_id: normalizedTarget,
      file: relative(cwd, specPath),
      block,
    });
  }
  return hits;
}

export async function specGrepCommand(
  frId: string,
  opts: SpecGrepOptions,
): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();

  if (!FR_ID_RE.test(frId)) {
    console.error(
      pc.red('Error:'),
      `Invalid FR-ID format: "${frId}". Expected FR-NNN (1-4 digits), e.g. FR-001`,
    );
    process.exitCode = 1;
    return;
  }

  const paths = projectPaths(cwd);
  const hits: GrepHit[] = [];

  // Search SoT specs
  const sotSpecs = collectSotSpecs(paths.specsDir);
  for (const specPath of sotSpecs.sort()) {
    hits.push(...searchSpecFile(specPath, frId, cwd));
  }

  // Search Delta Specs in changes/
  const changes = await listChanges(paths);
  const sortedChanges = changes.slice().sort((a, b) => a.name.localeCompare(b.name));
  for (const change of sortedChanges) {
    const deltaSpecsDir = join(change.dir, 'specs');
    const deltaSpecs = collectSotSpecs(deltaSpecsDir);
    for (const specPath of deltaSpecs.sort()) {
      hits.push(...searchSpecFile(specPath, frId, cwd));
    }
  }

  if (opts.json) {
    const payload = {
      command: 'spec-grep',
      results: hits,
      meta: { query: frId.toUpperCase(), count: hits.length },
    };
    console.log(JSON.stringify(payload, null, 2));
  } else {
    if (hits.length === 0) {
      console.log(`No results for ${frId.toUpperCase()}`);
      return;
    }
    for (const hit of hits) {
      console.log(`\n## ${hit.file}\n`);
      console.log(hit.block);
    }
  }
}
