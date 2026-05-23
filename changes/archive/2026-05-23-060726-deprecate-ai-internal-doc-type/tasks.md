---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-001, FR-007 -->
<!-- Change: deprecate-ai-internal-doc-type -->

# Tasks: deprecate-ai-internal-doc-type

## Phase 1: Setup

- [x] T001 [P] ベースライン確認 — 既存 E2E スイートが全て green であることを確認する — files: `packages/cli/tests/e2e/`

## Phase 2: Foundational

- [x] T010 [P] `artifact-validator.ts` の現状確認 — `VALID_DOC_TYPES` 配列（L27–33）と `VALID_DOC_TYPES_LIST`（L37）の連動を把握する — files: `packages/cli/src/lib/artifact-validator.ts`

## Phase 3: User Story 1 — FR-001/FR-002: バリデーターが AI-Internal を拒否する

### Tests-first (E2E)

- [x] T101 E2E for FR-002 "AI-Internal doc_type is rejected by validate" — `doc-type-enforcement.e2e.test.ts` L126–138 の `'accepts a template declaring doc_type: AI-Internal (exit 0)'` を `'rejects a template declaring doc_type: AI-Internal (exit non-zero)'` に反転し、期待終了コードを非ゼロに変更する（RED）— files: `packages/cli/tests/e2e/doc-type-enforcement.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-002
        Change: deprecate-ai-internal-doc-type

- [x] T102 E2E for FR-015 "エラーメッセージが四種の許容値を示す" — `doc-type-enforcement.e2e.test.ts` L119 の期待エラー文字列から `AI-Internal` を除去する（`allowed: Reference, Explanation, How-to, Tutorial` のみ）（RED）— files: `packages/cli/tests/e2e/doc-type-enforcement.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/cli-spec-lint/spec.md
        Requirements implemented: FR-015
        Change: deprecate-ai-internal-doc-type

### Implementation

- [x] T103 `artifact-validator.ts` の `VALID_DOC_TYPES` 配列から `'AI-Internal'` を削除する — L32 の `'AI-Internal',` を削除するだけで `VALID_DOC_TYPES_LIST` とエラーメッセージが自動連動する（GREEN: T101, T102）— files: `packages/cli/src/lib/artifact-validator.ts`
      anchor:
        @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-001, FR-002
        Change: deprecate-ai-internal-doc-type

## Phase 3: User Story 2 — FR-007: tasks.md テンプレートが Reference になる

### Tests-first (E2E)

- [x] T111 E2E for FR-007 "tasks.md テンプレートは Reference として分類される" — `template-doc-type-invariant.e2e.test.ts` の `AI-Internal` locale-invariant テスト（L31–48）を `Reference` の locale-invariant テストに書き換え、describe 参照を `FR-004` → `FR-007` に更新する（RED）— files: `packages/cli/tests/e2e/template-doc-type-invariant.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-007
        Change: deprecate-ai-internal-doc-type

- [x] T112 E2E for FR-001/FR-007 "tasks.md template declares Reference not AI-Internal" — `artifact-taxonomy-doc-type.e2e.test.ts` の `EXPECTED_DOC_TYPES` マップで `tasks.ja.md`・`tasks.en.md` を `'AI-Internal'` → `'Reference'` に変更する（RED）— files: `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-001, FR-007
        Change: deprecate-ai-internal-doc-type

### Implementation

- [x] T113 `tasks.ja.md` の frontmatter を `doc_type: AI-Internal` → `doc_type: Reference` に変更し、アンカーの `Requirements implemented: FR-001, FR-004` を `FR-001, FR-007` に更新する（GREEN: T111, T112）— files: `packages/cli/templates/artifacts/tasks.ja.md`
      anchor:
        @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-007
        Change: deprecate-ai-internal-doc-type

- [x] T114 `tasks.en.md` の frontmatter を `doc_type: AI-Internal` → `doc_type: Reference` に変更し、アンカーの `Requirements implemented: FR-001, FR-004` を `FR-001, FR-007` に更新する（GREEN: T111, T112）— files: `packages/cli/templates/artifacts/tasks.en.md`
      anchor:
        @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-007
        Change: deprecate-ai-internal-doc-type

## Phase 3: User Story 3 — FR-015: ローカル VALID_DOC_TYPES を四種に揃える

### Tests-first (E2E)

- [x] T121 E2E for FR-015 "AI-Internal を宣言したテンプレートが validate でエラーになる (four types only)" — `artifact-taxonomy-doc-type.e2e.test.ts` L22–28 のローカル `VALID_DOC_TYPES` 配列から `'AI-Internal'` を除去し、L65–66 の describe タイトルを「five doc types (Diátaxis + AI-Internal)」→「four Diátaxis doc types」に変更する（RED）— files: `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/cli-spec-lint/spec.md
        Requirements implemented: FR-015
        Change: deprecate-ai-internal-doc-type

### Implementation

- [x] T122 T103 の実装（`VALID_DOC_TYPES` 縮小）によって T121 が自動的に GREEN になることを確認する — 追加コード変更不要（GREEN: T121）— files: `packages/cli/src/lib/artifact-validator.ts`
      anchor:
        @mspec-delta 2026-05-23-060726-deprecate-ai-internal-doc-type/specs/cli-spec-lint/spec.md
        Requirements implemented: FR-015
        Change: deprecate-ai-internal-doc-type

## Phase 4: Polish

- [x] T201 `workflow-visual-mock.e2e.test.ts` L32 の proposal.md モックの `doc_type: AI-Internal` を `doc_type: Explanation` に変更する（out-of-band; proposal.md の正規 doc_type）— files: `packages/cli/tests/e2e/workflow-visual-mock.e2e.test.ts`

- [x] T202 `docs/reference/doc-types.md` L50 の Roadmap セクションを更新し、`AI-Internal` が廃止された旨を記載する（out-of-band docs maintenance; not FR-gated）— files: `docs/reference/doc-types.md`

- [x] T203 全 E2E スイートを実行し、全テストが green であることを確認する — files: `packages/cli/tests/e2e/`

## Dependencies

- T101, T102 は T103 の前に実行する（TDD RED → GREEN）
- T111, T112 は T113, T114 の前に実行する（TDD RED → GREEN）
- T121 は T103 完了後に GREEN になることを確認する（依存関係: T103 blocks T122）
- T103 は T001, T010 完了後に実行する
- T201, T202 は他タスクと独立して実行可能

## Constitution Check

| 原則 | Phase 0 | Notes |
|---|---|---|
| I: ステップ独立性 | ✅ tasks.md は他ステップ成果物を変更しない。実装ファイルへの変更は implement ステップで行う | — |
| II: 決定論的マージ | ✅ 各タスクのアンカーが Delta Spec の FR に 1:1 で対応。T103 が FR-001/FR-002 を、T113/T114 が FR-007 を、T122 が FR-015 を実装する | — |
| III: 質問駆動の要件確定 | ✅ research・design ステップで全 Open Choice が解決済み。tasks に未確定事項なし | — |
| IV: 双方向アンカー | ✅ 全実装タスク（T101-T122）にアンカーブロックを付与。T113/T114 でテンプレートのアンカーを FR-004 → FR-007 に更新することを明記 | — |
| V: 強制ステップと拡張ステップの分離 | ✅ tasks は拡張ステップ。workflow.yaml 構造を変更しない | — |

### Complexity Tracking

None
