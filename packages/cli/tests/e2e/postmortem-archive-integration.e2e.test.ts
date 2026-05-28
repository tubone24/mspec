// @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: postmortem-archive-integration

// @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-lessons-analyzer/spec.md
// Requirements implemented: FR-001, FR-002
// Change: postmortem-archive-integration

// @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/memory-constitution/spec.md
// Requirements implemented: FR-001, FR-002
// Change: postmortem-archive-integration

// @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-nextaction-planner/spec.md
// Requirements implemented: FR-001, FR-002
// Change: postmortem-archive-integration

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SKILLS_DIR = join(process.cwd(), '../../.claude/skills');
const TEMPLATES_DIR = join(process.cwd(), '../../../packages/cli/templates/claude/skills');

describe('postmortem-archive-integration: SKILL.md files', () => {
  describe('mspec-lessons-analyzer skill', () => {
    it('SKILL.md exists at runtime path', async () => {
      // FR-001: Lessons 分析フロー（サブエージェント起動）
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-lessons-analyzer/SKILL.md'),
        'utf-8'
      );
      expect(content).toBeTruthy();
    });

    it('SKILL.md contains @mspec-delta anchor for FR-001', async () => {
      // Principle IV: 双方向アンカー
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-lessons-analyzer/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('@mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-lessons-analyzer/spec.md');
      expect(content).toContain('FR-001, FR-002');
    });

    it('SKILL.md contains fixed enum target_section constraint', async () => {
      // FR-002: 提案エントリのフォーマット（target_section は固定 enum）
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-lessons-analyzer/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('"Core Principles"');
      expect(content).toContain('"Additional Constraints"');
    });

    it('SKILL.md declares read-only (no write operations)', async () => {
      // Security: サブエージェントは書き込み禁止
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-lessons-analyzer/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('読み取り専用');
    });
  });

  describe('mspec-nextaction-planner skill', () => {
    it('SKILL.md exists at runtime path', async () => {
      // FR-001: Next Steps 評価フロー
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-nextaction-planner/SKILL.md'),
        'utf-8'
      );
      expect(content).toBeTruthy();
    });

    it('SKILL.md contains kebab-case normalization pattern', async () => {
      // FR-002: kebab-case フィーチャー名の正規化（インジェクション防止）
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-nextaction-planner/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
    });

    it('SKILL.md prohibits using original text as kebab_name', async () => {
      // Security: コマンドインジェクション防止
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-nextaction-planner/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('元テキストをそのまま');
    });
  });

  describe('mspec-archive skill postmortem hook', () => {
    it('SKILL.md contains postmortem-hook version marker (postmortem-hook: v1)', async () => {
      // FR-001, FR-002, FR-003, FR-004: ポストモーテムフック実装完了マーカー
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-archive/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('postmortem-hook: v1');
    });

    it('SKILL.md contains postmortem hook section', async () => {
      // FR-001, FR-002: Lessons/Next Steps フロー
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-archive/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('ポストモーテムフック');
    });

    it('SKILL.md contains MUST NOT write guard', async () => {
      // FR-003: ユーザー承認なしの自動書き込み禁止
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-archive/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('MUST NOT');
    });

    it('SKILL.md contains mspec-lessons-analyzer subagent invocation', async () => {
      // FR-001: サブエージェントをインライン起動
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-archive/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('mspec-lessons-analyzer');
    });

    it('SKILL.md contains mspec-nextaction-planner subagent invocation', async () => {
      // FR-002: サブエージェントをインライン起動
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-archive/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('mspec-nextaction-planner');
    });

    it('archive SKILL.md has @mspec-delta anchor for postmortem change', async () => {
      // Principle IV: 双方向アンカー
      const content = await readFile(
        join(SKILLS_DIR, 'mspec-archive/SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('@mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md');
    });
  });

  describe('template sync verification', () => {
    it('lessons-analyzer template matches runtime', async () => {
      // T-013: runtime と template の同期確認
      const [runtime, template] = await Promise.all([
        readFile(join(SKILLS_DIR, 'mspec-lessons-analyzer/SKILL.md'), 'utf-8'),
        readFile(join(process.cwd(), 'templates/claude/skills/mspec-lessons-analyzer/SKILL.md'), 'utf-8'),
      ]);
      expect(runtime).toBe(template);
    });

    it('nextaction-planner template matches runtime', async () => {
      // T-013: runtime と template の同期確認
      const [runtime, template] = await Promise.all([
        readFile(join(SKILLS_DIR, 'mspec-nextaction-planner/SKILL.md'), 'utf-8'),
        readFile(join(process.cwd(), 'templates/claude/skills/mspec-nextaction-planner/SKILL.md'), 'utf-8'),
      ]);
      expect(runtime).toBe(template);
    });
  });
});
