// @mspec-delta 2026-05-28-112728-improve-postmortem-quality/specs/mspec-lessons-analyzer/spec.md
// Requirements implemented: FR-003
// Change: improve-postmortem-quality

// @mspec-delta 2026-05-28-112728-improve-postmortem-quality/specs/mspec-nextaction-planner/spec.md
// Requirements implemented: FR-003
// Change: improve-postmortem-quality

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// project root is two levels up from packages/cli
const PROJECT_ROOT = resolve(process.cwd(), '..', '..');

describe('FR-003: improve-postmortem-quality — agent definition verification', () => {
  it('mspec-lessons-analyzer: concreteness detection logic is present', async () => {
    const agentPath = join(PROJECT_ROOT, '.claude', 'agents', 'mspec-lessons-analyzer.md');
    const content = await readFile(agentPath, 'utf8');

    // Verify concreteness detection step is present
    expect(content).toContain('Concreteness detection');
    // Verify signal types are defined
    expect(content).toContain('Tool names');
    expect(content).toContain('File names');
    // Verify pass-through logic is present
    expect(content).toContain('pass-through');
    // Verify abstraction is limited to one step
    expect(content).toContain('Maximum one level');
  });

  it('mspec-nextaction-planner: request_summary field is present in output contract', async () => {
    const agentPath = join(PROJECT_ROOT, '.claude', 'agents', 'mspec-nextaction-planner.md');
    const content = await readFile(agentPath, 'utf8');

    // Verify request_summary field is in the output contract
    expect(content).toContain('request_summary');
    // Verify injection prevention constraint is present
    expect(content).toContain('shell injection');
    // Verify 100-character limit is documented
    expect(content).toContain('100');
  });

  it('mspec-archive: --request flag is present in step 6', async () => {
    const skillPath = join(PROJECT_ROOT, '.claude', 'skills', 'mspec-archive', 'SKILL.md');
    const content = await readFile(skillPath, 'utf8');

    // Verify --request flag is present
    expect(content).toContain('--request');
    // Verify fallback is documented
    expect(content).toContain('フォールバック');
    // Verify changes/ scope restriction is preserved
    expect(content).toContain('changes/');
  });
});
