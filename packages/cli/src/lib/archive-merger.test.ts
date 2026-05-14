import { describe, it, expect } from 'vitest';
import { parseDeltaSpec } from '../parser/delta-spec.js';
import { mergeDeltaIntoSpec, createEmptySpec } from './archive-merger.js';

function makeDelta(body: string): string {
  return `# Delta Spec: theme-engine\n\n${body}\n`;
}

const SOURCE_TEMPLATE = `# Capability: theme-engine

<!-- mspec: gaps in FR numbering are intentional. Removed in changes/archive/ -->

## Purpose

The theme engine renders user-selected themes.

## Requirements

### Requirement: FR-001 — Theme picker
The system MUST allow theme selection.

#### Scenario: Pick a theme
- GIVEN a list of themes
- WHEN the user picks one
- THEN it is applied

### Requirement: FR-002 — Persistence
The system MUST persist the theme.

#### Scenario: Persist on reload
- GIVEN a chosen theme
- WHEN the page reloads
- THEN it is reapplied
`;

describe('archive-merger', () => {
  it('appends ADDED requirements to ## Requirements section', () => {
    const delta = parseDeltaSpec(
      makeDelta(`## ADDED Requirements

### Requirement: FR-003 — Hot reload
The system SHOULD reload on change.

#### Scenario: Reload on file change
- GIVEN watched file
- WHEN it changes
- THEN reload happens
`),
    ).spec;

    const { output, summary, errors } = mergeDeltaIntoSpec(delta, SOURCE_TEMPLATE);
    expect(errors).toEqual([]);
    expect(summary.added).toBe(1);
    expect(output).toContain('### Requirement: FR-003 — Hot reload');
    // FR-001, FR-002 are still present
    expect(output).toContain('### Requirement: FR-001 — Theme picker');
    expect(output).toContain('### Requirement: FR-002 — Persistence');
    // Appended at end of Requirements section (after FR-002)
    const idx001 = output.indexOf('FR-001');
    const idx002 = output.indexOf('FR-002');
    const idx003 = output.indexOf('FR-003');
    expect(idx001).toBeLessThan(idx002);
    expect(idx002).toBeLessThan(idx003);
  });

  it('fails when ADDED requirement already exists', () => {
    const delta = parseDeltaSpec(
      makeDelta(`## ADDED Requirements

### Requirement: FR-001 — Duplicate
duplicate
`),
    ).spec;
    const { errors, summary } = mergeDeltaIntoSpec(delta, SOURCE_TEMPLATE);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/FR-001/);
    expect(summary.added).toBe(0);
  });

  it('replaces MODIFIED requirements with the delta block', () => {
    const delta = parseDeltaSpec(
      makeDelta(`## MODIFIED Requirements

### Requirement: FR-002 — Persistence with sync
The system MUST persist and sync the theme.

#### Scenario: Sync on reload
- GIVEN a chosen theme
- WHEN the page reloads
- THEN it is reapplied and synced
`),
    ).spec;
    const { output, summary, errors } = mergeDeltaIntoSpec(delta, SOURCE_TEMPLATE);
    expect(errors).toEqual([]);
    expect(summary.modified).toBe(1);
    expect(output).toContain('### Requirement: FR-002 — Persistence with sync');
    expect(output).not.toContain('### Requirement: FR-002 — Persistence\n');
    expect(output).toContain('Sync on reload');
  });

  it('fails when MODIFIED target does not exist', () => {
    const delta = parseDeltaSpec(
      makeDelta(`## MODIFIED Requirements

### Requirement: FR-099 — Ghost
nope
`),
    ).spec;
    const { errors, summary } = mergeDeltaIntoSpec(delta, SOURCE_TEMPLATE);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/FR-099/);
    expect(summary.modified).toBe(0);
  });

  it('removes REMOVED requirements and keeps the FR-NNN as a gap (no renumber)', () => {
    const delta = parseDeltaSpec(
      makeDelta(`## REMOVED Requirements

### Requirement: FR-001 — Theme picker
Replaced.
`),
    ).spec;
    const { output, summary, errors } = mergeDeltaIntoSpec(delta, SOURCE_TEMPLATE);
    expect(errors).toEqual([]);
    expect(summary.removed).toBe(1);
    expect(output).not.toContain('### Requirement: FR-001');
    // FR-002 remains and is NOT renumbered to FR-001
    expect(output).toContain('### Requirement: FR-002 — Persistence');
    // Add another delta with ADDED FR-004, ensure no auto FR-001 reuse
    const delta2 = parseDeltaSpec(
      makeDelta(`## ADDED Requirements

### Requirement: FR-004 — Another
body

#### Scenario: x
- GIVEN a
- WHEN b
- THEN c
`),
    ).spec;
    const r2 = mergeDeltaIntoSpec(delta2, output);
    expect(r2.errors).toEqual([]);
    // FR-001 must not reappear as a new requirement
    expect(r2.output).not.toContain('### Requirement: FR-001');
    expect(r2.output).toContain('### Requirement: FR-004');
  });

  it('fails when REMOVED target does not exist', () => {
    const delta = parseDeltaSpec(
      makeDelta(`## REMOVED Requirements

### Requirement: FR-555 — Ghost
nope
`),
    ).spec;
    const { errors } = mergeDeltaIntoSpec(delta, SOURCE_TEMPLATE);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/FR-555/);
  });

  it('renames RENAMED requirements: only the title changes, FR-NNN unchanged', () => {
    const delta = parseDeltaSpec(
      makeDelta(`## RENAMED Requirements

### Requirement: FR-002 — Persistence -> FR-002 — Theme persistence
`),
    ).spec;
    const { output, summary, errors } = mergeDeltaIntoSpec(delta, SOURCE_TEMPLATE);
    expect(errors).toEqual([]);
    expect(summary.renamed).toBe(1);
    expect(output).toContain('### Requirement: FR-002 — Theme persistence');
    expect(output).not.toContain('### Requirement: FR-002 — Persistence\n');
    // Body lines should be retained
    expect(output).toContain('The system MUST persist the theme.');
  });

  it('fails when RENAMED target does not exist', () => {
    const delta = parseDeltaSpec(
      makeDelta(`## RENAMED Requirements

### Requirement: FR-777 — Old -> FR-777 — New
`),
    ).spec;
    const { errors } = mergeDeltaIntoSpec(delta, SOURCE_TEMPLATE);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/FR-777/);
  });

  it('all-or-nothing: ANY error blocks all summary counts from non-zero', () => {
    // Combine a valid ADDED with an invalid MODIFIED in one delta
    const delta = parseDeltaSpec(
      makeDelta(`## ADDED Requirements

### Requirement: FR-010 — Will not be applied
body

#### Scenario: x
- GIVEN a
- WHEN b
- THEN c

## MODIFIED Requirements

### Requirement: FR-999 — Ghost
body
`),
    ).spec;
    const { errors, summary, output } = mergeDeltaIntoSpec(delta, SOURCE_TEMPLATE);
    expect(errors.length).toBeGreaterThan(0);
    // No partial application: summary all zero & output unchanged
    expect(summary.added).toBe(0);
    expect(summary.modified).toBe(0);
    expect(summary.removed).toBe(0);
    expect(summary.renamed).toBe(0);
    expect(output).toBe(SOURCE_TEMPLATE);
  });

  it('createEmptySpec produces a parseable scaffold with Requirements section', () => {
    const scaffold = createEmptySpec('search');
    expect(scaffold).toContain('# Capability: search');
    expect(scaffold).toContain('## Purpose');
    expect(scaffold).toContain('## Requirements');
    expect(scaffold).toContain('gaps in FR numbering are intentional');
  });

  it('can merge ADDED into a fresh empty scaffold', () => {
    const scaffold = createEmptySpec('search');
    const delta = parseDeltaSpec(
      makeDelta(`## ADDED Requirements

### Requirement: FR-001 — First
body

#### Scenario: x
- GIVEN a
- WHEN b
- THEN c
`),
    ).spec;
    const { errors, summary, output } = mergeDeltaIntoSpec(delta, scaffold);
    expect(errors).toEqual([]);
    expect(summary.added).toBe(1);
    expect(output).toContain('### Requirement: FR-001 — First');
  });
});
