---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-001 -->
<!-- Change: revise-artifact-taxonomy -->
<!-- @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-001, FR-007 -->
<!-- Change: deprecate-ai-internal-doc-type -->

# Tasks: <タイトル>

## Phase 1: Setup
- [ ] T001 [P] <task> — files: `path/...`

## Phase 2: Foundational
- [ ] T010 ...

## Phase 3: User Story 1 (P1)
### Tests-first (E2E)
- [ ] T101 E2E for FR-005 "<Scenario Name>" — files: `e2e/apply-css.spec.ts`
      anchor:
        @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
        Requirements implemented: FR-005
        Change: apply-css
### Implementation
- [ ] T102 Implement applyCss() — files: `src/theme/applyCss.ts`
      anchor:
        @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
        Requirements implemented: FR-005, FR-007
        Change: apply-css

## Phase 4: Polish
- [ ] T201 ...

## Dependencies
- T101 blocks T102

## Constitution Check

> Step: tasks | Constitution Version: <ver>

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. <Name>   | ✅/❌/—  | —  | <一行コメント> |
| II. <Name>  | ✅/❌/—  | —  | ... |
| III. <Name> | ✅/❌/—  | —  | ... |

### Complexity Tracking
<❌があった場合、なぜ単純案では足りないかを記述。違反 0 なら "None">
