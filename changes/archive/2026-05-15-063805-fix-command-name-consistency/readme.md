# 2026-05-15-063805-fix-command-name-consistency

> Status: new
> Created: 2026-05-15

## Request

スキル内のプロンプトで `mspec-continue`（ハイフン区切り）と指示しているケースがあるが、正しいコマンド名は `/mspec:continue`（コロン区切り）である。
ハイフン形式・コロン形式の両方のコマンドが混在していてわかりにくいため、コロン形式（`mspec:<step>`）に統一し、スキル内の参照もすべて修正したい。

## Artifacts

- [ ] glossary.md
- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / architecture-overview.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
