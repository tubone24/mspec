# 2026-05-14-063708-diataxis-artifact-structure

> Status: new
> Created: 2026-05-14

## Request

mspec の成果物を「人間向け」と「AI向け」に分類し、人間が読むドキュメントを Diátaxis のタイプ分類に基づいて軽量化する。
EARS + Scenario（Gherkin）の入れ子記法を Delta Spec に導入し、要件と具体例を構造的に強制する。
用語集（glossary.md）を単一ファイルに集約し全ドキュメントから参照できる仕組みを設計する。

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
- implement: Implementation complete: FR-001/FR-002 (doc_type frontmatter), FR-003 (glossary.md auto-gen), FR-010 (SKILL.md EARS updates), FR-011 (SHALL keyword). All E2E tests passing (158/158), anchor check clean, enforce_tdd evidence recorded. (skipped at 2026-05-14T09:55:16.976Z)
- self-review: Review completed: 4 findings addressed (FR-001 SHALL fix, design.md research.md entry, quickstart fixes). Self-Review section appended to design.md. (skipped at 2026-05-14T07:57:59.480Z)
