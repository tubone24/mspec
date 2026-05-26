// @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
// Change: risk-tier-field
import type { Content, Heading, Root } from 'mdast';
import {
  DELTA_SECTIONS,
  type DeltaSection,
  type DeltaSpec,
  type Requirement,
  type RiskTier,
  type BlastRadius,
  type Scenario,
} from '../types/index.js';
import { parseMd, sectionsByDepth, headingText, sliceSource } from './markdown.js';

const SECTION_RE = /^(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements$/i;
const REQUIREMENT_RE = /^Requirement:\s+(FR-\d+)\s+[—-]\s+(.+)$/;
const SCENARIO_RE = /^Scenario:\s+(.+)$/;
const RISK_TIER_RE = /<!--\s*risk_tier:\s*(critical|standard|trivial)\s*-->/;
const BLAST_RADIUS_RE = /<!--\s*blast_radius:\s*(local|module|system|external)\s*-->/;
const RISK_TIER_INVALID_RE = /<!--\s*risk_tier:\s*([^>]+?)\s*-->/;
const BLAST_RADIUS_INVALID_RE = /<!--\s*blast_radius:\s*([^>]+?)\s*-->/;

export interface ParseDeltaResult {
  spec: DeltaSpec;
  warnings: string[];
  errors: string[];
}

export function parseDeltaSpec(source: string, capabilityHint?: string): ParseDeltaResult {
  const root = parseMd(source);
  const warnings: string[] = [];
  const errors: string[] = [];

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

    const reqs = collectRequirements(h2.children, h2.endLine, source, warnings, errors, h2.heading);
    if (section === 'ADDED') spec.added.push(...reqs);
    else if (section === 'MODIFIED') spec.modified.push(...reqs);
    else if (section === 'REMOVED') spec.removed.push(...reqs);
    else if (section === 'RENAMED') spec.renamed.push(...reqs);
  }

  return { spec, warnings, errors };
}

function collectRequirements(
  nodes: Content[],
  sectionEndLine: number,
  source: string,
  warnings: string[],
  errors: string[],
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

    // Extract risk_tier from HTML comment (default: 'standard')
    let risk_tier: RiskTier = 'standard';
    const riskTierMatch = RISK_TIER_RE.exec(raw_block);
    if (riskTierMatch) {
      risk_tier = riskTierMatch[1] as RiskTier;
    } else {
      // Check for invalid risk_tier value
      const invalidMatch = RISK_TIER_INVALID_RE.exec(raw_block);
      if (invalidMatch && invalidMatch[1].trim() !== '') {
        const val = invalidMatch[1].trim();
        if (!['critical', 'standard', 'trivial'].includes(val)) {
          errors.push(
            `invalid risk_tier value "${val}" in ${reqMatch[1]}. Must be critical | standard | trivial`,
          );
        }
      }
    }

    // Extract blast_radius from HTML comment (optional)
    let blast_radius: BlastRadius | undefined;
    const blastRadiusMatch = BLAST_RADIUS_RE.exec(raw_block);
    if (blastRadiusMatch) {
      blast_radius = blastRadiusMatch[1] as BlastRadius;
    } else {
      // Check for invalid blast_radius value
      const invalidBlastMatch = BLAST_RADIUS_INVALID_RE.exec(raw_block);
      if (invalidBlastMatch && invalidBlastMatch[1].trim() !== '') {
        const val = invalidBlastMatch[1].trim();
        if (!['local', 'module', 'system', 'external'].includes(val)) {
          errors.push(
            `invalid blast_radius value "${val}" in ${reqMatch[1]}. Must be local | module | system | external`,
          );
        }
      }
    }

    out.push({
      fr_id: reqMatch[1],
      title: reqMatch[2].trim(),
      body: raw_block,
      scenarios,
      raw_block,
      risk_tier,
      blast_radius,
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
