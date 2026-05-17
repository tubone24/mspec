// @mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-011, FR-014
// Change: spec-grep

import { basename, dirname, relative } from 'node:path';
import { readFileSync } from 'node:fs';
import { collectSotSpecs } from '../lib/spec-linter.js';
import { parseMd, sectionsByDepth } from '../parser/markdown.js';
import { projectPaths } from '../workflow/paths.js';

export interface SpecListRequirementsOptions {
  json?: boolean;
  cwd?: string;
}

const REQUIREMENT_RE = /^Requirement:\s+(FR-\d+)\s+[—-]\s+(.+)$/;

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

interface RequirementEntry {
  capability: string;
  fr_id: string;
  title: string;
}

function collectRequirements(specPaths: string[]): RequirementEntry[] {
  const entries: RequirementEntry[] = [];
  for (const specPath of specPaths) {
    const capability = basename(dirname(specPath));
    const source = readFileSync(specPath, 'utf8');
    const root = parseMd(source);
    const sections = sectionsByDepth(root, 3);
    for (const sec of sections) {
      const m = REQUIREMENT_RE.exec(sec.heading);
      if (!m) continue;
      entries.push({ capability, fr_id: m[1]!, title: m[2]!.trim() });
    }
  }
  return entries;
}

export async function specListRequirementsCommand(
  glob: string | undefined,
  opts: SpecListRequirementsOptions,
): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const paths = projectPaths(cwd);

  let specPaths = collectSotSpecs(paths.specsDir);

  if (glob && glob.length > 0) {
    const re = globSegmentToRegExp(glob);
    specPaths = specPaths.filter((p) => re.test(basename(dirname(p))));
  }

  const entries = collectRequirements(specPaths);

  if (opts.json) {
    const payload = {
      command: 'list-requirements',
      results: entries,
      meta: { specsDir: relative(cwd, paths.specsDir) || 'specs', count: entries.length },
    };
    console.log(JSON.stringify(payload, null, 2));
  } else {
    const byCapability = new Map<string, RequirementEntry[]>();
    for (const e of entries) {
      if (!byCapability.has(e.capability)) byCapability.set(e.capability, []);
      byCapability.get(e.capability)!.push(e);
    }
    for (const [cap, reqs] of byCapability) {
      console.log(`## ${cap}`);
      for (const r of reqs) {
        console.log(`  ${r.fr_id}  ${r.title}`);
      }
    }
  }
}
