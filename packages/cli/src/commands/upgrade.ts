// @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: cli-upgrade
import { createRequire } from 'node:module';
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
  const require = createRequire(import.meta.url);
  const pkg = require('../../package.json') as { version: string };
  return pkg.version;
}

export async function upgradeCommand(opts: UpgradeOptions = {}): Promise<void> {
  const fetchFn = opts.fetchFn ?? fetch;
  const spawnFn = opts.spawnFn ?? spawnSync;

  let latestVersion: string;
  try {
    latestVersion = await fetchLatestVersion(fetchFn);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${pc.red('エラー:')} バージョン情報の取得に失敗しました: ${msg}\n`);
    process.exit(1);
    return; // unreachable in production; prevents test bleed when process.exit is mocked
  }

  const currentVersion = getCurrentVersion();

  console.log(`現在のバージョン: ${pc.cyan(currentVersion)}`);
  console.log(`最新バージョン:   ${pc.cyan(latestVersion)}`);

  if (currentVersion === latestVersion) {
    console.log(pc.green(`すでに最新バージョンです (${currentVersion})`));
    return;
  }

  if (!opts.yes) {
    const answer = await ask('アップグレードしますか？ [y/N] ');
    if (answer !== 'y' && answer !== 'Y') {
      console.log('キャンセルしました。');
      return;
    }
  }

  const result = spawnFn('npm', ['install', '-g', '@mspec/cli@latest'], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(1);
  }

  console.log(pc.green('✓ アップグレード完了'));
}
