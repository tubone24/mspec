---
doc_type: Tutorial
---

# Tasks: fix-anchor-change-dir-lookup

## Phase 1: Setup

### T-001: text-mask.test.ts のインポート更新

`packages/cli/src/lib/text-mask.test.ts` の import 文に `blankOutStringLiterals` を追加する準備をする（関数実装前はインポートエラーが出るが、テストをまず書く）。

- **File**: `packages/cli/src/lib/text-mask.test.ts:2`
- **Action**: `blankOutStringLiterals` をインポート対象に追加する（RED 状態を用意）

---

## Phase 2: Foundational

### T-002: [RED] `blankOutStringLiterals` のユニットテストを書く

`packages/cli/src/lib/text-mask.test.ts` に `describe('blankOutStringLiterals', ...)` ブロックを追加する。関数がまだ存在しないためテストは FAIL する。

```
anchor:
@mspec-delta 2026-05-18-120853-fix-anchor-change-dir-lookup/specs/cli-anchor/spec.md
Requirements implemented: FR-018
Change: fix-anchor-change-dir-lookup
```

**テストケース（4件）:**

1. バッククォート内の `@mspec-delta` が空白化される
   ```ts
   const input = 'const src = `\n@mspec-delta foo/specs/bar/spec.md\n`;\n';
   // @mspec-delta 行が空白に置き換わること
   ```
2. `//` 行コメント内の `@mspec-delta` はマスクされない
   ```ts
   const input = '// @mspec-delta foo/specs/bar/spec.md\n';
   // 行がそのまま保持されること
   ```
3. テンプレートリテラル内の改行が保持される（行数不変）
   ```ts
   const input = '`\nline1\nline2\n`';
   // split('\n').length が入出力で同一
   ```
4. エスケープされたバッククォート（`` \` ``）でリテラルが閉じない
   ```ts
   const input = '`hello \\` world`';
   // 全内容が空白化され、外側の内容には影響しない
   ```

- **File**: `packages/cli/src/lib/text-mask.test.ts`

### T-003: [GREEN] `blankOutStringLiterals` を `text-mask.ts` に実装する

`packages/cli/src/lib/text-mask.ts` に以下の関数を追加し T-002 のテストを全部 PASS させる。

```
anchor:
@mspec-delta 2026-05-18-120853-fix-anchor-change-dir-lookup/specs/cli-anchor/spec.md
Requirements implemented: FR-018
Change: fix-anchor-change-dir-lookup
```

**実装仕様（design.md:D-01 ステート遷移表より）:**

```typescript
export function blankOutStringLiterals(input: string): string {
  let result = '';
  let inTemplate = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (escaped) {
      result += inTemplate ? (ch === '\n' ? '\n' : ' ') : ch;
      escaped = false;
      continue;
    }
    if (inTemplate) {
      if (ch === '\\') { escaped = true; result += ' '; continue; }
      if (ch === '`') { inTemplate = false; result += ch; continue; }
      result += ch === '\n' ? '\n' : ' ';
    } else {
      if (ch === '`') { inTemplate = true; result += ch; }
      else result += ch;
    }
  }
  return result;
}
```

- **File**: `packages/cli/src/lib/text-mask.ts`
- **Verify**: `npx vitest run packages/cli/src/lib/text-mask.test.ts` が全 PASS

---

## Phase 3: User Story

### T-004: [RED] FR-018 Scenario 1 の統合テストを anchor.test.ts に追加する

`packages/cli/src/parser/anchor.test.ts` に新しいテストケースを追加する。`anchor.ts` がまだ `blankOutStringLiterals` を使っていないため FAIL する。

```
anchor:
@mspec-delta 2026-05-18-120853-fix-anchor-change-dir-lookup/specs/cli-anchor/spec.md
Requirements implemented: FR-018
Change: fix-anchor-change-dir-lookup
```

**テスト内容:**

```ts
it('ignores @mspec-delta inside template literal (FR-018 Scenario 1)', () => {
  // テンプレートリテラルの中に偽アンカーブロックがある
  const src = [
    'const src = `',
    ' * @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md',
    ' * Requirements implemented: FR-005',
    ' * Change: apply-css',
    '`;',
  ].join('\n');
  const { anchors, warnings } = parseAnchors(src, 'anchor.test.ts');
  expect(anchors).toHaveLength(0);
  expect(warnings).toHaveLength(0);
});
```

- **File**: `packages/cli/src/parser/anchor.test.ts`

### T-005: [RED] FR-018 Scenario 2 の統合テストを anchor.test.ts に追加する

行コメントのアンカーとテンプレートリテラル内のフェイクアンカーが共存する場合に、行コメントのアンカーのみが検出されることを確認する。

```
anchor:
@mspec-delta 2026-05-18-120853-fix-anchor-change-dir-lookup/specs/cli-anchor/spec.md
Requirements implemented: FR-018
Change: fix-anchor-change-dir-lookup
```

**テスト内容:**

```ts
it('detects real line-comment anchor but ignores fake template literal anchor (FR-018 Scenario 2)', () => {
  const src = [
    '// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md',
    '// Requirements implemented: FR-005',
    '// Change: apply-css',
    'const fake = `',
    ' @mspec-delta 2026-05-14-093015-apply-css/specs/other/spec.md',
    ' Requirements implemented: FR-999',
    ' Change: apply-css',
    '`;',
  ].join('\n');
  const { anchors } = parseAnchors(src, 'test.ts');
  expect(anchors).toHaveLength(1);
  expect(anchors[0]?.capability).toBe('theme-engine');
});
```

- **File**: `packages/cli/src/parser/anchor.test.ts`

### T-006: [GREEN] `parseAnchors` のマスクチェーンに `blankOutStringLiterals` を追加する

`packages/cli/src/parser/anchor.ts:39` のマスクチェーンを更新し、T-004/T-005 を PASS させる。

```
anchor:
@mspec-delta 2026-05-18-120853-fix-anchor-change-dir-lookup/specs/cli-anchor/spec.md
Requirements implemented: FR-018
Change: fix-anchor-change-dir-lookup
```

**変更内容:**

```ts
// Before (anchor.ts:39)
const masked = blankOutHtmlComments(blankOutFences(contents));

