---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# cli-output-english

> Status: new
> Created: 2026-05-22
> Mode: bugfix

## Request

CLI command output contains Japanese text in some places (e.g. `mspec upgrade` outputs "現在のバージョン", "最新バージョン", etc.).
All user-facing command output should be written in English only.

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- `status.ts` が `mode` を `computeStatus` に渡していなかったため `bugfix` モードの skip 設定が効いていなかった。`continue.ts` に同じパターンが既に実装されており、それを `status.ts` にも適用することで修正した。
- 文字列リテラルの直接置換（i18n ライブラリ不使用）は正しいアプローチだった。8箇所の置換のみで動作変更なし。
- `findChange` が `changes/` を `changes/archive/` より先にチェックする優先順位バグも発見・修正。アーカイブ後にディレクトリが復元された場合に誤判定が起きていた。
- `npm publish --dry-run` は同バージョンが既に公開済みの場合は dry-run でも失敗する（npm 仕様）。T102 を `.skip` して次バージョンバンプ時に再有効化が必要。

### Next Steps

- パッケージバージョンを 0.1.3 にバンプして T102 (`npm publish --dry-run`) を再有効化する（cli-distribution FR-001 関連）
- `computeStatus` の呼び出しを共通ヘルパーに集約し、`status.ts` / `continue.ts` の将来の divergence を防ぐリファクタリングを検討する
