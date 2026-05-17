// @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-001, FR-002
// Change: diataxis-artifact-structure

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/parser/frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '../../templates/artifacts');

const VALID_DOC_TYPES = ['Reference', 'Explanation', 'How-to', 'Tutorial'] as const;

const EXPECTED_DOC_TYPES: Record<string, string> = {
  'proposal.md': 'Explanation',
  'research.md': 'Reference',
  'design.md': 'Reference',
  'tasks.md': 'Reference',
  'checklist.md': 'Reference',
  'quickstart.md': 'How-to',
  'architecture-overview.md': 'Reference',
  'readme.md': 'Reference',
  'glossary.md': 'Reference',
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

// FR-002: doc_type value is constrained to four Diátaxis types
describe('FR-002: doc_type values are valid Diátaxis types', () => {
  for (const filename of Object.keys(EXPECTED_DOC_TYPES)) {
    it(`${filename} doc_type is one of Reference/Explanation/How-to/Tutorial`, async () => {
      const content = await readFile(join(TEMPLATES_DIR, filename), 'utf8');
      const { data } = parseFrontmatter(content);
      expect(VALID_DOC_TYPES).toContain(data.doc_type as string);
    });
  }
});
