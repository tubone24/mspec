// @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-017
// Change: claude-core-completion

import { describe, it, expect } from 'vitest';
import { validateArtifact } from '../../src/lib/artifact-validator.js';

const CHANGE_DIR = '/fake/changes/2026-05-14-test';

// ── FR-017: Mermaid ブロック欠落で validate が失敗 ──────────────────────

describe('FR-017: architecture-overview.md Mermaid validation', () => {
  it('Mermaid ブロック欠落で validate エラーを報告する', () => {
    const contents = `# Architecture Overview

## Overview

Some prose description.

\`\`\`text
Not a mermaid block
\`\`\`

More prose.
`;
    const issues = validateArtifact({
      filePath: `${CHANGE_DIR}/architecture-overview.md`,
      contents,
      produces: 'architecture-overview.md',
      constitutionRequired: false,
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => /mermaid/i.test(i))).toBe(true);
  });

  it('Mermaid ブロックがあれば要件を満たす（エラーなし）', () => {
    const contents = `# Architecture Overview

## Overview

\`\`\`mermaid
graph TD
    A --> B
\`\`\`
`;
    const issues = validateArtifact({
      filePath: `${CHANGE_DIR}/architecture-overview.md`,
      contents,
      produces: 'architecture-overview.md',
      constitutionRequired: false,
    });
    expect(issues.filter((i) => /mermaid/i.test(i))).toHaveLength(0);
  });

  it('チルダフェンスの mermaid ブロックも有効', () => {
    const contents = `# Architecture Overview

~~~mermaid
graph LR
    A --> B
~~~
`;
    const issues = validateArtifact({
      filePath: `${CHANGE_DIR}/architecture-overview.md`,
      contents,
      produces: 'architecture-overview.md',
      constitutionRequired: false,
    });
    expect(issues.filter((i) => /mermaid/i.test(i))).toHaveLength(0);
  });

  it('mermaid の後に属性が続いても検出する', () => {
    const contents = `# Architecture Overview

\`\`\`mermaid {title="system"}
graph TD
    A --> B
\`\`\`
`;
    const issues = validateArtifact({
      filePath: `${CHANGE_DIR}/architecture-overview.md`,
      contents,
      produces: 'architecture-overview.md',
      constitutionRequired: false,
    });
    expect(issues.filter((i) => /mermaid/i.test(i))).toHaveLength(0);
  });

  it('text タグ付きフェンスは Mermaid とみなさない', () => {
    const contents = `# Architecture Overview

\`\`\`text
This is text, not mermaid
\`\`\`
`;
    const issues = validateArtifact({
      filePath: `${CHANGE_DIR}/architecture-overview.md`,
      contents,
      produces: 'architecture-overview.md',
      constitutionRequired: false,
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it('タグなしフェンスは Mermaid とみなさない', () => {
    const contents = `# Architecture Overview

\`\`\`
some code
\`\`\`
`;
    const issues = validateArtifact({
      filePath: `${CHANGE_DIR}/architecture-overview.md`,
      contents,
      produces: 'architecture-overview.md',
      constitutionRequired: false,
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it('通常の validate（非 strict）でもハードフェイルする', () => {
    // Architecture-overview.md Mermaid check is NOT --strict-only (D3)
    const contents = `# Architecture Overview\n\nNo Mermaid here.\n`;
    const issues = validateArtifact({
      filePath: `${CHANGE_DIR}/architecture-overview.md`,
      contents,
      produces: 'architecture-overview.md',
      constitutionRequired: false, // constitutionRequired=false simulates non-strict
    });
    expect(issues.length).toBeGreaterThan(0);
  });
});
