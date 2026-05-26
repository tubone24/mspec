---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

# Tasks: risk-tier-field

## Phase 1: Setup

- [x] T001 [P] E2E テストファイルのスケルトン作成 — files: `tests/e2e/delta-spec-risk-tier.e2e.test.ts`, `tests/e2e/verify-routing-prompt.e2e.test.ts`

## Phase 2: Foundational — CLI 実装（型定義 → パーサー → バリデータ）

### Tests-first (E2E)

- [x] T101 E2E for delta-spec FR-001/FR-002/FR-003 "risk_tier/blast_radius のパースと standard デフォルト" — files: `tests/e2e/delta-spec-risk-tier.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md
        Requirements implemented: FR-001, FR-002, FR-003
        Change: risk-tier-field

- [x] T102 E2E for delta-spec FR-004 "無効 risk_tier 値で errors 非空" — files: `tests/e2e/delta-spec-risk-tier.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md
        Requirements implemented: FR-004
        Change: risk-tier-field

- [x] T103 E2E for delta-spec FR-005 "無効 blast_radius 値で errors 非空" — files: `tests/e2e/delta-spec-risk-tier.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md
        Requirements implemented: FR-005
        Change: risk-tier-field

- [x] T104 E2E for verify-routing FR-003 "trivial FR が checklist に出現したら warning" — files: `tests/e2e/delta-spec-risk-tier.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-003
        Change: risk-tier-field

### Implementation

- [x] T110 `types/delta-spec.ts` に risk_tier/blast_radius フィールドを Zod スキーマで追加 — files: `src/types/delta-spec.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md
        Requirements implemented: FR-001, FR-002, FR-003
        Change: risk-tier-field

- [x] T111 `parser/delta-spec.ts` の `collectRequirements()` に RISK_TIER_RE / BLAST_RADIUS_RE 正規表現パースを追加（T101 green） — files: `src/parser/delta-spec.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md
        Requirements implemented: FR-001, FR-002, FR-003
        Change: risk-tier-field

- [x] T112 `artifact-validator.ts` に errors[] フィールドを追加し、無効 risk_tier/blast_radius 値を errors に追加して exit code 1 を返す（T102/T103 green） — files: `src/lib/artifact-validator.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md
        Requirements implemented: FR-004, FR-005
        Change: risk-tier-field

- [x] T113 `artifact-validator.ts` に trivial FR が checklist.md に出現した場合の warning チェックを追加（T104 green） — files: `src/lib/artifact-validator.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-003
        Change: risk-tier-field

## Phase 3: User Story — テンプレート・エージェントプロンプト更新

### Tests-first (E2E)

- [x] T201 E2E for verify-routing FR-001 "delta init で risk_tier/blast_radius プレースホルダーが生成される" — files: `tests/e2e/delta-spec-risk-tier.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-001
        Change: risk-tier-field

- [x] T202 E2E for verify-routing FR-002 "mspec-tasks/SKILL.md に risk_tier 分岐ルールが記述されている" — files: `tests/e2e/verify-routing-prompt.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-002
        Change: risk-tier-field

- [x] T203 E2E for verify-routing FR-003 "mspec-checklist-auditor.md に trivial スキップ・critical verify: human ルールが記述されている" — files: `tests/e2e/verify-routing-prompt.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-003
        Change: risk-tier-field

- [x] T204 E2E for verify-routing FR-004 "mspec-implement/SKILL.md に critical 未達警告ルールが記述されている" — files: `tests/e2e/verify-routing-prompt.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-004
        Change: risk-tier-field

- [x] T205 E2E for verify-routing FR-005 "risk_tier 未記載 FR の後方互換動作" — files: `tests/e2e/delta-spec-risk-tier.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-005
        Change: risk-tier-field

### Implementation

- [x] T210 `templates/artifacts/delta-spec.ja.md` に risk_tier/blast_radius プレースホルダーコメントを追加（T201 green） — files: `templates/artifacts/delta-spec.ja.md`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-001
        Change: risk-tier-field

- [x] T211 `templates/claude/skills/mspec-tasks/SKILL.md` に risk_tier 分岐ルールを追記（T202 green） — files: `templates/claude/skills/mspec-tasks/SKILL.md`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-002
        Change: risk-tier-field

- [x] T212 `templates/claude/agents/mspec-checklist-auditor.md` に trivial スキップ・critical verify: human ルールを追記（T203 green） — files: `templates/claude/agents/mspec-checklist-auditor.md`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-003
        Change: risk-tier-field

- [x] T213 `templates/claude/skills/mspec-implement/SKILL.md` に critical FR の verify: human 未達警告ルールを追記（T204 green） — files: `templates/claude/skills/mspec-implement/SKILL.md`
      anchor:
        @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md
        Requirements implemented: FR-004
        Change: risk-tier-field

## Phase 4: Polish

- [ ] T301 [P] `mspec init` で `.claude/` 側が `templates/claude/` から正しく再インストールされることを手動確認（install スクリプトの動作確認）
- [ ] T302 [P] quickstart.md に `mspec delta init` 実行でプレースホルダーが自動挿入される旨を補記

## Dependencies

- T110 blocks T111
- T110 blocks T112
- T110 blocks T113
- T111 blocks T101（green 確認）
- T112 blocks T102, T103（green 確認）
- T113 blocks T104（green 確認）
- T210 blocks T201（green 確認）
- T211 blocks T202（green 確認）
- T212 blocks T203（green 確認）
- T213 blocks T204（green 確認）

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | tasks.md は design.md と checklist.md のみを参照して生成されている |
| II. 決定論的マージ | ✅ | — | tasks.md は Reference ドキュメント。SoT spec にマージされない |
| III. 質問駆動の要件確定 | ✅ | — | 全設計判断は AskUserQuestion で確定済み |
| IV. 双方向アンカー | ✅ | — | 全実装・E2E タスクに @mspec-delta アンカーを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | ステップ構造変更なし。tasks ステップは強制ステップ |

### Complexity Tracking

None
