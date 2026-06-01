---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: fix-test-results-webui-display

## Summary

テスト結果が WebUI に表示されない問題を 2 層で修正する。
①`mspec test-results convert` CLI コマンドを追加して test-results.json を生成できるようにする（FR-012）、
②API が change not found 時に 404 ではなく 200 [] を返すよう修正し WebUI の graceful fallback を確保する（FR-011）、
③Playwright / Jest / Vitest の 3 ランナー形式に対応する（FR-013）。

---

## Technical Context

### 現状の問題

| レイヤー | 現状 | 不足 |
|---------|------|------|
| CLI (`index.ts`) | `mspec test expect-red/green` のみ登録 | `mspec test-results convert` コマンドが未登録 |
| CLI (`testResults.ts`) | `convertTestResults()` が実装・テスト済みだが孤立 | CLI エントリポイントから呼ばれていない |
| CLI (`testResults.ts`) | Playwright JSON 形式のみ対応 | Jest / Vitest 形式の検出・変換ロジックがない |
| Server (`routes/testResults.ts:61`) | `findChange` null → `reply.code(404)` | FR-011「ページが 404 にならない」に違反 |
| Frontend (`TestResults.tsx:30`) | `error` state → 赤エラー文言 | change not found でも "No test results found." を表示すべき |

---

## API Contract

### `GET /api/changes/:id/test-results` (修正)

| 条件 | 変更前 | 変更後 |
|------|--------|--------|
| change が見つからない | `404 { error: "Change not found" }` | `200 []` |
| test-results.json が存在しない | `200 []`（既存・正常） | 変更なし |
| test-results.json が存在する | `200 TestCase[]`（既存・正常） | 変更なし |

**変更箇所**: `packages/cli/src/server/routes/testResults.ts:61`

```typescript
// Before
if (!change) {
  return reply.code(404).send({ error: 'Change not found' });
}

// After
if (!change) {
  return reply.code(200).send([]);
}
```

---

## CLI コマンド設計 (FR-012)

### `mspec test-results convert --change <id>`

**登録箇所**: `packages/cli/src/index.ts`

```typescript
program
  .command('test-results')
  .command('convert')
  .requiredOption('--change <id>', 'Change directory name')
  .action(async (opts) => {
    const change = findChange(opts.change);
    if (!change) {
      console.error(`Change not found: ${opts.change}`);
      process.exit(1);
    }
    await convertTestResults(change.dir);
    console.log(`✓ test-results.json written to ${change.dir}`);
  });
```

---

## ランナー形式検出ロジック (FR-013)

**変更箇所**: `packages/cli/src/commands/testResults.ts`

### フォーマット判定ヒューリスティック

```typescript
type RunnerFormat = 'playwright' | 'jest' | 'vitest' | 'unknown';

function detectRunnerFormat(raw: unknown): RunnerFormat {
  if (!raw || typeof raw !== 'object') return 'unknown';
  const obj = raw as Record<string, unknown>;
  // Playwright: top-level "suites" array (unique to Playwright)
  if (Array.isArray(obj.suites)) return 'playwright';
  if (Array.isArray(obj.testResults)) {
    // Vitest: top-level "snapshot" object (unique to Vitest, absent in Jest)
    if (obj.snapshot !== undefined) return 'vitest';
    // Jest: "testFilePath" string in each testResults entry (absent in Vitest which uses "name")
    const first = (obj.testResults as unknown[])[0];
    if (first && typeof first === 'object') {
      const r = first as Record<string, unknown>;
      if (typeof r.testFilePath === 'string') return 'jest';
    }
  }
  return 'unknown';
}
```

### ステータスマッピング

| ランナー | ソースステータス | → mspec ステータス |
|---------|----------------|------------------|
| Playwright | `passed` | `green` |
| Playwright | `failed` | `red` |
| Playwright | `skipped` | `skip` |
| Jest | `passed` | `green` |
| Jest | `failed` | `red` |
| Jest | `pending` / `todo` | `skip` |
| Vitest | `passed` | `green` |
| Vitest | `failed` | `red` |
| Vitest | `pending` / `todo` | `skip` |

