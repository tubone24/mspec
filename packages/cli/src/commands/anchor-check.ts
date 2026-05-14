import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pc from 'picocolors';
import { projectPaths } from '../workflow/paths.js';
import { scanAnchors } from '../lib/anchor-scanner.js';
import { findChange, fileExists } from '../lib/change-discovery.js';
import { scanFrIdsFromContents } from '../lib/fr-numbering.js';

export interface AnchorCheckOptions {
  change?: string;
}

export async function anchorCheckCommand(opts: AnchorCheckOptions): Promise<void> {
  const paths = projectPaths(process.cwd());
  const { anchors, warnings } = await scanAnchors(paths.root);

  let errors = 0;
  for (const w of warnings) {
    console.log(`${pc.yellow('warn:')} ${w}`);
  }

  for (const a of anchors) {
    if (opts.change && a.change_dir !== opts.change) continue;

    const change = await findChange(paths, a.change_dir);
    if (!change) {
      errors++;
      console.log(`${pc.red('✗')} ${a.source_file}:${a.source_line} — change_dir "${a.change_dir}" not found`);
      continue;
    }

    const deltaPath = join(change.dir, 'specs', a.capability, 'spec.md');
    if (!(await fileExists(deltaPath))) {
      errors++;
      console.log(`${pc.red('✗')} ${a.source_file}:${a.source_line} — delta spec missing: ${deltaPath}`);
      continue;
    }

    const raw = await readFile(deltaPath, 'utf8');
    const { ids } = scanFrIdsFromContents(raw);
    const missing = a.requirements.filter((fr) => !ids.includes(fr));
    if (missing.length > 0) {
      errors++;
      console.log(
        `${pc.red('✗')} ${a.source_file}:${a.source_line} — FR ID(s) not in delta spec: ${missing.join(', ')}`,
      );
      continue;
    }

    if (a.change !== a.change_dir.replace(/^\d{4}-\d{2}-\d{2}-\d{6}-/, '')) {
      errors++;
      console.log(
        `${pc.red('✗')} ${a.source_file}:${a.source_line} — Change "${a.change}" does not match change_dir suffix`,
      );
      continue;
    }

    console.log(`${pc.green('✓')} ${a.source_file}:${a.source_line} — ${a.requirements.join(',')} (${a.change_dir})`);
  }

  console.log();
  console.log(`Scanned ${anchors.length} anchor(s), ${errors} error(s)`);
  if (errors > 0) process.exitCode = 1;
}
