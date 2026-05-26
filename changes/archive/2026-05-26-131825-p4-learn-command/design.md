---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: mspec learn コマンド（C3学習フィードバック）

## Summary

`mspec learn` は `changes/archive/` を走査し、(1) `.agent-runs.jsonl` の `edits > 0` エントリ（self-reviewのblocker発見→修正差分）と (2) `checklist.md` の `verify: human` 未チェック項目 を収集してpost-condition候補をJSON出力する。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. 仕様駆動 | ✅ FR-006定義済み | ✅ |
| II. TDD | ✅ テスト追加 | ✅ |
| III. 双方向アンカー | ✅ | ✅ |
| IV. 決定論的アーカイブ | ✅ | ✅ |
| V. リスク比例検証 | ✅ standard | ✅ |

### Complexity Tracking

None

## Project Structure

```
packages/cli/src/commands/learn.ts          — 新規: mspec learn コマンド実装
packages/cli/tests/e2e/learn.e2e.test.ts    — 新規: learn コマンドの E2E テスト
packages/cli/src/index.ts                   — 修正: learn コマンドを登録
```

## Decisions

### 出力フォーマット

```typescript
interface LearnOutput {
  patterns: LearnPattern[];
  summary: { total: number; review_blockers: number; unchecked_human_verify: number };
}

type LearnPattern =
  | { type: 'review-blocker'; change: string; step: string; edits: number }
  | { type: 'unchecked-human-verify'; change: string; items: string[] };
```

受け入れ基準（FR-006対応）:
- `.agent-runs.jsonl` の `edits > 0` エントリから `review-blocker` パターンを抽出
- `checklist.md` の `- [ ] ... <!-- verify: human -->` から `unchecked-human-verify` を抽出
- archive が空の場合は `{ patterns: [] }` で exit 0

### .agent-runs.jsonl のフォーマット

`agent-run-log.ts` で定義。各エントリに `step`, `edits`, `bytes` フィールドがある。

### checklist.md の verify: human 検出

`- [ ] .*<!-- verify: human -->` 正規表現でマッチする未チェック行を抽出。
