import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import pc from 'picocolors';
import { loadWorkflow } from '../workflow/loader.js';
import { projectPaths } from '../workflow/paths.js';
import { findChange, resolveProduces, fileExists } from '../lib/change-discovery.js';
import { parseDeltaSpec } from '../parser/delta-spec.js';
import {
  mergeDeltaIntoSpec,
  createEmptySpec,
  type MergeSummary,
} from '../lib/archive-merger.js';
import { formatSummary } from '../lib/archive-summary.js';

export interface ArchiveOptions {
  change: string;
  yes?: boolean;
  dryRun?: boolean;
  /** Override cwd (for testing). Defaults to process.cwd(). */
  cwd?: string;
  /** Override confirmation prompt (for testing). Returns true to proceed. */
  confirm?: () => Promise<boolean>;
}

export interface CapabilityMergeReport {
  capability: string;
  sourceSpecPath: string;
  deltaSpecPath: string;
  summary: MergeSummary;
  output: string;
  createdNewSpec: boolean;
}

export interface ArchiveResult {
  change: string;
  merged: CapabilityMergeReport[];
  errors: string[];
  dryRun: boolean;
  moved: { from: string; to: string } | null;
}

export async function archiveCommand(opts: ArchiveOptions): Promise<ArchiveResult> {
  const cwd = opts.cwd ?? process.cwd();
  const paths = projectPaths(cwd);

  // 1. Load workflow (validates layout).
  await loadWorkflow(paths.workflowFile);

  // 2. Find change (must be live, not archived).
  const change = await findChange(paths, opts.change);
  if (!change) {
    throw new Error(`change "${opts.change}" not found`);
  }
  if (change.isArchived) {
    throw new Error(`change "${opts.change}" is already archived`);
  }

  // 3. Discover delta specs in the change.
  const deltaSpecPaths = await resolveProduces(change.dir, 'specs/*/spec.md');
  if (deltaSpecPaths.length === 0) {
    throw new Error(
      `no delta specs found in ${change.dir}/specs/*/spec.md — nothing to archive`,
    );
  }

  // 4. Parse & validate all delta specs first. Any parse warning aborts.
  const reports: CapabilityMergeReport[] = [];
  const errors: string[] = [];

  for (const deltaPath of deltaSpecPaths) {
    const capability = basename(dirname(deltaPath));
    const deltaContents = await readFile(deltaPath, 'utf8');
    const { spec: delta, warnings } = parseDeltaSpec(deltaContents, capability);
    if (warnings.length > 0) {
      for (const w of warnings) {
        errors.push(`[${capability}] delta-spec parse warning: ${w}`);
      }
      continue;
    }

    const sourceSpecPath = join(paths.specsDir, capability, 'spec.md');
    let sourceContents: string;
    let createdNewSpec = false;
    if (await fileExists(sourceSpecPath)) {
      sourceContents = await readFile(sourceSpecPath, 'utf8');
    } else {
      sourceContents = createEmptySpec(capability);
      createdNewSpec = true;
    }

    const merge = mergeDeltaIntoSpec(delta, sourceContents);
    if (merge.errors.length > 0) {
      for (const e of merge.errors) errors.push(`[${capability}] ${e}`);
      continue;
    }

    reports.push({
      capability,
      sourceSpecPath,
      deltaSpecPath: deltaPath,
      summary: merge.summary,
      output: merge.output,
      createdNewSpec,
    });
  }

  if (errors.length > 0) {
    // Transactional: nothing is written. Surface combined errors.
    throw new Error(`archive failed:\n  - ${errors.join('\n  - ')}`);
  }

  // 5. Dry run: return result, let caller print.
  if (opts.dryRun) {
    return {
      change: change.name,
      merged: reports,
      errors,
      dryRun: true,
      moved: null,
    };
  }

  // 6. Confirmation prompt (unless -y).
  if (!opts.yes) {
    const ok = await (opts.confirm ?? defaultConfirm)();
    if (!ok) {
      throw new Error('archive aborted by user');
    }
  }

  // 7. Write merged source specs.
  for (const r of reports) {
    await mkdir(dirname(r.sourceSpecPath), { recursive: true });
    await writeFile(r.sourceSpecPath, r.output, 'utf8');
  }

  // 8. Move change dir to archive.
  await mkdir(paths.changesArchiveDir, { recursive: true });
  const targetDir = join(paths.changesArchiveDir, change.name);
  await rename(change.dir, targetDir);

  const moved = { from: change.dir, to: targetDir };

  return {
    change: change.name,
    merged: reports,
    errors,
    dryRun: false,
    moved,
  };
}

async function defaultConfirm(): Promise<boolean> {
  const { createInterface } = await import('node:readline/promises');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = (await rl.question('Proceed with archive? [y/N] ')).trim().toLowerCase();
    return ans === 'y' || ans === 'yes';
  } finally {
    rl.close();
  }
}

export function printReport(
  reports: CapabilityMergeReport[],
  changeName: string,
  moved: { from: string; to: string } | null,
  dryRun: boolean,
): void {
  const header = dryRun ? pc.yellow('[dry-run preview]') : pc.green('[archive]');
  console.log(`${header} ${changeName}`);
  for (const r of reports) {
    console.log(`  Capability: ${pc.cyan(r.capability)}`);
    console.log(`    + ADDED:    ${r.summary.added}`);
    console.log(`    ~ MODIFIED: ${r.summary.modified}`);
    console.log(`    - REMOVED:  ${r.summary.removed}`);
    console.log(`    > RENAMED:  ${r.summary.renamed}`);
    if (r.createdNewSpec) {
      console.log(`    note: created new source spec at ${r.sourceSpecPath}`);
    }
  }
  if (moved) {
    console.log(`  Moved: ${moved.from} → ${moved.to}`);
  } else if (dryRun) {
    console.log(`  Would move: changes/${changeName} → changes/archive/${changeName}`);
  }
  if (!dryRun) {
    console.log();
    console.log('  Summary:');
    const summaryText = formatSummary(reports.map((r) => ({ capability: r.capability, summary: r.summary })));
    for (const line of summaryText.split('\n')) {
      console.log(`    ${line}`);
    }
  }
}
