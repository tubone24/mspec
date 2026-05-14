import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import pc from 'picocolors';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { projectPaths } from '../workflow/paths.js';
import { loadConfig } from '../workflow/config-loader.js';
import { findChange, listChanges, fileExists } from '../lib/change-discovery.js';
import { ask } from '../lib/prompt.js';
import type { ChangeLocation } from '../lib/change-discovery.js';

export interface TestOptions {
  change?: string;
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
  const command = await ensureTestCommand(paths.configFile, cfg.test?.command ?? '');
  const expectRed = cfg.test?.expect_red_on_exit ?? [1, 2];
  const expectGreen = cfg.test?.expect_green_on_exit ?? [0];

  const change = await resolveChange(paths, opts.change);

  console.log(`${pc.gray('$')} ${command}`);
  const exitCode = await runShell(command);
  console.log(`${pc.gray('exit:')} ${exitCode}`);

  const matchedRed = expectRed.includes(exitCode);
  const matchedGreen = expectGreen.includes(exitCode);

  const ok =
    (expect === 'red' && matchedRed) || (expect === 'green' && matchedGreen);

  const evidence = {
    task_id: taskId,
    change: change.name,
    expect,
    command,
    exit_code: exitCode,
    matched_red: matchedRed,
    matched_green: matchedGreen,
    recorded_at: new Date().toISOString(),
    ok,
  };

  const dir = join(paths.cacheDir, expect === 'red' ? 'red-evidence' : 'green-evidence');
  await mkdir(dir, { recursive: true });
  const out = join(dir, `${change.name}__${taskId}.json`);
  await writeFile(out, JSON.stringify(evidence, null, 2) + '\n', 'utf8');

  if (ok) {
    console.log(`${pc.green('✓')} evidence saved: ${out}`);
  } else {
    console.log(`${pc.red('✗')} expected ${expect} but observed exit=${exitCode}`);
    process.exitCode = 1;
  }
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

function runShell(command: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, stdio: 'inherit' });
    child.on('exit', (code) => resolve(code ?? -1));
    child.on('error', () => resolve(-1));
  });
}
