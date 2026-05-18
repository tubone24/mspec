// @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-anchor/spec.md
// Requirements implemented: FR-005, FR-015, FR-016, FR-017
// Change: claude-core-completion
// @mspec-delta 2026-05-18-120853-fix-anchor-change-dir-lookup/specs/cli-anchor/spec.md
// Requirements implemented: FR-018
// Change: fix-anchor-change-dir-lookup

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseAnchors } from '../../src/parser/anchor.js';
import { scanAnchors } from '../../src/lib/anchor-scanner.js';

// ── FR-015: フェンス・HTML コメント内 @mspec-delta は沈黙 ──────────────────

describe('FR-015: fenced/HTML-comment @mspec-delta is silent', () => {
  it('フェンス内の @mspec-delta 例示は警告を出さない', () => {
    const src = [
      'Some documentation:',
      '```',
      '@mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md',
      'Requirements implemented: FR-005',
      'Change: apply-css',
      '```',
      'End of doc.',
    ].join('\n');
    const { anchors, warnings } = parseAnchors(src, 'README.md');
    expect(warnings).toEqual([]);
    expect(anchors).toHaveLength(0);
  });

  it('HTML コメント内の @mspec-delta 例示は警告を出さない', () => {
    const src = [
      '<!-- @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md -->',
      'Normal content',
    ].join('\n');
    const { anchors, warnings } = parseAnchors(src, 'docs.md');
    expect(warnings).toEqual([]);
    expect(anchors).toHaveLength(0);
  });

  it('チルダフェンス内の @mspec-delta も沈黙する', () => {
    const src = [
      '~~~markdown',
      '// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md',
      '// Requirements implemented: FR-005',
      '// Change: apply-css',
      '~~~',
    ].join('\n');
    const { anchors, warnings } = parseAnchors(src, 'guide.md');
    expect(warnings).toEqual([]);
    expect(anchors).toHaveLength(0);
  });

  it('フェンス外の正規アンカーはフェンス内例示がある場合でも正しく検出される', () => {
    const src = [
      '// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md',
      '// Requirements implemented: FR-005',
      '// Change: apply-css',
      '```',
      '// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md',
      '// Requirements implemented: FR-005',
      '// Change: apply-css',
      '```',
    ].join('\n');
    const { anchors, warnings } = parseAnchors(src, 'src/foo.ts');
    expect(warnings).toEqual([]);
    expect(anchors).toHaveLength(1);
  });
});

// ── FR-016: SoT / Delta Spec ファイルはスキャン除外 ──────────────────────

describe('FR-016: spec files are excluded from anchor scan', () => {
  it('specs/<capability>/spec.md は scanAnchors に含まれない', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mspec-fr016-'));
    const specsDir = join(root, 'specs', 'cli-anchor');
    await mkdir(specsDir, { recursive: true });
    await writeFile(
      join(specsDir, 'spec.md'),
      '# Spec\n\n@mspec-delta mentions anchor format here\n',
    );
    const srcDir = join(root, 'src');
    await mkdir(srcDir, { recursive: true });
    await writeFile(
      join(srcDir, 'impl.ts'),
      [
        '// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md',
        '// Requirements implemented: FR-005',
        '// Change: apply-css',
        'export const x = 1;',
      ].join('\n'),
    );
    const { anchors, warnings } = await scanAnchors(root);
    const specWarnings = warnings.filter((w) => w.includes('spec.md'));
    expect(specWarnings).toHaveLength(0);
    expect(anchors.some((a) => a.source_file.includes('specs/'))).toBe(false);
  });

  it('changes/*/specs/**/spec.md は scanAnchors に含まれない', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mspec-fr016-delta-'));
    const deltaDir = join(root, 'changes', '2026-05-14-022259-claude-core-completion', 'specs', 'cli-anchor');
    await mkdir(deltaDir, { recursive: true });
    await writeFile(
      join(deltaDir, 'spec.md'),
      '# Delta Spec\n\n@mspec-delta example text here\n',
    );
    const { anchors, warnings } = await scanAnchors(root);
    const deltaWarnings = warnings.filter((w) => w.includes('spec.md'));
    expect(deltaWarnings).toHaveLength(0);
    expect(anchors.some((a) => a.source_file.includes('changes/'))).toBe(false);
  });
});

// ── FR-017: ブロック形状でない単発言及は沈黙 ────────────────────────────

describe('FR-017: standalone @mspec-delta mention is silent', () => {
  it('後続行に Requirements implemented: がない単発言及は警告を出さない', () => {
    const src = [
      '# How to write anchors',
      '',
      'Use @mspec-delta in your source files.',
      '',
      'The next line is something unrelated.',
      'More text here.',
      'Yet more text.',
      'And more.',
      'And more still.',
      'And even more.',
      'Final line.',
    ].join('\n');
    const { anchors, warnings } = parseAnchors(src, 'docs/guide.md');
    expect(warnings).toEqual([]);
    expect(anchors).toHaveLength(0);
  });

  it('ブロック形状で path が不正なケースは引き続き警告する', () => {
    const src = [
      '// @mspec-delta 2026-05-14-apply-css/specs/theme-engine/spec.md',
      '// Requirements implemented: FR-001',
      '// Change: apply-css',
    ].join('\n');
    // HHMMSS 欠落 → malformed path, but block-shaped → should warn
    const { anchors, warnings } = parseAnchors(src, 'src/foo.ts');
    expect(anchors).toHaveLength(0);
    expect(warnings.length).toBeGreaterThan(0);
  });
});

// ── FR-005 MODIFIED: 単発ドキュメンテーション言及は check を失敗させない ──

describe('FR-005 MODIFIED: standalone doc mention does not cause check failure', () => {
  it('単発の @mspec-delta 散文言及は警告を出さない', () => {
    const src = [
      '# Guide',
      '',
      'Place @mspec-delta anchors at the top of implementation files.',
      '',
      'This is just documentation prose.',
    ].join('\n');
    const { anchors, warnings } = parseAnchors(src, 'CONTRIBUTING.md');
    expect(warnings).toEqual([]);
    expect(anchors).toHaveLength(0);
  });

  it('Change: 行欠落のブロック形状アンカーは不完全として警告する', () => {
    const src = [
      '// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md',
      '// Requirements implemented: FR-005',
      'function foo() {}',
    ].join('\n');
    const { anchors, warnings } = parseAnchors(src, 'src/foo.ts');
    expect(anchors).toHaveLength(0);
    expect(warnings.some((w) => w.includes('incomplete anchor block'))).toBe(true);
  });
});
