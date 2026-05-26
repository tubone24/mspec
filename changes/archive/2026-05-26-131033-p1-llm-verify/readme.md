---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# p1-llm-verify

> Status: in-progress
> Created: 2026-05-26
> Mode: minor

## Request

`mspec verify --llm` コマンド新設。FR-IDごとの受け入れ基準チェックと設計整合性をLLMが評価するためのプロンプトをJSON出力する（案A方式）。checklist ステップと統合してC2検証を強化する。

## Artifacts

- [ ] proposal.md
- [ ] specs/<capability>/spec.md (Delta Spec)
- [ ] research.md
- [ ] design.md / architecture-overview.md
- [ ] design-rationale.md
- [ ] quickstart.md
- [ ] checklist.md
- [ ] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
- checklist: 新コマンド追加のみ、regression risk低い (skipped at 2026-05-26T13:10:54.181Z)
- research: 新CLIコマンドの設計は既存パターン（validate.ts）から自明 (skipped at 2026-05-26T13:10:53.998Z)
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

<!-- archive ステップで AI が生成 -->
