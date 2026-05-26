---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# web-ui-enhancements

> Status: in-progress
> Created: 2026-05-26
> Mode: minor

## Request

Web UI を3点強化する。①アーカイブ済みアーティファクトはデフォルト非表示だが、フィルターで表示切替できるようにする。②各アーティファクトカードを DockType に応じて色付けする。③ Spec Source of Truth のスペック内容を別画面（モーダルまたは専用ページ）で閲覧できるようにする。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **既存インフラの活用が鍵**: `ChangeLocation.isArchived`・`listChanges({ includeArchived })`・`projectPaths.specsDir` がすべて実装済みだったため、サーバー側の変更は「配線するだけ」に近かった。設計前にコードベースを調査する価値が明確に示された。
- **Self-review が2件の blocker を検出**: `GET /api/specs` のレスポンス形状が design.md と architecture-overview.md で矛盾しており、パストラバーサルチェックが隣接ディレクトリへのバイパスを許すという問題を自動レビューが発見した。`path.sep` を追加するだけの1文字修正だが、セキュリティ境界を正確に定義するために重要だった。
- **`mspec test` は CLI vitest のみ実行**する制約により、Playwright E2E テストの red→green サイクルは live サーバー起動が必要。tasks.md でテスト task を E2E として明示し、Playwright 実行は別途確認手順として記録した。
- **URL クエリパラメータによるフィルター状態管理**（`useSearchParams`）は「URL 共有可能なフィルター」という UX メリットをほぼ無コストで実現できる。LocalStorage/Zustand と比較して実装量も最少だった。

### Next Steps

- **E2E Playwright 確認**: `pnpm --dir packages/web-ui exec playwright test` で archive-filter と spec-viewer の E2E テストをサーバー起動後に実行・確認する（checklist.md の `verify: fr-008`・`verify: fr-009` 項目）
- **SoT Spec ビューアーへの EARS ハイライト適用**: 現在 `SpecViewer.tsx` は素の `react-markdown` のみ使用。`ArtifactViewer.tsx` の EARS/Gherkin ハイライト（`rehypeGherkinEars`）を SpecViewer にも適用すると spec.md の可読性が向上する（artifact-preview FR-003 の延長）
- **DockType カラーの SpecViewer への適用**: capability リスト左ペインのアイテムにも doc_type バッジを表示する拡張が考えられる（SoT spec.md の frontmatter 解析が必要）
