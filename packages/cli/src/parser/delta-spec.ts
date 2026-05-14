import type { Content, Heading, Root } from 'mdast';
import {
  DELTA_SECTIONS,
  type DeltaSection,
  type DeltaSpec,
  type Requirement,
  type Scenario,
} from '../types/index.js';
import { parseMd, sectionsByDepth, headingText, sliceSource } from './markdown.js';

const SECTION_RE = /^(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements$/i;
const REQUIREMENT_RE = /^Requirement:\s+(FR-\d+)\s+[—-]\s+(.+)$/;
const SCENARIO_RE = /^Scenario:\s+(.+)$/;

export interface ParseDeltaResult {
  spec: DeltaSpec;
  warnings: string[];
}

export function parseDeltaSpec(source: string, capabilityHint?: string): ParseDeltaResult {
  const root = parseMd(source);
  const warnings: string[] = [];

  const capability = capabilityHint ?? extractCapability(root) ?? 'unknown';

  const spec: DeltaSpec = {
    capability,
    added: [],
    modified: [],
    removed: [],
    renamed: [],
  };

  for (const h2 of sectionsByDepth(root, 2)) {
    const sectionMatch = SECTION_RE.exec(h2.heading);
    if (!sectionMatch) continue;
    const section = sectionMatch[1].toUpperCase() as DeltaSection;

    const reqs = collectRequirements(h2.children, h2.endLine, source, warnings, h2.heading);
    if (section === 'ADDED') spec.added.push(...reqs);
    else if (section === 'MODIFIED') spec.modified.push(...reqs);
    else if (section === 'REMOVED') spec.removed.push(...reqs);
    else if (section === 'RENAMED') spec.renamed.push(...reqs);
  }

  return { spec, warnings };
}

function collectRequirements(
  nodes: Content[],
  sectionEndLine: number,
  source: string,
  warnings: string[],
  sectionLabel: string,
): Requirement[] {
  const h3Indices: number[] = [];
  nodes.forEach((n, i) => {
    if (n.type === 'heading' && (n as Heading).depth === 3) h3Indices.push(i);
  });

  const out: Requirement[] = [];
  for (let k = 0; k < h3Indices.length; k++) {
    const idx = h3Indices[k];
    const h3 = nodes[idx] as Heading;

    const reqMatch = REQUIREMENT_RE.exec(headingText(h3));
    if (!reqMatch) {
      warnings.push(
        `H3 under "${sectionLabel}" does not match "Requirement: FR-NNN — Title": "${headingText(h3)}"`,
      );
      continue;
    }

    const startLine = h3.position?.start.line ?? -1;
    const nextH3Idx = h3Indices[k + 1] ?? nodes.length;
    const endLine =
      nodes[nextH3Idx - 1]?.position?.end?.line ?? sectionEndLine ?? startLine;

    const innerNodes = nodes.slice(idx + 1, nextH3Idx);
    const scenarios = collectScenarios(innerNodes, endLine, source, warnings, reqMatch[0]);

    const raw_block = sliceSource(source, startLine, endLine);
    out.push({
      fr_id: reqMatch[1],
      title: reqMatch[2].trim(),
      body: raw_block,
      scenarios,
      raw_block,
    });
  }
  return out;
}

function collectScenarios(
  nodes: Content[],
  reqEndLine: number,
  source: string,
  warnings: string[],
  reqLabel: string,
): Scenario[] {
  const h4Indices: number[] = [];
  nodes.forEach((n, i) => {
    if (n.type === 'heading' && (n as Heading).depth === 4) h4Indices.push(i);
  });

  const out: Scenario[] = [];
  for (let k = 0; k < h4Indices.length; k++) {
    const idx = h4Indices[k];
    const h4 = nodes[idx] as Heading;
    const sMatch = SCENARIO_RE.exec(headingText(h4));
    if (!sMatch) {
      warnings.push(
        `H4 under "${reqLabel}" does not match "Scenario: ...": "${headingText(h4)}"`,
      );
      continue;
    }
    const startLine = h4.position?.start.line ?? -1;
    const nextIdx = h4Indices[k + 1] ?? nodes.length;
    const endLine = nodes[nextIdx - 1]?.position?.end?.line ?? reqEndLine ?? startLine;

    const lines = sliceSource(source, startLine + 1, endLine)
      .split(/\r?\n/)
      .filter((l) => l.trim().startsWith('-'));

    out.push({ name: sMatch[1].trim(), lines });
  }
  return out;
}

function extractCapability(root: Root): string | null {
  const h1 = root.children.find(
    (c): c is Heading => c.type === 'heading' && (c as Heading).depth === 1,
  );
  if (!h1) return null;
  const m = /^Delta Spec:\s+(\S+)/i.exec(headingText(h1));
  return m ? m[1] : null;
}

export { DELTA_SECTIONS };
