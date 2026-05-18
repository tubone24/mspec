// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-015
// Change: revise-artifact-taxonomy
// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-001, FR-002
// Change: revise-artifact-taxonomy
// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/claude-integration/spec.md
// Requirements implemented: FR-023
// Change: revise-artifact-taxonomy
// @mspec-delta 2026-05-18-074640-rename-fr-002-doc-type-title/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-002
// Change: rename-fr-002-doc-type-title

import { basename } from 'node:path';
import { parseDeltaSpec } from '../parser/delta-spec.js';
import { parseFrontmatter } from '../parser/frontmatter.js';

const SKIPPED_PLACEHOLDER_MARKER = '<!-- mspec: skipped step -->';

/**
 * Allowed values for the `doc_type:` YAML frontmatter field of any mspec artifact.
 * Single source of truth for `mspec validate` doc_type enforcement.
 *
 * - Diátaxis types: Reference / Explanation / How-to / Tutorial
 * - AI-Internal: primary consumer is the AI agent, not a human reviewer
 */
export const VALID_DOC_TYPES = [
  'Reference',
  'Explanation',
  'How-to',
  'Tutorial',
  'AI-Internal',
] as const;

export type ValidDocType = (typeof VALID_DOC_TYPES)[number];

const VALID_DOC_TYPES_LIST = VALID_DOC_TYPES.join(', ');

/**
 * Filenames excluded from doc_type frontmatter enforcement.
 * - Delta Spec files (spec.md under specs/) are machine artifacts without doc_type.
 * - architecture-overview.md historically has no doc_type and is enforced by the
 *   separate Mermaid-fence rule.
 */
function isDocTypeExempt(filePath: string, produces: string): boolean {
  if (produces.includes('specs/') && filePath.endsWith('/spec.md')) return true;
  const name = basename(filePath);
  if (name === 'architecture-overview.md') return true;
  return false;
}

export interface ValidateArtifactInput {
  filePath: string;
  contents: string;
  produces: string;
  constitutionRequired: boolean;
  /** When true, Summary placeholder detection escalates from warning to error. */
  strict?: boolean;
}

/**
 * Prefix applied to warning-level issues returned by validateArtifact.
 * validate.ts uses this to surface warnings without failing the exit code (unless --strict).
 */
export const WARNING_PREFIX = '[warning] ';

/**
 * Validate a single artifact file's structure.
 * Returns a list of issues (empty if valid).
 * Issues prefixed with WARNING_PREFIX are warnings; all others are errors.
 * Skipped placeholders are auto-accepted and skip constitution checks.
 */
export function validateArtifact(input: ValidateArtifactInput): string[] {
  const { filePath, contents, produces, constitutionRequired, strict = false } = input;
  const issues: string[] = [];

  if (contents.includes(SKIPPED_PLACEHOLDER_MARKER)) {
    return []; // Skipped placeholder is valid and exempt from all further checks
  }

  // Delta spec validation
  if (produces.includes('specs/') && filePath.endsWith('/spec.md')) {
    const { warnings } = parseDeltaSpec(contents);
    issues.push(...warnings.map((w) => `delta-spec: ${w}`));
    // Constitution checks not required on delta specs (machine artifact)
    return issues;
  }

  // architecture-overview.md: Mermaid fenced block is MUST (FR-017, non-strict hard fail)
  if (filePath.endsWith('/architecture-overview.md')) {
    if (!hasMermaidFence(contents)) {
      issues.push(
        `architecture-overview.md must contain at least one mermaid fenced code block in ${filePath}`,
      );
    }
  }

  // doc_type frontmatter enforcement (cli-spec-lint FR-015 / artifact-taxonomy FR-001 + FR-002)
  if (!isDocTypeExempt(filePath, produces)) {
    issues.push(...validateDocType(filePath, contents));
  }

  // readme.md Summary placeholder detection (claude-integration FR-023)
  // If the Summary section exists but contains only the placeholder comment (not real content),
  // emit a warning (default) or error (--strict).
  if (filePath.endsWith('/readme.md') || filePath.endsWith('\\readme.md')) {
    const summaryIssue = validateSummaryPlaceholder(filePath, contents, strict);
    if (summaryIssue) issues.push(summaryIssue);
  }

  // Constitution Check requirement for relevant artifacts
  if (constitutionRequired && !hasConstitutionCheck(contents)) {
    issues.push(
      `constitution check section missing (## Constitution Check) in ${filePath}`,
    );
  }

  return issues;
}

