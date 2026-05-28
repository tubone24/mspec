---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-existing-purpose-placeholders

> Status: new
> Created: 2026-05-28
> Mode: minor

## Request

`specs/` 配下の既存 41 件の capability spec.md に残っているテンプレートプレースホルダー（`<このスペックがカバーする外部から観測可能な振る舞いの概要>`）を、各スペックの Requirements 内容を基に AI が生成した 1〜2 文の Purpose で一括置換する。
FR-005 の実装（`fix-specviewer-purpose-regression`）では新規 archive 時のみ自動生成されるようになったが、既存スペックは未修正のためこのチェンジで retroactive に対応する。

## Artifacts

- [x] proposal.md
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
