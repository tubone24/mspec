---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: implement 自己修正ループ（max_iterations）

## Summary

`workflow.yaml` の implement ステップに `max_iterations` フィールドを追加し、TDD失敗がN回続いた場合にエスカレーションしてユーザーに判断を委ねる仕組みを追加する。CLIはスキーマ定義のみ担い、ループ制御とエスカレーション処理はSKILL.mdで定義する。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. 仕様駆動 | ✅ FR-024/025定義済み | ✅ |
| II. TDD | ✅ workflow.test.tsに追加 | ✅ |
| III. 双方向アンカー | ✅ | ✅ |
| IV. 決定論的アーカイブ | ✅ | ✅ |
| V. リスク比例検証 | ✅ standard | ✅ |

### Complexity Tracking

None

## Project Structure

変更対象:

```
packages/cli/src/types/workflow.ts    — StepSchema に max_iterations フィールド追加
packages/cli/src/types/workflow.test.ts — max_iterations のバリデーションテスト追加
.mspec/workflow.yaml                  — implement ステップに max_iterations: 3 追加
.claude/skills/mspec-implement/SKILL.md — エスカレーション手順を追加
```

## Decisions

### max_iterations の型と意味論

`z.number().int().min(1).optional()` — optional にすることで既存のworkflow.yamlとの後方互換性を保つ。未設定時は制限なし（既存動作）。

受け入れ基準（FR-024対応）:
- `max_iterations: 3` が設定されたworkflow.yamlが `mspec schema validate` を通過する
- 未設定のworkflow.yamlも引き続き動作する

### エスカレーション処理の場所

SKILL.md側で担う（CLIコードは不要）。理由: エスカレーションの「判断」はLLMエージェントが行うべき処理であり、CLIが自動的に設計変更を行うのはoverreachになる。

受け入れ基準（FR-025対応）:
- SKILL.mdに「max_iterations 到達時は design.md に `## Escalation Summary` を追記してAskUserQuestion」の手順が明記される
- エスカレーション記録ファイルとして `.implement-iterations.jsonl` を活用（agent-run-log.tsのパターン）

### エスカレーションサマリの形式

design.md 末尾への追記（APPEND）のみ。上書きなし。

```markdown
## Escalation Summary

- Task: <task-id>
- Iterations: <n> / <max_iterations>
- Reason: <失敗理由の要約>
- Recommendation: <設計変更 | 仕様見直し | 環境確認>
```

## Self-Review

CLIの変更はスキーマ定義の追加のみで、影響範囲は `StepSchema` の読み込み部分に限定される。SKILL.mdの変更はエージェントへの指示書であり、既存のworkflowには影響しない。
