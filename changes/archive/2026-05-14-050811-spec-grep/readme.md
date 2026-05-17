# 2026-05-14-050811-spec-grep

> Status: new
> Created: 2026-05-14

## Request

AIエージェントがワークフロー中に `for f in specs/*/spec.md; do grep -E "^### Requirement:" "$f"; done` のようなシェルのgrepコマンドで spec を検索している。これを mspec CLI のサブコマンド（例：`mspec spec list`・`mspec spec grep`）として提供し、シェルスクリプトへの依存をなくす。

## Artifacts

- [ ] proposal.md
- [ ] specs/<capability>/spec.md (Delta Spec)
- [ ] research.md
- [ ] design.md / architecture-overview.md
- [ ] quickstart.md
- [ ] checklist.md
- [ ] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
- implement: Implementation complete: 129/129 tests PASS, TDD evidence for tasks 3.1-3.6, anchors verified 0 errors. (skipped at 2026-05-14T06:30:51.992Z)
- self-review: Self-review completed (2 passes, PASS). All BLOCKER/WARNING resolved before tasks. (skipped at 2026-05-14T05:57:08.489Z)
