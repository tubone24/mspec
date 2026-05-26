---
doc_type: How-to
---

<!-- @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: reduce-verify-human-in-checklist -->

# Tasks: reduce-verify-human-in-checklist

> **注意**: design.md を優先参照すること。research.md には旧アプローチ（`verify: auditor` 新 tier）の記述が残っているが、採用されていない。

## Phase 1: Setup

- [x] T001 ベースライン確認 — 両 auditor ファイルの diff がゼロであることを確認する

## Phase 2: Foundational — E2E テスト（実装前に記述）

### Tests-first (E2E)

- [x] T002 E2E for FR-006 "Constitution IV: mspec anchor check 実行でチェックボックス確定" — files: `packages/cli/tests/e2e/checklist-auditor-constitution-precheck.e2e.test.ts` <!-- verify: fr-006 -->
      anchor:
        @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md
        Requirements implemented: FR-006
        Change: reduce-verify-human-in-checklist

- [x] T003 E2E for FR-006 "Constitution VI: Security Capabilities セクション存在確認でチェックボックス確定" — files: `packages/cli/tests/e2e/checklist-auditor-constitution-precheck.e2e.test.ts` <!-- verify: fr-006 -->
      anchor:
        @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md
        Requirements implemented: FR-006
        Change: reduce-verify-human-in-checklist

- [x] T004 E2E for FR-007 "verify: human 付与時の理由括弧書き義務" — files: `packages/cli/tests/e2e/checklist-auditor-verify-human-reason.e2e.test.ts` <!-- verify: fr-007 -->
      anchor:
        @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md
        Requirements implemented: FR-007
        Change: reduce-verify-human-in-checklist

- [x] T005 E2E for FR-007 "verify: human を最後の手段とする優先順位ルール" — files: `packages/cli/tests/e2e/checklist-auditor-verify-human-reason.e2e.test.ts` <!-- verify: fr-007 -->
      anchor:
        @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md
        Requirements implemented: FR-007
        Change: reduce-verify-human-in-checklist

## Phase 3: User Story — 実装

- [x] T006 `.claude/agents/mspec-checklist-auditor.md` の Constraints セクション（行 39–55）を design.md の新 Constraints ブロックで全置換し、`@mspec-delta` アンカーを追加する <!-- verify: fr-006 -->
      anchor:
        @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md
        Requirements implemented: FR-006, FR-007
        Change: reduce-verify-human-in-checklist

- [x] T007 `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` を runtime と同一内容に同期する（FR-014 同期義務: diff = 0 で確認） <!-- verify: fr-006 -->
      anchor:
        @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md
        Requirements implemented: FR-006, FR-007
        Change: reduce-verify-human-in-checklist

## Phase 4: Polish

- [x] T008 `mspec anchor check` 実行 → 0 errors 確認（Constitution IV 自動検証の実証）
      anchor:
        @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md
        Requirements implemented: FR-006
        Change: reduce-verify-human-in-checklist

- [ ] T009 checklist.md を再生成して新 auditor 動作を実証（Constitution IV/VI が `- [x]`、verify: human 項目に理由括弧書きあり）
      anchor:
        @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md
        Requirements implemented: FR-006, FR-007
        Change: reduce-verify-human-in-checklist

## Constitution Check

| Principle | Phase 0 |
|-----------|---------|
| I. ステップ独立性 | T006〜T007 は auditor ファイルのみを変更し、他ステップのスキルを変更しない |
| II. 決定論的マージ | Constraints テキスト置換のみ。パーサー変更・workflow.yaml 変更なし |
| III. 質問駆動の要件確定 | design.md の Open Choices はすべて解決済み。未決定事項なし |
| IV. 双方向アンカー | T006 で両ファイルに `@mspec-delta` アンカーを付与。T008 で `mspec anchor check` ゼロエラーを確認 |
| V. 強制ステップと拡張ステップの分離 | 既存 checklist ステップの prompt 強化のみ。新ステップ追加なし |
| VI. Security by Default | 変更対象はエージェント定義ファイル 2 件のみ。外部ネットワーク依存なし |
