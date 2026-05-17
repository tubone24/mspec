---
doc_type: Reference
---

# fix-archive-record-done

> Status: new
> Created: 2026-05-16
> Mode: bugfix

## Request

`archive.ts` がディレクトリ移動後に `recordDone(paths, change.name, 'archive')` を呼び出していないバグを修正する。
これにより `archive` ステップが done-log に記録されず、`mspec continue` が永遠に `next_action: "execute"` を返し続ける問題を解消する。
修正箇所は `packages/cli/src/commands/archive.ts` の `rename()` 呼び出し直後。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / architecture-overview.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->
