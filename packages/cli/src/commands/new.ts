import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import pc from 'picocolors';
import { projectPaths } from '../workflow/paths.js';
import { dirExists } from '../lib/change-discovery.js';
import { makeChangeDirName } from '../lib/datetime.js';

const FEATURE_RE = /^[a-z][a-z0-9-]*$/;

export interface NewOptions {
  request?: string;
}

export async function newCommand(feature: string, opts: NewOptions = {}): Promise<void> {
  if (!FEATURE_RE.test(feature)) {
    throw new Error(`feature name must be kebab-case (lowercase, hyphens): "${feature}"`);
  }

  const paths = projectPaths(process.cwd());
  if (!(await dirExists(paths.mspecDir))) {
    throw new Error('.mspec/ not found. Run `mspec init` first.');
  }

  const changeName = makeChangeDirName(feature);
  const changeDir = join(paths.changesDir, changeName);

  if (await dirExists(changeDir)) {
    throw new Error(`change directory already exists: ${changeDir}`);
  }

  await mkdir(changeDir, { recursive: true });
  await writeFile(join(changeDir, 'readme.md'), buildReadme(changeName, opts.request), 'utf8');

  console.log(`${pc.green('✓')} Created ${pc.cyan(changeName)}`);
  console.log(`  ${pc.gray('next: run /mspec-proposal')}`);
}

function buildReadme(changeName: string, request?: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `# ${changeName}

> Status: new
> Created: ${today}

## Request

${request ?? '<ユーザーの元の要求を 1-3 行で要約>'}

## Artifacts

- [ ] proposal.md
- [ ] specs/<capability>/spec.md (Delta Spec)
- [ ] research.md
- [ ] design.md / architecture-overview.md
- [ ] quickstart.md
- [ ] checklist.md
- [ ] tasks.md

## Skipped Steps

<!-- \`mspec skip <step-id> --reason "..."\` 実行時に追記される -->
`;
}
