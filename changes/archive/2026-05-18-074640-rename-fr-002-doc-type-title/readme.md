---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# rename-fr-002-doc-type-title

> Status: new
> Created: 2026-05-18
> Mode: minor

## Request

`artifact-taxonomy` SoT spec の FR-002 タイトル "doc_type value is constrained to the four Diátaxis types" を RENAMED する。revise-artifact-taxonomy change で `AI-Internal` が5番目の doc_type として追加されたため、タイトルを実態に合わせて修正する（Decision 6 後続 change）。

## Artifacts

- [ ] proposal.md
- [x] specs/artifact-taxonomy/spec.md (Delta Spec)
- [ ] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
- research: FR-002 タイトルリネームのみの minor change のため調査不要 (skipped at 2026-05-18T08:20:38.129Z)
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- `minor` モードでは `proposal` と `quickstart` が自動スキップされるため、delta ステップでは `readme.md` の `## Request` セクションを直接参照して capability を特定する必要があった。`mspec continue` の `required_artifacts: {exists: true}` はファイル不在でも「スキップ済みで充足」を意味する CLI 仕様と判明。
- `architecture-overview.md` にも `## Constitution Check` セクションが必須。`design.md` だけでは `mspec done` が `validate_failed` を返す。
- `enforce_anchor` は spec-only change でも適用される。`artifact-validator.ts` の JSDoc コメント ("4 Diátaxis types" → "Diátaxis types") が正当な anchor 付与先となり、コードと仕様の一貫性を同時に改善できた。
- `mspec test expect-red` はプロジェクトのテストスイートが元から通過している場合に "expected red but got green" エラーになる。spec-rename の TDD は `expect-green` のみで記録し、red 証跡は不要と判断。
- `mspec done implement` は `enforce_anchor` / `enforce_e2e` を検証してから done-log を保存する。アンカー不在では失敗するため E2E テストファイルへのアンカー追加が必要だった。

### Next Steps

- **follow-up 必須**: FR-002 本文 32 行目の self-referential 注記（「タイトル改名は後続の change で扱う」）を別 change で削除する。archive 後は事実と矛盾する stale テキストになる（checklist T401 参照）。
- FR-001 本文の "the four Diátaxis types extended with a fifth AI-Internal type" という表現も整理の余地あり（self-reviewer 指摘、優先度 nit）。
