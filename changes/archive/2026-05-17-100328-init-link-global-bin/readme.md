---
doc_type: Reference
---

# init-link-global-bin

> Status: new
> Created: 2026-05-17

## Request

`mspec init` を実行した後もグローバルに `mspec` コマンドが通らない問題を修正する。
`init` コマンドが完了時に自動で `npm link`（または同等の手段）を行い、`/opt/homebrew/bin/mspec` にシンボリックリンクを作成してグローバルコマンドを有効にすること。
また、開発時の動作確認は常に最新ビルドの `mspec` コマンドを経由できるようにしたい。

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
