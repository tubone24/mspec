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
| IN_TEMPLATE (escaped) | 任意（`` \` `` を含む） | IN_TEMPLATE (escaped=false) | `\n` → `\n`、`` \` `` → ` `（空白、リテラルを閉じない）、その他 → ` ` |
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

## Self-Review

> Reviewed by: mspec-self-reviewer subagent
> Date: 2026-05-18

### Findings

| # | 種別 | 対象 | 内容 |
|---|------|------|------|
| 1 | ✅ 修正済み | `specs/cli-anchor/spec.md:7` | FR-018 要件文が「シングル/ダブルクォートも対象」と書いていたが、実装はバッククォートのみ。self-review 指摘により要件文をバッククォート限定に修正済み |
| 2 | ✅ OK | `design-rationale.md:51-59` | Phase 1 Constitution Check テーブルが存在することを確認。checklist 項目は充足 |
| 3 | ✅ OK | `architecture-overview.md:9-55` | Mermaid System Diagram・Sequence・State Machine の3種揃い、要件充足 |
| 4 | ✅ OK | `specs/cli-anchor/spec.md:9-19` | FR-018 に Scenario 2つ（テストデータ無視 / 実アンカー保持）が記載され `design.md:D-01` と対応 |
| 5 | ✅ OK | `checklist.md:20-38` / `design.md:73-74` | `//`-comment-with-backtick リスクが FR-001/005/014/017 の Medium として checklist に記載、design および rationale でも文書化済み |
| 6 | ✅ OK | 全設計ファイル | Phase 0 / Phase 1 Constitution Check（5原則）が3ファイルすべてで完備 |
| 7 | ✅ OK | `anchor.ts:39` | 根本原因（`blankOutStringLiterals` 未適用）が正確に特定されている |
| 8 | nit 修正済み | `design.md` ステート遷移表 | `IN_TEMPLATE (escaped)` の `` \` `` ケースを明示的に追記済み |

### Constitution Re-Evaluation

| Principle | Phase 0 | Phase 1 | 独立評価 |
|-----------|---------|---------|---------|
| I ステップ独立性 | OK | OK | 合意 — `text-mask.ts` への純粋追加、破壊的変更なし |
| II 決定論的マージ | OK | OK | 合意 — 状態マシンは参照透明、副作用なし |
| III 質問駆動の要件確定 | OK | OK | 合意 — Option B をユーザーと合意済み、research.md に記録あり |
| IV 双方向アンカー | OK | OK | 合意 — 実装時に `anchor.test.ts` へ FR-018 アンカーブロックを追加する計画が設計に明記 |
| V 強制ステップと拡張ステップの分離 | OK | OK | 合意 — bugfix モードの強制ステップ（research）実施済み、quickstart スキップも正当 |

### Verdict

**PASS WITH NOTES（修正対応済み）**

設計・チェックリスト・アーキテクチャ概要はいずれも一貫しており、FR-018 の両シナリオは網羅されている。Constitution Check は3ファイルすべてで完備。self-review で指摘された Delta Spec の要件文スコープ齟齬は即座に修正済み。実装に進んで良い。
