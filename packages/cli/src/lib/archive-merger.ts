import type { Heading, Root } from 'mdast';
import { parseMd, headingText } from '../parser/markdown.js';
import type { DeltaSpec, Requirement } from '../types/index.js';

export interface MergeSummary {
  added: number;
  modified: number;
  removed: number;
  renamed: number;
}

export interface MergeResult {
  output: string;
  summary: MergeSummary;
  errors: string[];
}

interface H3Block {
  fr_id: string;
  title: string;
  startLine: number;
  endLine: number;
  rawLines: string[];
}

const REQ_HEADER_RE = /^###\s+Requirement:\s+(FR-\d+)\s+[—-]\s+(.+?)\s*$/;
const RENAMED_TITLE_RE = /^(.+?)\s*->\s*(FR-\d+)\s+[—-]\s+(.+?)$/;

/**
 * Merge a parsed Delta Spec into the source-of-truth spec markdown content.
 * Pure / parser-based / LLM-free. Transactional: any error aborts the merge
 * with `errors` populated, `summary` all zero, and `output === source`.
 */
export function mergeDeltaIntoSpec(
  delta: DeltaSpec,
  source: string,
): MergeResult {
  const errors: string[] = [];
  const summary: MergeSummary = { added: 0, modified: 0, removed: 0, renamed: 0 };

  // 1. Plan all operations against an in-memory model first.
  const blocks = extractRequirementBlocks(source);
  const index = new Map<string, H3Block>();
  for (const b of blocks) index.set(b.fr_id, b);

  type Op =
    | { kind: 'add'; req: Requirement }
    | { kind: 'modify'; req: Requirement; target: H3Block }
    | { kind: 'remove'; target: H3Block }
    | { kind: 'rename'; target: H3Block; newFrId: string; newTitle: string };

  const ops: Op[] = [];

  for (const r of delta.added) {
    if (index.has(r.fr_id)) {
      errors.push(`ADDED: ${r.fr_id} already exists in source spec`);
      continue;
    }
    ops.push({ kind: 'add', req: r });
  }

  for (const r of delta.modified) {
    const target = index.get(r.fr_id);
    if (!target) {
      errors.push(`MODIFIED: ${r.fr_id} not found in source spec`);
      continue;
    }
    ops.push({ kind: 'modify', req: r, target });
  }

  for (const r of delta.removed) {
    const target = index.get(r.fr_id);
    if (!target) {
      errors.push(`REMOVED: ${r.fr_id} not found in source spec`);
      continue;
    }
    ops.push({ kind: 'remove', target });
  }

  for (const r of delta.renamed) {
    const target = index.get(r.fr_id);
    if (!target) {
      errors.push(`RENAMED: ${r.fr_id} not found in source spec`);
      continue;
    }
    const m = RENAMED_TITLE_RE.exec(r.title);
    if (!m) {
      errors.push(
        `RENAMED: ${r.fr_id} title does not follow "<Old> -> FR-NNN — <New>" format`,
      );
      continue;
    }
    ops.push({
      kind: 'rename',
      target,
      newFrId: m[2],
      newTitle: m[3].trim(),
    });
  }

  if (errors.length > 0) {
    return { output: source, summary, errors };
  }

  // 2. Apply: REMOVE / MODIFY / RENAME by line-range editing of source, then APPEND ADDed.
  const lines = source.split(/\r?\n/);
  // Use a mutable representation: replace ranges with arrays of strings or null markers.
  // Approach: build a list of edits sorted by descending startLine, apply destructively.
  interface Edit {
    startLine: number; // 1-based
    endLine: number; // 1-based, inclusive
    replacement: string[];
  }
  const edits: Edit[] = [];
  for (const op of ops) {
    if (op.kind === 'remove') {
      edits.push({
        startLine: op.target.startLine,
        endLine: op.target.endLine,
        replacement: [],
      });
      summary.removed++;
    } else if (op.kind === 'modify') {
      // Replace the source H3 block with delta.raw_block (which includes the ### header line).
      const replacement = op.req.raw_block.split(/\r?\n/);
      // Trim trailing empty lines from replacement to avoid blank-line accumulation.
      while (replacement.length > 0 && replacement[replacement.length - 1] === '') {
        replacement.pop();
      }
      edits.push({
        startLine: op.target.startLine,
        endLine: op.target.endLine,
        replacement,
      });
      summary.modified++;
    } else if (op.kind === 'rename') {
      // Replace ONLY the header line.
      const newHeader = `### Requirement: ${op.newFrId} — ${op.newTitle}`;
      edits.push({
        startLine: op.target.startLine,
        endLine: op.target.startLine,
        replacement: [newHeader],
      });
      summary.renamed++;
    }
  }

  // Apply edits in descending order so line numbers stay valid.
  edits.sort((a, b) => b.startLine - a.startLine);
  let working = lines.slice();
  for (const e of edits) {
    const before = working.slice(0, e.startLine - 1);
    const after = working.slice(e.endLine);
    working = [...before, ...e.replacement, ...after];
  }

  // 3. APPEND ADDed requirements to the end of `## Requirements` section.
  const addReqs = ops.filter((o): o is Extract<Op, { kind: 'add' }> => o.kind === 'add');
  if (addReqs.length > 0) {
    working = appendToRequirementsSection(
      working,
      addReqs.map((o) => o.req.raw_block),
    );
    summary.added += addReqs.length;
  }

  const output = working.join('\n');
  return { output, summary, errors };
}

