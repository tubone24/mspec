---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# reduce-verify-human-in-checklist

> Status: new
> Created: 2026-05-26
> Mode: bugfix

## Request

checklist.md の生成結果において「verify human」タグが多すぎる問題を解消する。
mspec-checklist-auditor サブエージェントが自動検証できる項目をより多くカバーし、人間による手動確認を本当に必要なケースのみに絞り込む。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [ ] quickstart.md
- [x] checklist.md
- [ ] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

<!-- archive ステップで AI が生成 -->
