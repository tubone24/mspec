// @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/cli-init-command/spec.md
// Requirements implemented: FR-004
// Change: rename-visual-mock-to-prototype

import { describe, it, expect } from 'vitest';
import { access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// FR-004 Scenario: init 実行時にサブエージェントがインストールされる
describe('T201: FR-004 — mspec-visual-prototype-runner.md exists in agents template', () => {
  it('templates/claude/agents/mspec-visual-prototype-runner.md exists for mspec init to install', async () => {
    const templatePath = join(
      __dirname,
      '../../templates/claude/agents/mspec-visual-prototype-runner.md',
    );
    await expect(access(templatePath)).resolves.toBeUndefined();
  });
});
