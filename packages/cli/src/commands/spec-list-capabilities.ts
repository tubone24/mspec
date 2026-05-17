// @mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-013, FR-014
// Change: spec-grep

import { relative } from 'node:path';
import pc from 'picocolors';
import { dirExists } from '../lib/change-discovery.js';
import { listCapabilityNames } from '../lib/spec-linter.js';
import { projectPaths } from '../workflow/paths.js';

export interface SpecListCapabilitiesOptions {
  json?: boolean;
  cwd?: string;
}

export async function specListCapabilitiesCommand(
  opts: SpecListCapabilitiesOptions,
): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const paths = projectPaths(cwd);

  if (!(await dirExists(paths.specsDir))) {
    console.error(pc.red('Error:'), `specs/ does not exist at ${relative(cwd, paths.specsDir)}`);
    process.exitCode = 1;
    return;
  }

  const capabilities = listCapabilityNames(paths.specsDir);

  if (opts.json) {
    const payload = {
      command: 'list-capabilities',
      results: capabilities.map((capability) => ({ capability })),
      meta: { specsDir: relative(cwd, paths.specsDir) || 'specs', count: capabilities.length },
    };
    console.log(JSON.stringify(payload, null, 2));
  } else {
    for (const cap of capabilities) {
      console.log(cap);
    }
  }
}