/**
 * Extract H3 Requirement blocks (FR-NNN) from a source spec.
 * A block runs from its `### Requirement: FR-NNN` line up to the line BEFORE the
 * next `### ` heading or any heading of depth <= 2 (next H2/H1), whichever comes first.
 */
export function extractRequirementBlocks(source: string): H3Block[] {
  const root: Root = parseMd(source);
  const lines = source.split(/\r?\n/);

  // Collect headings with their depths and line ranges.
  type HInfo = { depth: number; startLine: number; text: string };
  const headings: HInfo[] = [];
  for (const child of root.children) {
    if (child.type !== 'heading') continue;
    const h = child as Heading;
    const startLine = h.position?.start.line ?? -1;
    if (startLine < 0) continue;
    headings.push({ depth: h.depth, startLine, text: headingText(h) });
  }

  const out: H3Block[] = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]!;
    if (h.depth !== 3) continue;
    const m = REQ_HEADER_RE.exec(`### ${h.text}`); // headingText strips leading ###
    if (!m) continue;
    const startLine = h.startLine;
    // Find end: line before next heading with depth <= 3, or EOF.
    let endLine = lines.length;
    for (let j = i + 1; j < headings.length; j++) {
      const next = headings[j]!;
      if (next.depth <= 3) {
        endLine = next.startLine - 1;
        break;
      }
    }
    // Trim trailing blank lines so consecutive blocks are not glued together when removed.
    let realEnd = endLine;
    while (realEnd > startLine && (lines[realEnd - 1] ?? '').trim() === '') {
      realEnd--;
    }
    const rawLines = lines.slice(startLine - 1, realEnd);
    out.push({
      fr_id: m[1],
      title: m[2].trim(),
      startLine,
      endLine: realEnd,
      rawLines,
    });
  }
  return out;
}

function appendToRequirementsSection(lines: string[], blocks: string[]): string[] {
  // Find the `## Requirements` heading; append blocks at end of its section
  // (= just before the next `## ` heading or EOF).
  let reqHeadingIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+Requirements\s*$/.test(lines[i] ?? '')) {
      reqHeadingIdx = i;
      break;
    }
  }
  if (reqHeadingIdx < 0) {
    // No Requirements section: append one at EOF.
    const tail: string[] = [];
    if (lines.length > 0 && lines[lines.length - 1] !== '') tail.push('');
    tail.push('## Requirements', '');
    for (const b of blocks) {
      tail.push(...b.split(/\r?\n/), '');
    }
    return [...lines, ...tail];
  }

  // End of Requirements section.
  let sectionEnd = lines.length;
  for (let i = reqHeadingIdx + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i] ?? '')) {
      sectionEnd = i;
      break;
    }
  }
  // Trim trailing blank lines inside the section.
  let insertAt = sectionEnd;
  while (insertAt > reqHeadingIdx + 1 && (lines[insertAt - 1] ?? '').trim() === '') {
    insertAt--;
  }

  const before = lines.slice(0, insertAt);
  const after = lines.slice(insertAt);
  const inserted: string[] = [];
  for (const b of blocks) {
    inserted.push('');
    inserted.push(...b.split(/\r?\n/));
  }
  // Ensure a trailing blank line between inserted content and `after`.
  inserted.push('');
  return [...before, ...inserted, ...after];
}

/**
 * Build a minimal source spec scaffold for a new capability.
 * Used when the change introduces a capability that has no existing source-of-truth spec.
 */
export function createEmptySpec(capability: string): string {
  return `# Capability: ${capability}

<!-- mspec: gaps in FR numbering are intentional. Removed in changes/archive/ -->

## Purpose

<!-- Describe the capability's responsibility in 1-3 paragraphs. -->

## Requirements
`;
}
