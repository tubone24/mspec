---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# p4-learn-command

> Status: in-progress
> Created: 2026-05-26
> Mode: minor

## Request

`mspec learn` コマンド新設。archive済みchangesから (1) `.agent-runs.jsonl` の edits > 0 のエントリ、(2) checklist.md の `verify: human` 未チェック項目 を収集してpost-condition候補をJSON出力する。

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
- checklist: 新コマンド追加のみ、regression risk低い (skipped at 2026-05-26T13:18:48.281Z)
- research: 新CLIコマンド追加のみ、archive-merger.tsのパターン参照で十分 (skipped at 2026-05-26T13:18:48.130Z)
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

<!-- archive ステップで AI が生成 -->