/**
 * Enforce doc_type frontmatter:
 *  - Field MUST be present (cli-spec-lint FR-015 Scenario 3 / artifact-taxonomy FR-001).
 *  - Value MUST be one of VALID_DOC_TYPES (cli-spec-lint FR-015 Scenario 2 / artifact-taxonomy FR-002).
 *
 * Files without any YAML frontmatter are skipped (status concern, not validate concern;
 * change-discovery only feeds existing files here).
 */
function validateDocType(filePath: string, contents: string): string[] {
  // Files lacking YAML frontmatter entirely are not the concern of this rule —
  // many ad-hoc artifacts (changelogs, etc.) live without frontmatter.
  if (!/^---\s*\n/.test(contents)) return [];

  const issues: string[] = [];
  let data: Record<string, unknown> = {};
  try {
    ({ data } = parseFrontmatter(contents));
  } catch {
    // Malformed frontmatter — surface as an issue without crashing validate.
    return [`malformed YAML frontmatter in ${filePath}`];
  }

  const value = data.doc_type;
  if (value === undefined || value === null) {
    issues.push(
      `doc_type field is missing in ${filePath}; required to be one of ${VALID_DOC_TYPES_LIST}`,
    );
    return issues;
  }

  if (typeof value !== 'string' || !(VALID_DOC_TYPES as readonly string[]).includes(value)) {
    issues.push(
      `${value} is not a valid doc_type; allowed: ${VALID_DOC_TYPES_LIST} (in ${filePath})`,
    );
  }

  return issues;
}

/**
 * Detect when a readme.md has a `## Summary (Lessons / Next Steps)` section
 * that contains only the placeholder comment inserted by mspec-new (not real content).
 *
 * Placeholder markers (ja + en):
 *   <!-- archive ステップで AI が生成 -->
 *   <!-- archive step will auto-fill -->
 *
 * Returns an issue string (prefixed with WARNING_PREFIX in non-strict mode, bare in strict)
 * or null if no issue.
 */
function validateSummaryPlaceholder(
  filePath: string,
  contents: string,
  strict: boolean,
): string | null {
  const SUMMARY_HEADING = '## Summary (Lessons / Next Steps)';
  const headingIdx = contents.indexOf(SUMMARY_HEADING);
  if (headingIdx === -1) return null; // No Summary section — rule does not apply

  // Extract text after the heading up to the next ## heading (or EOF)
  const afterHeading = contents.slice(headingIdx + SUMMARY_HEADING.length);
  const nextH2Match = /^##\s+\S/m.exec(afterHeading);
  const sectionBody = nextH2Match
    ? afterHeading.slice(0, nextH2Match.index)
    : afterHeading;

  // Strip whitespace and HTML comments to see if any real text remains
  const stripped = sectionBody
    .replace(/<!--[\s\S]*?-->/g, '') // remove all HTML comments
    .replace(/\s+/g, '')             // collapse all whitespace
    .trim();

  if (stripped.length > 0) return null; // Real content is present — no issue

  // Only placeholder (or empty section) — emit warning or error
  const msg = `readme.md: Summary section not filled — run archive step to generate Lessons/Next Steps (in ${filePath})`;
  return strict ? msg : `${WARNING_PREFIX}${msg}`;
}

function hasConstitutionCheck(contents: string): boolean {
  return /^##\s+Constitution Check\b/m.test(contents);
}

function hasMermaidFence(contents: string): boolean {
  return /^(`{3,}|~{3,})\s*mermaid(\b|$)/m.test(contents);
}

export { SKIPPED_PLACEHOLDER_MARKER };
