// @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: cli-upgrade
// @mspec-delta 2026-05-21-215113-fix-upgrade-package-json-path/specs/upgrade-command/spec.md
// Requirements implemented: FR-001, FR-002
// Change: fix-upgrade-package-json-path
// @mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md
// Requirements implemented: FR-002, FR-004
// Change: cli-output-english
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import pc from 'picocolors';
import { ask } from '../lib/prompt.js';

export interface UpgradeOptions {
  yes?: boolean;
  /** Override cwd (for testing). */
  cwd?: string;
  /** Override fetch (for testing). */
  fetchFn?: typeof fetch;
  /** Override spawnSync (for testing). */
  spawnFn?: typeof spawnSync;
}

export async function fetchLatestVersion(
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchFn('https://registry.npmjs.org/@mspec/cli/latest', {
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json()) as { version: string };
  return data.version;
}

export function getCurrentVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // candidates: dist/index.js 環境と src/commands/upgrade.ts 環境の両方に対応
  const candidates = [
    join(here, '../package.json'),    // dist/ → packages/cli/package.json
    join(here, '../../package.json'), // src/commands/ → packages/cli/package.json
  ];
  for (const c of candidates) {
    try {
      return (JSON.parse(readFileSync(c, 'utf8')) as { version: string }).version;
    } catch {
      // 次の候補を試す
    }
  }
  throw new Error('Cannot resolve package.json from getCurrentVersion()');
}

export async function upgradeCommand(opts: UpgradeOptions = {}): Promise<void> {
  const fetchFn = opts.fetchFn ?? fetch;
  const spawnFn = opts.spawnFn ?? spawnSync;

  let latestVersion: string;
  try {
    latestVersion = await fetchLatestVersion(fetchFn);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${pc.red('Error:')} Failed to fetch version info: ${msg}\n`);
    process.exit(1);
    return; // unreachable in production; prevents test bleed when process.exit is mocked
  }

  const currentVersion = getCurrentVersion();

  console.log(`Current version: ${pc.cyan(currentVersion)}`);
  console.log(`Latest version:  ${pc.cyan(latestVersion)}`);

  if (currentVersion === latestVersion) {
    console.log(pc.green(`Already up to date (${currentVersion})`));
    return;
  }

  if (!opts.yes) {
    const answer = await ask(`Upgrade to ${latestVersion}? [y/N] `);
    if (answer !== 'y' && answer !== 'Y') {
      console.log('Cancelled.');
      return;
    }
  }

  const result = spawnFn('npm', ['install', '-g', '@mspec/cli@latest'], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(1);
  }

  console.log(pc.green('✓ Upgrade complete'));
}
