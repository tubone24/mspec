---
doc_type: Reference
---

# Tasks: fix-command-name-consistency

## Phase 1: Setup

- [x] T001 [P] ハイフン形式残存ベースラインを計測する — files: `(shell)`
      実行: `grep -r "/mspec-" .claude/ packages/cli/ .mspec/ docs/ README.md specs/ 2>/dev/null | grep -v "Binary" | wc -l`
      期待: 件数 > 0（修正前は多数ヒットする）

## Phase 2: Foundational — ランタイム スキル・コマンドファイル（FR-017）

### Tests-first (E2E)

- [x] T010 E2E for FR-017 "Skill instructs user to run next step in colon format" — files: `(shell)`
      `grep -r "/mspec-" .claude/skills/ .claude/commands/ 2>/dev/null | grep -v "Binary"`
      期待: 実装前は件数 > 0（RED）
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md
        Requirements implemented: FR-017
        Change: fix-command-name-consistency

### Implementation

- [x] T011 FR-017 ランタイム スキルファイル（11ファイル）の `when_to_use:` とプロシージャ本文を修正 — files: `.claude/skills/mspec-new/SKILL.md`, `.claude/skills/mspec-proposal/SKILL.md`, `.claude/skills/mspec-delta/SKILL.md`, `.claude/skills/mspec-research/SKILL.md`, `.claude/skills/mspec-design/SKILL.md`, `.claude/skills/mspec-quickstart/SKILL.md`, `.claude/skills/mspec-checklist/SKILL.md`, `.claude/skills/mspec-tasks/SKILL.md`, `.claude/skills/mspec-implement/SKILL.md`, `.claude/skills/mspec-archive/SKILL.md`, `.claude/skills/mspec-review/SKILL.md`
      変換: `when_to_use: User runs /mspec-<step>` → `/mspec:<step>`、`run /mspec-continue` → `run /mspec:continue`
      保護: `name: mspec-<step>` は変更しない
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md
        Requirements implemented: FR-017
        Change: fix-command-name-consistency

- [x] T012 FR-017 ランタイム コマンドファイル（12ファイル）の `/mspec-continue` 等を修正 — files: `.claude/commands/mspec/new.md`, `.claude/commands/mspec/proposal.md`, `.claude/commands/mspec/delta.md`, `.claude/commands/mspec/research.md`, `.claude/commands/mspec/design.md`, `.claude/commands/mspec/quickstart.md`, `.claude/commands/mspec/checklist.md`, `.claude/commands/mspec/tasks.md`, `.claude/commands/mspec/implement.md`, `.claude/commands/mspec/review.md`, `.claude/commands/mspec/archive.md`, `.claude/commands/mspec/continue.md`
      変換: `run /mspec-continue` → `run /mspec:continue`（各ファイルのプロシージャ末尾）
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md
        Requirements implemented: FR-017
        Change: fix-command-name-consistency

### Verify (E2E GREEN)

- [x] T013 E2E for FR-017 "grep で残存ゼロを確認" — files: `(shell)`
      `grep -r "/mspec-" .claude/skills/ .claude/commands/ 2>/dev/null | grep -v "Binary"`
      期待: 出力なし（GREEN）
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md
        Requirements implemented: FR-017
        Change: fix-command-name-consistency

## Phase 3: User Story 1 — CLI テンプレート・ソース（FR-001）

### Tests-first (E2E)

- [x] T101 E2E for FR-001 "テンプレートファイルにハイフン形式が存在しない" — files: `(shell)`
      `grep -r "/mspec-" packages/cli/templates/ .mspec/workflow.yaml 2>/dev/null | grep -v "Binary"`
      期待: 実装前は件数 > 0（RED）
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
        Requirements implemented: FR-001
        Change: fix-command-name-consistency

### Implementation

- [x] T102 FR-001 CLI テンプレート コマンドファイル（12ファイル）を修正 — files: `packages/cli/templates/claude/commands/mspec/new.md`, `packages/cli/templates/claude/commands/mspec/proposal.md`, `packages/cli/templates/claude/commands/mspec/delta.md`, `packages/cli/templates/claude/commands/mspec/research.md`, `packages/cli/templates/claude/commands/mspec/design.md`, `packages/cli/templates/claude/commands/mspec/quickstart.md`, `packages/cli/templates/claude/commands/mspec/checklist.md`, `packages/cli/templates/claude/commands/mspec/tasks.md`, `packages/cli/templates/claude/commands/mspec/implement.md`, `packages/cli/templates/claude/commands/mspec/review.md`, `packages/cli/templates/claude/commands/mspec/archive.md`, `packages/cli/templates/claude/commands/mspec/continue.md`
      T012 と同一の変換内容をテンプレートに適用
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
        Requirements implemented: FR-001
        Change: fix-command-name-consistency

- [x] T103 FR-001 CLI テンプレート スキルファイル（11ファイル）を修正 — files: `packages/cli/templates/claude/skills/mspec-*/SKILL.md`
      T011 と同一の変換内容をテンプレートに適用（`name:` は保護）
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
        Requirements implemented: FR-001
        Change: fix-command-name-consistency

