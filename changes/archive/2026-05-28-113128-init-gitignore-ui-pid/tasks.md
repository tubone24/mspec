# Tasks: init-gitignore-ui-pid

## Phase 1: Setup

<!-- No setup tasks — no new dependencies or config changes required. -->

## Phase 2: Foundational

### T001: Create `.mspec/.gitignore` template file

Create `packages/cli/templates/mspec-gitignore` as a static template containing `ui.pid`.

```
anchor:
  @mspec-delta 2026-05-28-113128-init-gitignore-ui-pid/specs/cli-init/spec.md
  Requirements implemented: FR-012
  Change: init-gitignore-ui-pid
```

**Files:**
- `packages/cli/templates/mspec-gitignore` — 新規作成

**Content:**
```
# mspec runtime-generated files
ui.pid
```

## Phase 3: User Story

### T002: Write failing E2E tests for FR-012 (red)

Write E2E tests for all 3 FR-012 scenarios in `packages/cli/tests/e2e/init-gitignore.e2e.test.ts`. Tests must fail (red) before implementation.

Run `mspec test --expect-red T002 --change 2026-05-28-113128-init-gitignore-ui-pid` to record red evidence.

```
anchor:
  @mspec-delta 2026-05-28-113128-init-gitignore-ui-pid/specs/cli-init/spec.md
  Requirements implemented: FR-012
  Change: init-gitignore-ui-pid
```

**Files:**
- `packages/cli/tests/e2e/init-gitignore.e2e.test.ts` — 新規作成

**Scenarios to cover:**
1. `T002-S1`: Fresh init creates `.mspec/.gitignore` with `ui.pid` line
2. `T002-S2`: Existing `.mspec/.gitignore` is not overwritten without `--force`
3. `T002-S3`: `mspec init --force` regenerates `.mspec/.gitignore` with `ui.pid` line

### T003: Implement PlannedFile[] entry in `init.ts` (green)

Add `.mspec/.gitignore` entry to the `PlannedFile[]` array in `packages/cli/src/commands/init.ts`. Add `@mspec-delta` anchor comment.

Run `mspec test --expect-green T002 --change 2026-05-28-113128-init-gitignore-ui-pid` to record green evidence.

```
anchor:
  @mspec-delta 2026-05-28-113128-init-gitignore-ui-pid/specs/cli-init/spec.md
  Requirements implemented: FR-012
  Change: init-gitignore-ui-pid
```

**Files:**
- `packages/cli/src/commands/init.ts` — 修正

**Implementation:**
```typescript
// @mspec-delta 2026-05-28-113128-init-gitignore-ui-pid/specs/cli-init/spec.md
// Requirements implemented: FR-012
// Change: init-gitignore-ui-pid
{
  from: join(templatesDir, 'mspec-gitignore'),
  to: join(root, '.mspec', '.gitignore'),
},
```

## Phase 4: Polish

### T004: Verify regression tests pass

Run existing init tests to confirm FR-001, FR-004, FR-005, FR-006 regressions are absent.

**Commands:**
```bash
npx vitest run packages/cli/src/commands/init.test.ts
npx vitest run packages/cli/tests/e2e/init-global-link.e2e.test.ts
npx vitest run packages/cli/tests/e2e/init-agent-install.e2e.test.ts
```

**Checklist regression items (from checklist.md):**
- [ ] FR-004 regression: root `.gitignore` への `.mspec/cache/` 追記が `.mspec/.gitignore` 生成と干渉しないこと <!-- verify: regression-FR-004 -->
- [ ] FR-005 regression: `--force` なしの collisions チェックが依然として機能すること <!-- verify: regression-FR-005 -->
- [ ] FR-006 regression: `--force` 時の既存アーティファクト上書きが正常に動作すること <!-- verify: regression-FR-006 -->
- [ ] FR-001 regression: `PlannedFile[]` 追加が `config.yaml` / `workflow.yaml` 生成に干渉しないこと <!-- verify: regression-FR-001 -->

## Constitution Check

> Step: tasks | Constitution Version: 1.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | T001〜T004 はそれぞれ単独で完結。他チェンジへの副作用なし |
| II. 決定論的マージ | ✅ | タスクは順序付き（T001→T002→T003→T004）で決定論的に実行可能 |
| III. 質問駆動の要件確定 | ✅ | FR-012 の3シナリオがすべてタスクに対応付けられている |
| IV. 双方向アンカー | ✅ | T001/T002/T003 すべてに `@mspec-delta` アンカーブロックを記載 |
| V. 強制ステップと拡張ステップの分離 | ✅ | `workflow.yaml` 変更なし。既存ステップへの拡張のみ |
| VI. Security by Default | ✅ | T004 でセキュリティ関連の回帰テスト（FR-004 混同リスク）を明示 |

<!-- LEARNING: E2Eテストを T00N-S1/S2/S3 のサブシナリオとして番号付けすると Delta Spec シナリオとのトレーサビリティが向上する | source: FR-012 | confidence: medium -->
