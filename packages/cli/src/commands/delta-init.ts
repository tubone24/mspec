// @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/cli-delta-spec/spec.md
// Requirements implemented: FR-011
// Change: diataxis-artifact-structure

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import { projectPaths } from '../workflow/paths.js';
import { findChange, listChanges, fileExists } from '../lib/change-discovery.js';
import { scanFrIds, nextFrId } from '../lib/fr-numbering.js';
import { loadConfig } from '../workflow/config-loader.js';
import { resolveTemplate } from '../lib/template-resolver.js';
import { DEFAULT_LOCALE } from '../lib/locale-resolver.js';

const KEBAB_RE = /^[a-z][a-z0-9-]*$/;

export interface DeltaInitOptions {
  capability?: string;
  change?: string;
  cwd?: string;
  locale?: string;
}

export async function deltaInitCommand(opts: DeltaInitOptions): Promise<void> {
  if (!opts.capability || !KEBAB_RE.test(opts.capability)) {
    throw new Error('--capability <kebab-name> is required');
  }
  const paths = projectPaths(opts.cwd ?? process.cwd());
  const locale = opts.locale ?? (await resolveLocaleFromConfig(paths.configFile));
  const changeName = opts.change ?? (await singleActiveChange(paths));
  const change = await findChange(paths, changeName);
  if (!change) throw new Error(`change "${changeName}" not found`);
  if (change.isArchived) throw new Error('cannot init delta in an archived change');

  const sourceSpecPath = join(paths.specsDir, opts.capability, 'spec.md');
  const isExisting = await fileExists(sourceSpecPath);

  const { maxId } = await scanFrIds(sourceSpecPath);
  const newFr = nextFrId(maxId);

  const deltaPath = join(change.dir, 'specs', opts.capability, 'spec.md');
  if (await fileExists(deltaPath)) {
    throw new Error(`delta spec already exists: ${deltaPath}`);
  }
  await mkdir(join(change.dir, 'specs', opts.capability), { recursive: true });
  await writeFile(deltaPath, await buildDeltaSkeleton(opts.capability, newFr, locale), 'utf8');

  if (!isExisting) {
    // Create source-of-truth spec.md with the empty frame so archive can merge into it later.
    await mkdir(join(paths.specsDir, opts.capability), { recursive: true });
    await writeFile(sourceSpecPath, buildSotSkeleton(opts.capability), 'utf8');
    console.log(
      pc.yellow('  note:'),
      `treating "${opts.capability}" as NEW capability (FR-001 start)`,
    );
  } else {
    console.log(
      pc.gray('  note:'),
      `existing capability detected, next FR-ID = ${pc.cyan(newFr)}`,
    );
  }

  console.log(`${pc.green('✓')} ${pc.cyan(deltaPath)}`);
}

async function singleActiveChange(paths: ReturnType<typeof projectPaths>): Promise<string> {
  const live = await listChanges(paths, { includeArchived: false });
  if (live.length === 1) return live[0]!.name;
  if (live.length === 0) throw new Error('no active change. Run `mspec new` first.');
  throw new Error(`multiple active changes; specify --change: ${live.map((c) => c.name).join(', ')}`);
}

function templatesArtifactsDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return here.endsWith('commands')
    ? join(here, '..', '..', 'templates', 'artifacts')
    : join(here, '..', 'templates', 'artifacts');
}

async function resolveLocaleFromConfig(configFile: string): Promise<string> {
  try {
    const loaded = await loadConfig(configFile);
    return loaded.resolvedLocale.locale;
  } catch {
    return DEFAULT_LOCALE;
  }
}

async function buildDeltaSkeleton(
  capability: string,
  firstFr: string,
  locale: string,
): Promise<string> {
  const tpl = await resolveTemplate('delta-spec', locale, templatesArtifactsDir());
  return tpl.content
    .replaceAll('{{CAPABILITY}}', capability)
    .replaceAll('{{FIRST_FR}}', firstFr);
}

function buildSotSkeleton(capability: string): string {
  return `<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# ${capability} Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->
`;
}