- [x] T104 FR-001 ワークフロー設定ファイル（2ファイル）の `command:` フィールドを修正 — files: `.mspec/workflow.yaml`, `packages/cli/templates/workflow.default.yaml`
      変換: `command: /mspec-<step>` → `command: /mspec:<step>`
      保護: `skill: mspec-<step>` は変更しない
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
        Requirements implemented: FR-001
        Change: fix-command-name-consistency

- [x] T105 FR-001 CLI ソースとテストフィクスチャ（3ファイル）を修正 — files: `packages/cli/src/commands/init.ts`, `packages/cli/src/commands/new.ts`, `packages/cli/src/commands/archive.test.ts`
      - `init.ts:238`: `'run /mspec-new <feature>'` → `'run /mspec:new <feature>'`
      - `new.ts:41`: `'next: run /mspec-proposal'` → `'next: run /mspec:proposal'`
      - `archive.test.ts:12–43`: フィクスチャ内 `command: /mspec-<step>` をコロン形式に修正
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
        Requirements implemented: FR-001
        Change: fix-command-name-consistency

### Verify (E2E GREEN)

- [x] T106 E2E for FR-001 "テンプレート・CLI ソースのハイフン形式が 0件" — files: `(shell)`
      `grep -r "/mspec-" packages/cli/ .mspec/workflow.yaml 2>/dev/null | grep -v "Binary"`
      期待: 出力なし（GREEN）
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
        Requirements implemented: FR-001
        Change: fix-command-name-consistency

## Phase 3: User Story 2 — ドキュメント・仕様書（FR-002）

### Tests-first (E2E)

- [x] T201 E2E for FR-002 "README.md のコマンド例がコロン形式" — files: `(shell)`
      `grep -r "/mspec-" docs/ README.md specs/ 2>/dev/null | grep -v "Binary"`
      期待: 実装前は件数 > 0（RED）
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
        Requirements implemented: FR-002
        Change: fix-command-name-consistency

### Implementation

- [x] T202 FR-002 ドキュメントファイル（2ファイル）を修正 — files: `README.md`, `docs/design/mspec-design.md`
      ワークフロー図・手順説明内の `/mspec-XXX` スラッシュコマンド参照をコロン形式に修正
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
        Requirements implemented: FR-002
        Change: fix-command-name-consistency

- [x] T203 FR-002 SoT 仕様書（2ファイル）を直接修正 — files: `specs/claude-integration/spec.md`, `specs/cli-init/spec.md`
      FR 本文・Scenario 内の `/mspec-continue` 等のスラッシュコマンド参照をコロン形式に修正
      `@mspec-delta` アンカートークンと `mspec-researcher` 等のサブエージェント名は変更しない
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
        Requirements implemented: FR-002
        Change: fix-command-name-consistency

### Verify (E2E GREEN)

- [x] T204 E2E for FR-002 "ドキュメント内ハイフン形式が 0件" — files: `(shell)`
      `grep -r "/mspec-" docs/ README.md specs/ 2>/dev/null | grep -v "Binary"`
      期待: 出力なし（GREEN）
      anchor:
        @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
        Requirements implemented: FR-002
        Change: fix-command-name-consistency

## Phase 4: Polish

- [x] T301 [P] 全スコープ最終 grep 確認 — files: `(shell)`
      `grep -r "/mspec-" .claude/ packages/cli/ .mspec/workflow.yaml docs/ README.md specs/ 2>/dev/null | grep -v "Binary"`
      期待: 出力なし（0件）

- [x] T302 [P] npm test でリグレッションがないことを確認 — files: `packages/cli/`
      `cd packages/cli && npm test`
      期待: 全テストが GREEN

- [x] T303 [P] サブエージェント名・スキル識別子が保護されていることを確認 — files: `(shell)`
      `grep -r "mspec-researcher\|mspec-checklist-auditor\|name: mspec-" .claude/ packages/cli/templates/ 2>/dev/null | wc -l`
      期待: 0 より大きい値（これらは変更してはいけない）

## Dependencies

- T010 blocks T011
- T011 blocks T012
- T012 blocks T013
- T101 blocks T102
- T102 blocks T103
- T103 blocks T104
- T104 blocks T105
- T105 blocks T106
- T201 blocks T202
- T202 blocks T203
- T203 blocks T204
- T013, T106, T204 block T301
- T301 blocks T302

## Constitution Check

> Step: tasks | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 各タスクは独立したファイル群を修正；タスク間の副作用なし |
| II. 決定論的マージ | ✅ | — | grep 0件が明確な完了条件；置換ルールが Decision 1 で確定済み |
| III. 質問駆動の要件確定 | ✅ | — | スコープ・対象ファイル・完了基準はすべて proposal と design で確定済み |
| IV. 双方向アンカー | ✅ | — | 全 impl/E2E タスクに `@mspec-delta` アンカーを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | 既存ファイルの文字列修正のみ；workflow.yaml の構造変更なし |

### Complexity Tracking

None
