import { parseDeltaSpec } from '../parser/delta-spec.js';

const SKIPPED_PLACEHOLDER_MARKER = '<!-- mspec: skipped step -->';

export interface ValidateArtifactInput {
  filePath: string;
  contents: string;
  produces: string;
  constitutionRequired: boolean;
}

/**
 * Validate a single artifact file's structure.
 * Returns a list of issues (empty if valid).
 * Skipped placeholders are auto-accepted and skip constitution checks.
 */
export function validateArtifact(input: ValidateArtifactInput): string[] {
  const { filePath, contents, produces, constitutionRequired } = input;
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

  // Constitution Check requirement for relevant artifacts
  if (constitutionRequired && !hasConstitutionCheck(contents)) {
    issues.push(
      `constitution check section missing (## Constitution Check) in ${filePath}`,
    );
  }

  return issues;
}

function hasConstitutionCheck(contents: string): boolean {
  return /^##\s+Constitution Check\b/m.test(contents);
}

function hasMermaidFence(contents: string): boolean {
  return /^(`{3,}|~{3,})\s*mermaid(\b|$)/m.test(contents);
}

export { SKIPPED_PLACEHOLDER_MARKER };
