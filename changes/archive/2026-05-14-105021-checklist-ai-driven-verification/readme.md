# 2026-05-14-105021-checklist-ai-driven-verification

> Status: new
> Created: 2026-05-14

## Request

`checklist.md` の各項目をAIが自動検証・チェックできる形式に変更する。具体的には、実装フェーズでテストが RED → GREEN になるたびに対応するチェックリスト項目にチェックを入れ、全タスク完了後もチェックが埋まっていない項目があればその理由を説明してユーザーに指示を仰ぐ。チェックリスト生成側（`mspec-checklist-auditor`）もAIが検証できる基準（テスト名・ファイルパス・コマンド出力）を明記する形式に更新する。

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
- implement: Implementation complete: 175/175 tests GREEN (14 new E2E), TDD red/green evidence for T101-T130, anchor check 0 errors. All checklist items confirmed. (skipped at 2026-05-14T13:11:34.537Z)
- self-review: Self-review completed (2 passes, PASS WITH NOTES). 1 nit fixed (Annotation Types subgraph edges added in architecture-overview.md). All prior findings confirmed resolved. (skipped at 2026-05-14T12:15:41.928Z)
