---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# multi-test-runner-support

> Status: new
> Created: 2026-05-27

## Request

バックエンド・フロントエンドなど、複数のテストランナー（フレームワーク）を持つプロジェクトに対応できる柔軟なテストランナー設定の仕組みを mspec に導入する。
実装ステップ（レッド→グリーン）において、複数のランナーをすべて確認・実行できるようにすることを目的とする。
現時点ではアイデア段階のため、壁打ちを通じて仕様の方向性を探る。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **`resolveRunners()` の pure function 設計が功を奏した**: spawn やファイルシステムに依存しない pure function として切り出したことで、モックなしで 12 本のユニットテストが書けた。
- **self-reviewer が design.md の架空関数を検出**: `resolveRunners_withEnsure` という存在しない関数が Decision 3 に混入。設計ドキュメントのコードサンプルは実装の関数名と一致させる必要がある。
- **legacy payload 分岐（`command: string` vs `string[]`）が後から浮上**: self-review で `matched_red`/`matched_green` の扱いが未定義と指摘。design ステップで payload 型分岐を明示する習慣が重要。
- **`enforce.ts` のファイル名のみ検査設計が後工程を保護**: per-runner 証跡を避けた設計判断が FR-008 互換を自動的に保証した。アーキテクチャ決定が連鎖変更を防いだ好例。
- **vitest `src/` スコープ絞りで既存の `publish-prep` 失敗を回避**: TDD サイクルに必要なスコープを明示することで、無関係な既存失敗の影響を排除できた。

### Next Steps

- **T010 ドッグフーディング**: `.mspec/config.yaml` を `runners: [cli-unit, web-ui-e2e]` 形式に更新して mspec プロジェクト自身で動作確認する。
- **`mspec init` の対話式複数ランナー設定**: proposal.md Open Questions として残っている項目。後続 change として design を決定する。
- **VI Security human レビュー**: checklist.md の `- [ ] VI Security by Default` 項目（cwd の spawn 利用リスク確認）を人間レビューで完了させること。
