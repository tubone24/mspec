# 2026-05-14-131906-fix-special-step-produces

> Status: new
> Created: 2026-05-14

## Request

`implement` と `archive` ステップが `produces: []`（またはファイル生成が不定の）ステップのため `done` に遷移できないバグを修正する。現状は `skippable: true` を `workflow.yaml` に追加する回避策が取られているが、根本的にはこれらを「特別なステップ」として専用処理し、`produces` の有無に依存せず状態遷移できるよう設計を改める。

## Artifacts

- [ ] glossary.md
- [ ] proposal.md
- [ ] specs/<capability>/spec.md (Delta Spec)
- [ ] research.md
- [ ] design.md / architecture-overview.md
- [ ] quickstart.md
- [ ] checklist.md
- [ ] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
- self-review: Self-review completed (2 passes, PASS). BLOCKER-1~5 resolved. design.md ## Self-Review section updated with full constitution re-evaluation. (skipped at 2026-05-15T00:52:19.567Z)
