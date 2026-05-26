// @mspec-delta 2026-05-26-131825-p4-learn-command/specs/cli-core/spec.md
// Requirements implemented: FR-006
// Change: p4-learn-command

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { projectPaths } from '../workflow/paths.js';
import { dirExists, fileExists } from '../lib/change-discovery.js';
import type { AgentRunEntry } from '../lib/agent-run-log.js';

export interface LearnOptions {
  json?: boolean;
  change?: string;
}

export type ReviewBlockerPattern = {
  type: 'review-blocker';
  change: string;
  step: string;
  edits: number;
};

export type UncheckedHumanVerifyPattern = {
  type: 'unchecked-human-verify';
  change: string;
  items: string[];
};

export type LearnPattern = ReviewBlockerPattern | UncheckedHumanVerifyPattern;

export interface LearnOutput {
  patterns: LearnPattern[];
  summary: {
    total: number;
    review_blockers: number;
    unchecked_human_verify: number;
  };
}

const UNCHECKED_HUMAN_VERIFY_RE = /^-\s+\[\s+\].*<!--\s*verify:\s*human\s*-->/m;
const UNCHECKED_HUMAN_VERIFY_GLOBAL_RE = /^-\s+\[\s+\](.*)<!--\s*verify:\s*human\s*-->/gm;

export async function learnCommand(opts: LearnOptions): Promise<void> {
  const paths = projectPaths(process.cwd());
  const archiveDir = paths.changesArchiveDir;

  const patterns: LearnPattern[] = [];

  if (!(await dirExists(archiveDir))) {
    writeOutput({ patterns: [], summary: { total: 0, review_blockers: 0, unchecked_human_verify: 0 } });
    return;
  }

  const entries = await readdir(archiveDir, { withFileTypes: true });
  const changeDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => ({ name: e.name, dir: join(archiveDir, e.name) }));

  for (const { name, dir } of changeDirs) {
    // Collect review-blocker patterns from .agent-runs.jsonl
    const agentRunsPath = join(dir, '.agent-runs.jsonl');
    if (await fileExists(agentRunsPath)) {
      const content = await readFile(agentRunsPath, 'utf8');
      for (const line of content.split('\n').filter(Boolean)) {
        try {
          const entry = JSON.parse(line) as AgentRunEntry;
          if (entry.review_edits_count && entry.review_edits_count > 0) {
            patterns.push({
              type: 'review-blocker',
              change: name,
              step: entry.step,
              edits: entry.review_edits_count,
            });
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    // Collect unchecked-human-verify patterns from checklist.md
    const checklistPath = join(dir, 'checklist.md');
    if (await fileExists(checklistPath)) {
      const content = await readFile(checklistPath, 'utf8');
      if (UNCHECKED_HUMAN_VERIFY_RE.test(content)) {
        const items: string[] = [];
        let match: RegExpExecArray | null;
        const re = new RegExp(UNCHECKED_HUMAN_VERIFY_GLOBAL_RE.source, 'gm');
        while ((match = re.exec(content)) !== null) {
          items.push(match[1]?.trim() ?? '');
        }
        patterns.push({
          type: 'unchecked-human-verify',
          change: name,
          items,
        });
      }
    }
  }

  const reviewBlockers = patterns.filter((p) => p.type === 'review-blocker').length;
  const uncheckedHumanVerify = patterns.filter((p) => p.type === 'unchecked-human-verify').length;

  writeOutput({
    patterns,
    summary: {
      total: patterns.length,
      review_blockers: reviewBlockers,
      unchecked_human_verify: uncheckedHumanVerify,
    },
  });
}

function writeOutput(output: LearnOutput): void {
  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}
