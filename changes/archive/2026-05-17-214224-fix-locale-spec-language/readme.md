---
doc_type: Reference
---

# fix-locale-spec-language

> Status: new
> Created: 2026-05-17
> Mode: bugfix

## Request

言語設定（locale: ja）を設定しても、生成される Spec の Requirements が英語の EARS 表記（"When X is executed..."）になり、日本語表記（「このシステムは SHALL ＜振る舞い＞。」）にならない。原因は（1）ja ロケール用テンプレート（readme, glossary 等）が未整備でレガシーにフォールバックしている、（2）skill・CLI 側がロケール設定を LLM への指示に反映していない、の2点と考えられる。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / architecture-overview.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
- quickstart: bugfix mode: quickstart is skipped per FR-019 (bugfix mode skip rules) (skipped at 2026-05-17T22:33:58.528Z)
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->
