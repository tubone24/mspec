// @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
// Requirements implemented: FR-001
// Change: fix-command-name-consistency

// @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: init-link-global-bin

// @mspec-delta 2026-05-28-113128-init-gitignore-ui-pid/specs/cli-init/spec.md
// Requirements implemented: FR-012
// Change: init-gitignore-ui-pid
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, access, readdir, appendFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import pc from 'picocolors';

export interface InitOptions {
  tools?: string;
  subagents?: boolean; // commander's --no-subagents inverts to false
  force?: boolean;
}

interface PlannedFile {
  /** absolute target path */
  to: string;
  /** absolute source path (from templates/) */
  from: string;
  /** transform applied to template body */
  transform?: (raw: string) => string;
}

/**
 * Resolve the templates directory shipped with the CLI package.
 *
 * Layout:
 *   packages/cli/
 *     src/commands/init.ts   ← this file (dev/typecheck)
 *     dist/index.js          ← bundled output (production)
 *     templates/             ← target
 *
 * We walk up from this module's URL until we find a directory containing `templates/`.
 */
function resolveTemplatesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // Try a few likely roots (depth-limited).
  const candidates = [
    resolve(here, '..', '..', 'templates'), // src/commands -> packages/cli/templates
    resolve(here, '..', 'templates'), // dist -> packages/cli/templates
    resolve(here, 'templates'),
  ];
  for (const c of candidates) {
    try {
      // sync-ish check via require? we have async-only fs; just return first.
      // Caller will fail loudly if it doesn't exist.
      // We pick the first that exists by probing later (in copyAll).
      return c;
    } catch {
      // continue
    }
  }
  return candidates[0]!;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function findTemplatesDir(): Promise<string> {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(here, '..', '..', 'templates'),
    resolve(here, '..', 'templates'),
    resolve(here, 'templates'),
    resolve(here, '..', '..', '..', 'templates'),
  ];
  for (const c of candidates) {
    if (await pathExists(join(c, 'workflow.default.yaml'))) {
      return c;
    }
  }
  throw new Error(
    `Could not locate mspec templates directory. Tried:\n${candidates.map((c) => `  - ${c}`).join('\n')}`,
  );
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string): Promise<void> {
    const entries = await readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  }
  await walk(dir);
  return out;
}

async function promptTestCommand(): Promise<string> {
  // Non-interactive (no TTY) → skip silently.
  if (!process.stdin.isTTY) return '';
  return new Promise<string>((resolveP) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(
      pc.cyan('test.command') +
        ' (e.g. "npm test --", press Enter to skip): ',
      (answer) => {
        rl.close();
        resolveP(answer.trim());
      },
    );
  });
}

function applyConfigTransforms(raw: string, testCommand: string, subagents: boolean): string {
  return raw
    .replace('__TEST_COMMAND__', testCommand)
    .replace('__CLAUDE_SUBAGENTS__', subagents ? 'true' : 'false');
}

function applyConstitutionTransforms(raw: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return raw.split('__TODAY__').join(today);
}

export async function ensureGlobalLink(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkgCliDir = resolve(here, '..');
  const isDevMode =
    (await pathExists(join(pkgCliDir, 'package.json'))) &&
    (await pathExists(join(pkgCliDir, 'tsconfig.json')));
  if (!isDevMode) return;

  console.log(pc.cyan('dev-mode:'), 'building and linking mspec globally...');

  const build = spawnSync('npm', ['run', 'build'], { cwd: pkgCliDir, stdio: 'inherit' });
  if (build.status !== 0 || build.error) {
    console.warn(pc.yellow('warn:'), 'build failed; skipping npm link. Run `npm run build && npm link` manually.');
    return;
  }

  const link = spawnSync('npm', ['link'], { cwd: pkgCliDir, stdio: 'inherit' });
  if (link.status !== 0 || link.error) {
    console.warn(pc.yellow('warn:'), 'npm link failed. Run `cd packages/cli && npm link` manually.');
    return;
  }

  console.log(pc.green('  ✓'), 'mspec linked globally');
}

