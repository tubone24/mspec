// @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-001, FR-002
// Change: diataxis-artifact-structure

// @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/artifact-templates-i18n/spec.md
// Requirements implemented: FR-005
// Change: fix-locale-spec-language

// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-001, FR-002, FR-004, FR-005
// Change: revise-artifact-taxonomy

// @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-001, FR-007
// Change: deprecate-ai-internal-doc-type

// @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-015
// Change: deprecate-ai-internal-doc-type

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/parser/frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '../../templates/artifacts');

const VALID_DOC_TYPES = [
  'Reference',
  'Explanation',
  'How-to',
  'Tutorial',
] as const;

const EXPECTED_DOC_TYPES: Record<string, string> = {
  'proposal.ja.md': 'Explanation',
  'proposal.en.md': 'Explanation',
  'research.ja.md': 'Reference',
  'research.en.md': 'Reference',
  'design.ja.md': 'Reference',
  'design.en.md': 'Reference',
  'design-rationale.ja.md': 'Explanation',
  'design-rationale.en.md': 'Explanation',
  'tasks.ja.md': 'Reference',
  'tasks.en.md': 'Reference',
  'checklist.ja.md': 'Reference',
  'checklist.en.md': 'Reference',
  'quickstart.ja.md': 'How-to',
  'quickstart.en.md': 'How-to',
  'architecture-overview.ja.md': 'Reference',
  'architecture-overview.en.md': 'Reference',
  'readme.ja.md': 'Tutorial',
  'readme.en.md': 'Tutorial',
  'glossary.ja.md': 'Reference',
  'glossary.en.md': 'Reference',
};

// FR-001: All artifact templates MUST declare doc_type in YAML frontmatter
describe('FR-001: artifact templates have doc_type frontmatter', () => {
  for (const [filename, expectedType] of Object.entries(EXPECTED_DOC_TYPES)) {
    it(`${filename} has doc_type: ${expectedType}`, async () => {
      const content = await readFile(join(TEMPLATES_DIR, filename), 'utf8');
      const { data } = parseFrontmatter(content);
      expect(data).toHaveProperty('doc_type');
      expect(data.doc_type).toBe(expectedType);
    });
  }
});

// FR-002: doc_type value is constrained to four Diátaxis doc types
describe('FR-002: doc_type values are one of the four Diátaxis doc types', () => {
  for (const filename of Object.keys(EXPECTED_DOC_TYPES)) {
    it(`${filename} doc_type is one of Reference/Explanation/How-to/Tutorial`, async () => {
      const content = await readFile(join(TEMPLATES_DIR, filename), 'utf8');
      const { data } = parseFrontmatter(content);
      expect(VALID_DOC_TYPES).toContain(data.doc_type as string);
    });
  }
});
