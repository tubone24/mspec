---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: mspec verify --llm コマンド

## Summary

`mspec verify --llm` は specs/*/spec.md と design.md を読み込み、FR-IDごとの LLM 評価プロンプトと受け入れ基準チェック項目を JSON で stdout に出力する。LLM 実行は Claude Code 側が担い（案A方式）、CLI はプロンプト生成に専念する。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. 仕様駆動 | ✅ FR-005定義済み | ✅ |
| II. TDD | ✅ テスト追加 | ✅ |
| III. 双方向アンカー | ✅ | ✅ |
| IV. 決定論的アーカイブ | ✅ | ✅ |
| V. リスク比例検証 | ✅ standard | ✅ |

### Complexity Tracking

None

## Project Structure

```
packages/cli/src/commands/verify.ts         — 新規: mspec verify --llm コマンド実装
packages/cli/src/commands/verify.test.ts    — 新規: verify コマンドの unit テスト
packages/cli/src/index.ts                   — 修正: verify コマンドを登録
.claude/skills/mspec-checklist/SKILL.md     — 修正: C2 に mspec verify --llm の呼び出しを追記
```

## Decisions

### 出力フォーマット

```typescript
interface VerifyLlmOutput {
  change: string;
  fr_checks: FrCheck[];
}

interface FrCheck {
  fr_id: string;       // "FR-005"
  title: string;       // Requirement タイトル
  prompt: string;      // LLM に渡す評価プロンプト
  acceptance_criteria: string[];  // Scenario の THEN 節から抽出
}
```

受け入れ基準（FR-005 Scenario 1対応）:
- JSON が stdout に出力される
- `fr_checks` 配列に各 FR-ID のエントリが含まれる

### プロンプト生成方針

FR-IDの `Requirement` 本文 + `Scenario` (GIVEN/WHEN/THEN) を元に評価プロンプトを構築。design.mdの `## Decisions` セクションとの整合性チェックも含める。

### design.md との統合

design.md が存在する場合は `## Decisions` セクションを読み込み、FR-IDとの対応をプロンプトに付加する。存在しない場合はspec.mdのみで評価プロンプトを生成。

### checklist との統合

`mspec-checklist/SKILL.md` の `## Verification (C2)` に `mspec verify --llm --change <change>` を追記。checklist 作成後に LLM 評価を実行して結果を checklist.md にコメントとして付加する運用を推奨。