// After
import { blankOutFences, blankOutHtmlComments, blankOutStringLiterals } from '../lib/text-mask.js';
const masked = blankOutStringLiterals(blankOutHtmlComments(blankOutFences(contents)));
```

- **File**: `packages/cli/src/parser/anchor.ts:1,39`
- **Verify**: `npx vitest run packages/cli/src/parser/anchor.test.ts` が全 PASS

---

## Phase 4: Polish

### T-007: `anchor.test.ts` に FR-018 アンカーブロックを追加する（双方向アンカー）

`packages/cli/src/parser/anchor.test.ts` のファイル先頭（imports の前）に FR-018 への `@mspec-delta` アンカーを追加する。

```
anchor:
@mspec-delta 2026-05-18-120853-fix-anchor-change-dir-lookup/specs/cli-anchor/spec.md
Requirements implemented: FR-018
Change: fix-anchor-change-dir-lookup
```

**追加内容（ファイル先頭）:**

```ts
// @mspec-delta 2026-05-18-120853-fix-anchor-change-dir-lookup/specs/cli-anchor/spec.md
// Requirements implemented: FR-018
// Change: fix-anchor-change-dir-lookup
import { describe, it, expect } from 'vitest';
```

- **File**: `packages/cli/src/parser/anchor.test.ts:1`

### T-008: 全テストスイートと `mspec anchor-check` で検証する

```
anchor:
@mspec-delta 2026-05-18-120853-fix-anchor-change-dir-lookup/specs/cli-anchor/spec.md
Requirements implemented: FR-018
Change: fix-anchor-change-dir-lookup
```

1. `npx vitest run` — 全テストが PASS すること
2. `mspec anchor-check` — `anchor.test.ts` から `change_dir not found` エラーが報告されなくなること
3. `archive.test.ts` の既存アンカーが `anchor-check` で正常に認識されること（リグレッションなし）

- **File**: (コマンド実行のみ)

---

## Constitution Check

| Principle | Phase 0 |
|-----------|---------|
| I ステップ独立性 | OK — tasks.md は design.md を入力とし、他の変更中チェンジに依存しない |
| II 決定論的マージ | OK — タスク順序は一意。同一 design.md から常に同一 tasks.md を生成できる |
| III 質問駆動の要件確定 | OK — FR-018 実装方針はユーザーと合意済み（research.md に記録） |
| IV 双方向アンカー | OK — T-007 で `anchor.test.ts` への FR-018 アンカー追加が明示されている |
| V 強制ステップと拡張ステップの分離 | OK — bugfix モードの強制 research 実施済み。quickstart スキップも記録済み |
