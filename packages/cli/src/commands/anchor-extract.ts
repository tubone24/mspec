import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { projectPaths } from '../workflow/paths.js';
import { scanAnchors } from '../lib/anchor-scanner.js';
import { findChange, fileExists } from '../lib/change-discovery.js';
import { parseDeltaSpec } from '../parser/delta-spec.js';

export interface AnchorExtractOptions {
  json?: boolean;
}

export interface ExtractedAnchor {
  change_dir: string;
  capability: string;
  delta_spec_path: string;
  requirements: string[];
  change: string;
  source_file: string;
  source_line: number;
  exists: boolean;
  is_archived: boolean;
  spec_excerpts: Record<string, string>;
}

export async function anchorExtractCommand(
  changeName: string,
  opts: AnchorExtractOptions,
): Promise<void> {
  const paths = projectPaths(process.cwd());
  const { anchors } = await scanAnchors(paths.root);
  const target = anchors.filter((a) => a.change_dir === changeName);
  const out: ExtractedAnchor[] = [];

  for (const a of target) {
    const change = await findChange(paths, a.change_dir);
    if (!change) {
      out.push({
        change_dir: a.change_dir,
        capability: a.capability,
        delta_spec_path: a.delta_spec_path,
        requirements: a.requirements,
        change: a.change,
        source_file: a.source_file,
        source_line: a.source_line,
        exists: false,
        is_archived: false,
        spec_excerpts: {},
      });
      continue;
    }

    const deltaPath = join(change.dir, 'specs', a.capability, 'spec.md');
    if (!(await fileExists(deltaPath))) {
      out.push({
        change_dir: a.change_dir,
        capability: a.capability,
        delta_spec_path: a.delta_spec_path,
        requirements: a.requirements,
        change: a.change,
        source_file: a.source_file,
        source_line: a.source_line,
        exists: false,
        is_archived: change.isArchived,
        spec_excerpts: {},
      });
      continue;
    }

    const raw = await readFile(deltaPath, 'utf8');
    const { spec } = parseDeltaSpec(raw, a.capability);
    const all = [...spec.added, ...spec.modified, ...spec.removed, ...spec.renamed];
    const excerpts: Record<string, string> = {};
    for (const fr of a.requirements) {
      const req = all.find((r) => r.fr_id === fr);
      if (req) excerpts[fr] = req.raw_block.trim();
    }

    out.push({
      change_dir: a.change_dir,
      capability: a.capability,
      delta_spec_path: a.delta_spec_path,
      requirements: a.requirements,
      change: a.change,
      source_file: a.source_file,
      source_line: a.source_line,
      exists: true,
      is_archived: change.isArchived,
      spec_excerpts: excerpts,
    });
  }

  if (opts.json) {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return;
  }
  for (const x of out) {
    console.log(`${x.source_file}:${x.source_line}`);
    console.log(`  → ${x.delta_spec_path} (${x.is_archived ? 'archived' : 'live'})`);
    for (const fr of x.requirements) {
      const excerpt = x.spec_excerpts[fr];
      console.log(`  ${fr}: ${excerpt ? excerpt.split('\n')[0] : '(not found)'}`);
    }
    console.log();
  }
}
