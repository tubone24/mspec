---
doc_type: Tutorial
---

# Tasks: fix-webui-archive-initial-count

変更対象: `packages/web-ui/src/pages/Dashboard.tsx`（2箇所）  
設計: `design.md` D-01 — `useChanges(true)` 並列クエリ追加、`counts.archived` のデータソース分離

## Phase 1: Setup

### Task 1.1 — TypeScript ビルド確認（変更前ベースライン）

変更前に TypeScript ビルドとリントが通ることを確認し、デグレのベースラインを取る。

```bash
cd packages/web-ui && npx tsc --noEmit && echo "TS OK"
```

**完了条件**: エラーなし

---

## Phase 2: Foundational

_このバグ修正は既存の `useChanges` フックを再利用するため、Foundational フェーズの新規インフラ作業は不要。_

---

## Phase 3: User Story

### Task 3.1 — [E2E] アーカイブ件数初期表示の E2E テスト作成（FR-011）

<!-- verify: fr-011 -->

**TDD 赤フェーズ**: 実装前にテストを書いてレッドを確認する。

新規ファイル: `packages/web-ui/tests/e2e/archive-count-initial.e2e.test.ts`

```typescript
// @mspec-delta 2026-05-31-010428-fix-webui-archive-initial-count/specs/change-dashboard/spec.md
// Requirements implemented: FR-011
// Change: fix-webui-archive-initial-count

import { test, expect } from '@playwright/test';

// T305: change-dashboard FR-011 — Archive count API call fires on initial page load
test('Dashboard: GET /api/changes?includeArchived=true is called on initial load without user interaction', async ({ page }) => {
  const archivedApiCallPromise = page.waitForRequest(
    req => req.url().includes('/api/changes') && req.url().includes('includeArchived=true'),
    { timeout: 5000 },
  );

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // The parallel query for archived count must have fired on mount (not after user click)
  await archivedApiCallPromise;
});

// T306: change-dashboard FR-011 — Archive count badge shows a numeric value on initial load
test('Dashboard: archive count badge contains a number on initial load', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const filterArchived = page.locator('[data-testid="filter-archived"]');
  await expect(filterArchived).toBeVisible();

  // The count text inside the button should be a number (0 or positive integer)
  const countText = await filterArchived.locator('span.mono').textContent();
  expect(Number(countText)).toBeGreaterThanOrEqual(0);
  expect(isNaN(Number(countText))).toBe(false);
});
```

アンカー:
```
@mspec-delta 2026-05-31-010428-fix-webui-archive-initial-count/specs/change-dashboard/spec.md
Requirements implemented: FR-011
Change: fix-webui-archive-initial-count
```

**完了条件**: `pnpm test:e2e archive-count-initial` を実行してテストが FAIL（赤）になること

---

### Task 3.2 — [IMPL] Dashboard.tsx に並列クエリを追加し counts.archived を修正（FR-011）

<!-- verify: fr-011 -->

**TDD 緑フェーズ**: Task 3.1 のテストが PASS になるよう実装する。

ファイル: `packages/web-ui/src/pages/Dashboard.tsx`

**変更1** — 並列クエリ追加（`useChanges(includeArchived)` の直下）:

```typescript
// 既存（変更なし）
const { data: changes = [], isLoading, error } = useChanges(includeArchived);

// 追加: 件数専用クエリ（常時 archived を含む）
const { data: allChanges = [] } = useChanges(true);
```

**変更2** — `counts.archived` のデータソースを `allChanges` に切り替え:

```typescript
const counts = useMemo(() => ({
  inProgress: changes.filter(isInProgress).length,
  ready:      changes.filter(isReady).length,
  shipped:    changes.filter((c) => isShipped(c) && !c.isArchived).length,
  archived:   allChanges.filter((c) => c.isArchived).length,  // ← 修正: allChanges を使う
}), [changes, allChanges]);
```

アンカー:
```
@mspec-delta 2026-05-31-010428-fix-webui-archive-initial-count/specs/change-dashboard/spec.md
Requirements implemented: FR-011
Change: fix-webui-archive-initial-count
```

**完了条件**:
- `pnpm test:e2e archive-count-initial` が PASS（緑）になること
- ブラウザで `http://localhost:3847` を開き、フィルタークリック前からアーカイブ件数バッジに正しい値が表示されること

---

## Phase 4: Polish

### Task 4.1 — [REGRESSION] 既存 archive-filter E2E テストでリグレッション確認（FR-008）

FR-008 のアーカイブフィルタートグル動作が壊れていないことを確認する。

```bash
cd packages/web-ui && pnpm test:e2e archive-filter
```

**完了条件**: T301〜T304 全テストが PASS であること

### Task 4.2 — TypeScript ビルド最終確認

```bash
cd packages/web-ui && npx tsc --noEmit && echo "TS OK"
```

**完了条件**: エラーなし

---

## Constitution Check

| 原則 | Phase 0 | 備考 |
|------|---------|------|
| I. ステップ独立性 | ✅ | tasks.md は design.md・checklist.md のみ参照 |
| II. 決定論的マージ | ✅ | 変更ファイルが1つ（Dashboard.tsx）で衝突リスクなし |
| III. 質問駆動の要件確定 | ✅ | 全タスクで実装詳細（変数名・行数）が確定済み |
| IV. 双方向アンカー | ✅ | Task 3.1/3.2 に `@mspec-delta` アンカーブロックを付与 |
| V. 強制/拡張ステップの分離 | ✅ | bugfix モードで適切にスキップ済み |
| VI. Security by Default | ✅ | 読み取り専用クエリの追加のみ |
| VII. 設計意図と実装の対応確認 | ✅ | Task 3.2 が FR-011 / D-01 / 受け入れ基準テーブルと 1:1 対応 |
