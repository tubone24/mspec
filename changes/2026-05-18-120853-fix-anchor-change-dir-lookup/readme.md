---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-anchor-change-dir-lookup

> Status: new
> Created: 2026-05-18
> Mode: bugfix

## Request

`packages/cli/src/parser/anchor.test.ts:7` において、`change_dir "2026-05-14-093015-apply-css" not found` というエラーが発生している。
アンカーパーサーのテストで参照している change_dir が見つからない問題を修正したい。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] quickstart.md
- [ ] checklist.md
- [ ] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

<!-- archive ステップで AI が生成 -->
