---
doc_type: Reference
---

# 2026-05-16-170347-lightweight-change-mode

> Status: in-progress
> Created: 2026-05-16

## Request

Typo修正・バグ修正・軽微な変更など、フルワークフローを回すまでもない小規模チェンジに対応するため、軽量・目的別のフレームワーク挙動を追加する。変更の規模や種類（typo/bugfix/minor）に応じて、不要なステップ（research・design・quickstart など）を自動スキップし、最小限のステップで素早く実装・アーカイブできる仕組みを設ける。

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
