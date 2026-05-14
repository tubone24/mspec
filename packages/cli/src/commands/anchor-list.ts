import pc from 'picocolors';
import { projectPaths } from '../workflow/paths.js';
import { scanAnchors } from '../lib/anchor-scanner.js';
import { findChange } from '../lib/change-discovery.js';

export interface AnchorListOptions {
  orphans?: boolean;
}

export async function anchorListCommand(opts: AnchorListOptions): Promise<void> {
  const paths = projectPaths(process.cwd());
  const { anchors, warnings } = await scanAnchors(paths.root);

  for (const w of warnings) console.log(`${pc.yellow('warn:')} ${w}`);

  let shown = 0;
  for (const a of anchors) {
    const change = await findChange(paths, a.change_dir);
    const orphan = !change;
    if (opts.orphans && !orphan) continue;
    shown++;
    const tag = orphan ? pc.red('orphan') : change!.isArchived ? pc.gray('archived') : pc.green('live');
    console.log(
      `  [${tag}] ${a.source_file}:${a.source_line} → ${a.change_dir}/specs/${a.capability}/spec.md (${a.requirements.join(',')})`,
    );
  }
  console.log();
  console.log(`Total: ${anchors.length} anchor(s), shown ${shown}`);
}
