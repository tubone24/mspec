---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: fix-anchor-change-dir-lookup

## Summary

`text-mask.ts` に `blankOutStringLiterals` 関数を追加し、JS/TS のテンプレートリテラル内部を空白でマスクする。`anchor.ts` の `parseAnchors` がこの関数をマスクチェーンに組み込むことで、テストファイルのテストデータ内の `@mspec-delta` が偽陽性として検出されなくなる。

## Technical Context

- **影響ファイル（修正）**: `packages/cli/src/lib/text-mask.ts`、`packages/cli/src/parser/anchor.ts`
- **影響ファイル（テスト追加）**: `packages/cli/src/lib/text-mask.test.ts`（新規 or 追記）
- **アンカー追記**: `packages/cli/src/parser/anchor.test.ts` に FR-018 アンカーを追加
- **依存関係**: 既存の `blankOutFences`、`blankOutHtmlComments` と同一の「改行保持・同一長さ空白置換」契約

## Project Structure

```
packages/cli/src/lib/text-mask.ts
  + blankOutStringLiterals(input: string): string
      状態: inTemplate: boolean, escaped: boolean
      動作: バッククォートで開き、バッククォートで閉じる間の文字を空白化（\n は \n のまま）

packages/cli/src/parser/anchor.ts
  parseAnchors() L39 マスクチェーン:
    before: blankOutHtmlComments(blankOutFences(contents))
    after:  blankOutStringLiterals(blankOutHtmlComments(blankOutFences(contents)))

packages/cli/src/lib/text-mask.test.ts  ← テスト追加
  - バッククォート内の @mspec-delta がマスクされる
  - 行コメント内の @mspec-delta はマスクされない
  - 改行が保持される
  - エスケープされたバッククォート (\`) の処理

packages/cli/src/parser/anchor.test.ts  ← アンカー追記
  @mspec-delta FR-018 アンカーブロックをファイル先頭に追加
```

## `blankOutStringLiterals` API

```typescript
/**
 * Blank out JS/TS template literal contents (backtick strings).
 * Newlines within the literal are preserved; all other characters become spaces.
 * Opening and closing backticks are kept so offset counting stays valid.
 */
export function blankOutStringLiterals(input: string): string
```

**ステート変数:**

| 変数 | 型 | 意味 |
|------|-----|------|
| `inTemplate` | `boolean` | バッククォート文字列内部にいるか |
| `escaped` | `boolean` | 直前に `\` を見たか（次の1文字を無条件にマスク or スキップ） |

**ステート遷移:**

| 現在状態 | 入力文字 | 次状態 | 出力 |
|----------|----------|--------|------|
| NORMAL | `` ` `` | IN_TEMPLATE | `` ` `` （そのまま） |
| NORMAL | その他 | NORMAL | そのまま |
| IN_TEMPLATE | `\` | IN_TEMPLATE (escaped=true) | ` `（空白） |
| IN_TEMPLATE (escaped) | 任意 | IN_TEMPLATE (escaped=false) | `\n` → `\n`、その他 → ` ` |
| IN_TEMPLATE | `` ` `` | NORMAL | `` ` `` （そのまま） |
| IN_TEMPLATE | `\n` | IN_TEMPLATE | `\n` （保持） |
| IN_TEMPLATE | その他 | IN_TEMPLATE | ` `（空白） |

**既知の制限（受け入れ済み）:**
- `//` 行コメント内のバッククォートがあると次行以降がマスクされる可能性がある。ただし `SCAN_LINES_MAX = 30` の範囲内で実アンカーがこのパターンを持つ可能性は極めて低く、bugfix スコープとして許容する。

## マスクチェーン適用順序

```
parseAnchors(contents, sourceFile):
  1. blankOutFences(contents)         — ``` / ~~~ フェンスコードブロック
  2. blankOutHtmlComments(...)        — <!-- --> HTML コメント
  3. blankOutStringLiterals(...)      — ` ` テンプレートリテラル  ← NEW
  4. line-by-line scan (SCAN_LINES_MAX=30)
```

## Decisions

### D-01: テンプレートリテラルのみをマスク対象とする

受け入れ基準（FR-018 Scenario 対応）:

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| テストデータを無視 | テンプレートリテラル内に `@mspec-delta` 3行ブロック | `parseAnchors` 実行 | アンカーとして認識されない |
| 行コメントアンカーは保持 | ファイル先頭に `// @mspec-delta ...` 行コメント | `parseAnchors` 実行 | 正常にアンカーとして認識される |

### D-02: 既存マスクチェーン契約の継承

`blankOutFences` / `blankOutHtmlComments` と同じ「改行保持・同一長さ空白置換」契約を持つ。これにより `source_line` の行番号計算に影響を与えない。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK | OK — `text-mask.ts` への純粋追加。他モジュールへの破壊的変更なし |
| II 決定論的マージ | OK | OK — 同一入力に対して常に同一出力（純粋関数） |
| III 質問駆動の要件確定 | OK | OK — 実装方式をユーザーと合意済み（Option B を承認） |
| IV 双方向アンカー | OK | OK — `anchor.test.ts` に FR-018 アンカーを実装時に追記する |
| V 強制ステップと拡張ステップの分離 | OK | OK — bugfix モードの強制ステップ（research）実施済み |

### Complexity Tracking

None
