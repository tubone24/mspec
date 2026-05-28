// @mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
// Requirements implemented: FR-011, FR-012, FR-013
// Change: multi-test-runner-support

import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import pc from 'picocolors';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { projectPaths } from '../workflow/paths.js';
import { loadConfig } from '../workflow/config-loader.js';
import { findChange, listChanges, fileExists } from '../lib/change-discovery.js';
import { ask } from '../lib/prompt.js';
import type { ChangeLocation } from '../lib/change-discovery.js';
import type { Config } from '../types/config.js';

export interface TestOptions {
  change?: string;
}

export interface ResolvedRunner {
  name: string;
  command: string;
  cwd?: string;
  expectRedOnExit: number[];
  expectGreenOnExit: number[];
  resultsSrc?: string;
}

export interface RunnerResult {
  name: string;
  command: string;
  exit_code: number;
  ok: boolean;
}

export function buildMultiRunnerEvidence(
  taskId: string,
  changeName: string,
  expect: 'red' | 'green',
  results: RunnerResult[],
): Record<string, unknown> {
  const ok = results.every((r) => r.ok);
  const isLegacy = results.length === 1 && results[0]!.name === '__default__';
  if (isLegacy) {
    const r = results[0]!;
    const matchedRed = expect === 'red' ? r.ok : !r.ok;
    const matchedGreen = expect === 'green' ? r.ok : !r.ok;
    return {
      task_id: taskId,
      change: changeName,
      expect,
      command: r.command,
      exit_code: r.exit_code,
      matched_red: matchedRed,
      matched_green: matchedGreen,
      recorded_at: new Date().toISOString(),
      ok,
    };
  }
  return {
    task_id: taskId,
    change: changeName,
    expect,
    command: results.map((r) => r.command),
    exit_code: results[results.length - 1]?.exit_code ?? -1,
    runners: results.map((r) => ({ name: r.name, exit_code: r.exit_code })),
    recorded_at: new Date().toISOString(),
    ok,
  };
}

export function resolveRunners(cfg: Config): ResolvedRunner[] {
  const test = cfg.test;
  if (test?.runners && test.runners.length > 0) {
    return test.runners.map((r) => ({
      name: r.name,
      command: r.command,
      cwd: r.cwd,
      expectRedOnExit: r.expect_red_on_exit ?? test.expect_red_on_exit ?? [1, 2],
      expectGreenOnExit: r.expect_green_on_exit ?? test.expect_green_on_exit ?? [0],
      resultsSrc: r.results_src,
    }));
  }
  return [{
    name: '__default__',
    command: test?.command ?? '',
    expectRedOnExit: test?.expect_red_on_exit ?? [1, 2],
    expectGreenOnExit: test?.expect_green_on_exit ?? [0],
    resultsSrc: test?.results_src,
  }];
}

export async function testExpectRed(taskId: string, opts: TestOptions): Promise<void> {
  await runTestEvidence(taskId, opts, 'red');
}

export async function testExpectGreen(taskId: string, opts: TestOptions): Promise<void> {
  await runTestEvidence(taskId, opts, 'green');
}

async function runTestEvidence(
  taskId: string,
  opts: TestOptions,
  expect: 'red' | 'green',
): Promise<void> {
  const paths = projectPaths(process.cwd());
  const cfg = await loadConfig(paths.configFile);
  const change = await resolveChange(paths, opts.change);

  const runners = resolveRunners(cfg);
  const isLegacy = runners.length === 1 && runners[0]!.name === '__default__';
  if (isLegacy) {
    runners[0]!.command = await ensureTestCommand(paths.configFile, runners[0]!.command);
  }

  const results: RunnerResult[] = [];

  for (const runner of runners) {
    console.log(`${pc.gray(`[${runner.name}] $`)} ${runner.command}`);
    const exitCode = await runShell(runner.command, runner.cwd);
    console.log(`${pc.gray(`[${runner.name}] exit:`)} ${exitCode}`);

    const matchedRed = runner.expectRedOnExit.includes(exitCode);
    const matchedGreen = runner.expectGreenOnExit.includes(exitCode);
    const ok = (expect === 'red' && matchedRed) || (expect === 'green' && matchedGreen);

    results.push({ name: runner.name, command: runner.command, exit_code: exitCode, ok });

    if (!ok) {
      // FR-012: fail-fast — 失敗ランナー名を stderr に出力して即時中断
      console.error(`${pc.red('✗')} runner "${runner.name}" failed with exit code ${exitCode}`);
      process.exitCode = 1;
      return;
    }

    if (runner.resultsSrc) {
      const runnerNameForPath = runner.name === '__default__' ? undefined : runner.name;
      await copyTestResults(process.cwd(), runner.resultsSrc, change.dir, runnerNameForPath);
    }
  }

  const evidence = buildMultiRunnerEvidence(taskId, change.name, expect, results);
  const dir = join(paths.cacheDir, expect === 'red' ? 'red-evidence' : 'green-evidence');
  await mkdir(dir, { recursive: true });
  const out = join(dir, `${change.name}__${taskId}.json`);
  await writeFile(out, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  console.log(`${pc.green('✓')} evidence saved: ${out}`);
}

async function ensureTestCommand(configPath: string, current: string): Promise<string> {
  if (current && current.trim().length > 0) return current;
  const answer = (await ask('test.command (e.g. `npm test --`): ')).trim();
  if (!answer) throw new Error('test.command must be set in .mspec/config.yaml or entered now');

  if (await fileExists(configPath)) {
    const raw = await readFile(configPath, 'utf8');
    const obj = (parseYaml(raw) as Record<string, unknown>) ?? {};
    const test = (obj.test as Record<string, unknown> | undefined) ?? {};
    test.command = answer;
    obj.test = test;
    await writeFile(configPath, stringifyYaml(obj), 'utf8');
  }
  return answer;
}

async function resolveChange(
  paths: ReturnType<typeof projectPaths>,
  hint: string | undefined,
): Promise<ChangeLocation> {
  const name = hint ?? (await singleActiveChange(paths));
  const change = await findChange(paths, name);
  if (!change) throw new Error(`change "${name}" not found`);
  return change;
}

async function singleActiveChange(paths: ReturnType<typeof projectPaths>): Promise<string> {
  const live = await listChanges(paths, { includeArchived: false });
  if (live.length === 1) return live[0]!.name;
  if (live.length === 0) throw new Error('no active change. Run `mspec new` first.');
  throw new Error(`multiple active changes; specify --change: ${live.map((c) => c.name).join(', ')}`);
}

async function copyTestResults(
  cwd: string,
  resultsSrc: string,
  changeDir: string,
  runnerName?: string,
): Promise<void> {
  const src = join(cwd, resultsSrc);
  try {
    await stat(src);
  } catch {
    return; // results file doesn't exist yet — silently skip
  }
  const destDir = runnerName
    ? join(changeDir, 'e2e-results', runnerName)
    : join(changeDir, 'e2e-results');
  await mkdir(destDir, { recursive: true });
  const dest = join(destDir, basename(src));
  await copyFile(src, dest);
  console.log(`${pc.gray('  test results →')} ${dest.replace(cwd + '/', '')}`);
}

function runShell(command: string, cwd?: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, stdio: 'inherit', ...(cwd ? { cwd } : {}) });
    child.on('exit', (code) => resolve(code ?? -1));
    child.on('error', () => resolve(-1));
  });
}
