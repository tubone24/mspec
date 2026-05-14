import { readFile } from 'node:fs/promises';
import type { AnchorBlock } from '../types/index.js';

const PATH_RE =
  /^\s*[#/*]*\s*@mspec-delta\s+(?<change_dir>\d{4}-\d{2}-\d{2}-\d{6}-[a-z0-9-]+)\/specs\/(?<capability>[a-z0-9-]+)\/spec\.md\s*$/;
const REQS_RE =
  /^\s*[#/*]*\s*Requirements implemented:\s+(?<fr_ids>FR-\d+(?:\s*,\s*FR-\d+)*)\s*$/;
const CHANGE_RE = /^\s*[#/*]*\s*Change:\s+(?<change>[a-z0-9-]+)\s*$/;

const SCAN_LINES_MAX = 30;

/**
 * Strip leading comment markers (`//`, `#`, `*`, `<!--`) from a single line.
 * Keeps inner whitespace intact so the regexes can match the canonical body.
 */
function stripCommentPrefix(line: string): string {
  return line
    .replace(/^\s*<!--\s*/, '')
    .replace(/^\s*-->\s*/, '')
    .replace(/^\s*(?:\/\/|#|\*|"""|'''|;|--)+\s?/, '')
    .replace(/-->\s*$/, '');
}

export interface ParsedAnchor extends AnchorBlock {}

/**
 * Parse all anchor blocks from a single file's contents.
 *
 * @param contents Raw file contents (UTF-8)
 * @param sourceFile File path to record on each result (informational only)
 * @returns List of well-formed anchor blocks. Malformed (e.g. 2-of-3 lines) are reported as warnings.
 */
export function parseAnchors(
  contents: string,
  sourceFile: string,
): { anchors: ParsedAnchor[]; warnings: string[] } {
  const lines = contents.split(/\r?\n/);
  const limit = Math.min(lines.length, SCAN_LINES_MAX);
  const anchors: ParsedAnchor[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < limit; i++) {
    const cleaned = stripCommentPrefix(lines[i] ?? '');
    if (!cleaned.includes('@mspec-delta')) continue;

    const pathMatch = PATH_RE.exec(cleaned);
    if (!pathMatch?.groups) {
      warnings.push(`${sourceFile}:${i + 1}: malformed @mspec-delta path line`);
      continue;
    }

    const reqsLine = lines[i + 1];
    const changeLine = lines[i + 2];
    if (reqsLine == null || changeLine == null) {
      warnings.push(`${sourceFile}:${i + 1}: anchor block truncated (need 3 lines)`);
      continue;
    }

    const reqsMatch = REQS_RE.exec(stripCommentPrefix(reqsLine));
    const changeMatch = CHANGE_RE.exec(stripCommentPrefix(changeLine));
    if (!reqsMatch?.groups || !changeMatch?.groups) {
      warnings.push(
        `${sourceFile}:${i + 1}: incomplete anchor block (Requirements/Change line missing or malformed)`,
      );
      continue;
    }

    const fr_ids = reqsMatch.groups.fr_ids
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    anchors.push({
      change_dir: pathMatch.groups.change_dir,
      capability: pathMatch.groups.capability,
      delta_spec_path: `${pathMatch.groups.change_dir}/specs/${pathMatch.groups.capability}/spec.md`,
      requirements: fr_ids,
      change: changeMatch.groups.change,
      source_file: sourceFile,
      source_line: i + 1,
    });
  }

  return { anchors, warnings };
}

export async function parseAnchorsFromFile(
  filePath: string,
): Promise<{ anchors: ParsedAnchor[]; warnings: string[] }> {
  const contents = await readFile(filePath, 'utf8');
  return parseAnchors(contents, filePath);
}
