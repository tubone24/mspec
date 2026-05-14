import { describe, it, expect } from 'vitest';
import { parseDeltaSpec } from './delta-spec.js';

const SAMPLE = `# Delta Spec: theme-engine

## ADDED Requirements

### Requirement: FR-005 — Stylesheet applied on init
The system MUST apply the user stylesheet when the engine boots.

#### Scenario: Apply on first load
- GIVEN no stylesheet has been applied
- WHEN the engine boots
- THEN the stylesheet is injected into the document

### Requirement: FR-006 — Hot reload of stylesheet
The system SHOULD reload the stylesheet on file change.

#### Scenario: Reload on change
- GIVEN the stylesheet file is being watched
- WHEN the file contents change
- THEN the stylesheet is reloaded

## MODIFIED Requirements

### Requirement: FR-002 — Theme selection
The system MUST persist the selected theme.

#### Scenario: Persist on selection
- GIVEN a user picks a theme
- WHEN they reload the page
- THEN the same theme is applied

## REMOVED Requirements

### Requirement: FR-001 — Legacy theme picker
Replaced by FR-002.

## RENAMED Requirements

### Requirement: FR-003 — Old name -> FR-003 — New name
`;

describe('parseDeltaSpec', () => {
  it('extracts ADDED/MODIFIED/REMOVED/RENAMED requirements', () => {
    const { spec, warnings } = parseDeltaSpec(SAMPLE);
    expect(warnings).toEqual([]);
    expect(spec.capability).toBe('theme-engine');
    expect(spec.added.map((r) => r.fr_id)).toEqual(['FR-005', 'FR-006']);
    expect(spec.modified.map((r) => r.fr_id)).toEqual(['FR-002']);
    expect(spec.removed.map((r) => r.fr_id)).toEqual(['FR-001']);
    expect(spec.renamed.map((r) => r.fr_id)).toEqual(['FR-003']);
  });

  it('extracts scenarios under requirements', () => {
    const { spec } = parseDeltaSpec(SAMPLE);
    expect(spec.added[0]?.scenarios).toHaveLength(1);
    expect(spec.added[0]?.scenarios[0]?.name).toBe('Apply on first load');
    expect(spec.added[0]?.scenarios[0]?.lines.length).toBeGreaterThanOrEqual(3);
  });

  it('warns when H3 under a section does not match Requirement: FR-NNN — Title', () => {
    const src = `# Delta Spec: cap-a

## ADDED Requirements

### Some random heading
no FR ID here
`;
    const { warnings, spec } = parseDeltaSpec(src);
    expect(warnings.length).toBeGreaterThan(0);
    expect(spec.added).toHaveLength(0);
  });

  it('uses capabilityHint when H1 cannot be parsed', () => {
    const src = `# Not a delta spec heading

## ADDED Requirements

### Requirement: FR-001 — X
content
`;
    const { spec } = parseDeltaSpec(src, 'override-cap');
    expect(spec.capability).toBe('override-cap');
  });
});