> Vitest の `--reporter=json` は Jest 互換形式を採用しており、ステータス値は Jest と同一（`passed / failed / pending / todo`）。検出は top-level `"snapshot"` フィールドの有無で行う。

---

## フロントエンド修正 (FR-011)

**変更箇所**: `packages/web-ui/src/pages/TestResults.tsx:30`

```typescript
// Before
if (error) return <div className="p-8 text-red-500">Error loading test results.</div>;

// After
if (error) return (
  <div className="p-8 text-muted-foreground" data-testid="no-results">
    {t('testResults.noResults')}
  </div>
);
```

---

## Decisions

| 決定 | 詳細 | 対応シナリオ |
|------|------|------------|
| API を `200 []` に変更 | change not found でも空配列を返すことで SPA が graceful に動作 | FR-011 シナリオ2 |
| フロント error state を "No test results found." に変更 | 赤エラー文言を廃止。ユーザーには「結果なし」と表示 | FR-011 シナリオ2 |
| CLI コマンドを `mspec test-results convert` とする | 既存の `mspec test` サブコマンド体系と一致 | FR-012 シナリオ1 |
| フォーマット検出をヒューリスティックで行う | `suites[]` → Playwright, `tasks` → Vitest, `testFilePath` → Jest | FR-013 シナリオ1-3 |
| 不明フォーマット時は exit(1) | 変換失敗を明示的に通知し、誤った test-results.json を生成しない | FR-013 シナリオ4 |

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 | 備考 |
|------|---------|---------|------|
| I. ステップ独立性 | ✅ | ✅ | research → design の依存は正常 |
| II. 決定論的マージ | ✅ | ✅ | FR-011/012/013 の FR-ID は一意 |
| III. 質問駆動の要件確定 | ✅ | ✅ | 汎用ランナー対応はユーザーとのやりとりで確定 |
| IV. 双方向アンカー | ⚠️ | ⚠️ | アンカーは implement ステップで付与予定。現時点では未適用 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | FR-011（バグ修正）と FR-012/013（機能追加）は分離済み |
| VI. Security by Default | ✅ | ✅ | スタックトレースのパスマスク（FR-010）は変更なし |
| VII. 設計意図と実装の対応確認 | ✅ | ✅ | design-rationale.md で採用理由を明記 |

### Complexity Tracking

None.

<!-- LEARNING: change not found 時の API 挙動を 404→200[] に変更するパターンは SPA の graceful fallback に有効。フロントの `!res.ok` throw パターンと組み合わせると 404 がエラー扱いになるため、SPA では 200+空データが推奨 | source: FR-011 | confidence: high -->

---

## Self-Review

> Reviewed: 2026-05-31

### Summary

FR-011/012/013 のチェックリスト項目と verify アノテーションは網羅されており、リグレッションリスク FR（FR-001/003/005/006/007/010）にも対応項目がある。1 件のブロッカー（Vitest 検出ヒューリスティックの誤り）は本セクション追記前に修正済み。2 件の警告（Constitution IV の WARN への引き下げ、Jest/Vitest stack_trace 抽出パスの未定義）は design.md の修正と tasks.md での対応事項として記録する。

### Findings

- [ok] FR Coverage: FR-011/012/013 すべてに `verify:` アノテーション付きチェックリスト項目あり
- [ok] Scenario Coverage: 各 FR の GIVEN/WHEN/THEN シナリオがチェックリスト項目にマッピング済み
- [ok] Regression Coverage: FR-001/003/005/006/007/010 にリグレッションリスク対応項目あり
- [ok] Architecture Consistency: architecture-overview.md の図と design.md の決定事項は整合（file 参照誤りは architecture-overview.md 修正済み）
- [ok] Vitest 検出ヒューリスティック修正済み: `tasks` → `snapshot` トップレベルフィールドに変更。Vitest ステータス値も Jest 互換（`passed/failed/pending`）に修正済み
- [warning] Jest/Vitest `stack_trace` 抽出パスが未定義: `failureMessages` → `stack_trace` のマッピングは implement ステップで明示的に実装・テストすること（checklist FR-010 の `verify: human` 項目で管理）
- [warning] Constitution IV は WARN に修正済み: アンカーは implement ステップで付与予定

### Verdict

PASS_WITH_WARNINGS