export async function initCommand(opts: InitOptions = {}): Promise<void> {
  const tools = opts.tools ?? 'claude';
  const subagents = opts.subagents !== false; // default true
  const force = opts.force === true;

  if (tools !== 'claude') {
    console.error(
      pc.red('error:'),
      `--tools=${tools} is not supported in v0.1 (only "claude").`,
    );
    process.exit(1);
  }

  const root = process.cwd();
  const templatesDir = await findTemplatesDir();

  console.log(pc.cyan('mspec init'), pc.dim(`(root=${root})`));

  // 1) Interactive prompt for test.command (skippable).
  const testCommand = await promptTestCommand();
  if (testCommand === '') {
    console.log(
      pc.yellow('note:'),
      'test.command is empty. You can set it later in .mspec/config.yaml.',
    );
  }

  // 2) Build the file plan.
  const plan: PlannedFile[] = [];

  // .mspec/config.yaml
  plan.push({
    from: join(templatesDir, 'config.default.yaml'),
    to: join(root, '.mspec', 'config.yaml'),
    transform: (raw) => applyConfigTransforms(raw, testCommand, subagents),
  });

  // .mspec/workflow.yaml
  plan.push({
    from: join(templatesDir, 'workflow.default.yaml'),
    to: join(root, '.mspec', 'workflow.yaml'),
  });

  // .mspec/.gitignore
  plan.push({
    from: join(templatesDir, 'mspec-gitignore'),
    to: join(root, '.mspec', '.gitignore'),
  });

  // memory/constitution.md
  plan.push({
    from: join(templatesDir, 'constitution.md'),
    to: join(root, 'memory', 'constitution.md'),
    transform: applyConstitutionTransforms,
  });

  // .claude/commands/mspec/*.md
  const commandsSrc = join(templatesDir, 'claude', 'commands', 'mspec');
  for (const src of await listFilesRecursive(commandsSrc)) {
    const rel = relative(commandsSrc, src);
    plan.push({
      from: src,
      to: join(root, '.claude', 'commands', 'mspec', rel),
    });
  }

  // .claude/skills/mspec-*/SKILL.md
  const skillsSrc = join(templatesDir, 'claude', 'skills');
  for (const src of await listFilesRecursive(skillsSrc)) {
    const rel = relative(skillsSrc, src);
    plan.push({
      from: src,
      to: join(root, '.claude', 'skills', rel),
    });
  }

  // .claude/agents/mspec-*.md (gated by --no-subagents)
  if (subagents) {
    const agentsSrc = join(templatesDir, 'claude', 'agents');
    for (const src of await listFilesRecursive(agentsSrc)) {
      const rel = relative(agentsSrc, src);
      plan.push({
        from: src,
        to: join(root, '.claude', 'agents', rel),
      });
    }
  }

  // 3) Collision check.
  const collisions: string[] = [];
  for (const p of plan) {
    if (await pathExists(p.to)) collisions.push(p.to);
  }
  if (collisions.length > 0 && !force) {
    console.error(pc.red('error:'), 'the following files already exist (use --force to overwrite):');
    for (const c of collisions) {
      console.error('  ' + relative(root, c));
    }
    process.exit(1);
  }

  // 4) Write files.
  for (const p of plan) {
    const raw = await readFile(p.from, 'utf8');
    const content = p.transform ? p.transform(raw) : raw;
    await mkdir(dirname(p.to), { recursive: true });
    await writeFile(p.to, content, 'utf8');
    console.log(pc.green('  +'), relative(root, p.to));
  }

  // 5) Ensure changes/, specs/ directories exist (empty placeholders).
  await mkdir(join(root, 'changes'), { recursive: true });
  await mkdir(join(root, 'specs'), { recursive: true });

  // 6) Append `.mspec/cache/` to .gitignore if not already present.
  await ensureGitignoreEntry(root, '.mspec/cache/');

  await ensureGlobalLink();

  console.log();
  console.log(pc.green('mspec init: done.'));
  console.log(pc.cyan('next:'), pc.bold('run /mspec:new <feature>'));
}

async function ensureGitignoreEntry(root: string, line: string): Promise<void> {
  const path = join(root, '.gitignore');
  let existing = '';
  if (await pathExists(path)) {
    const s = await stat(path);
    if (s.isFile()) {
      existing = await readFile(path, 'utf8');
    }
  }
  const lines = existing.split(/\r?\n/).map((l) => l.trim());
  if (lines.includes(line) || lines.includes(line.replace(/\/$/, ''))) return;
  const needsNewline = existing.length > 0 && !existing.endsWith('\n');
  await appendFile(path, `${needsNewline ? '\n' : ''}${line}\n`, 'utf8');
  console.log(pc.green('  +'), `.gitignore (appended ${line})`);
}

// Silence unused-locals lint for the legacy resolver we keep for reference.
void resolveTemplatesDir;
