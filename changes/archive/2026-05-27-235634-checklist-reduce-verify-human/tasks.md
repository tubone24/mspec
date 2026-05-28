---
doc_type: How-to
---

<!-- @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-006, FR-007, FR-008, FR-009 -->
<!-- Change: checklist-reduce-verify-human -->

<!-- @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-012 -->
<!-- Change: checklist-reduce-verify-human -->

# Tasks: checklist-reduce-verify-human

## Phase 1 — Setup

- [ ] セットアップ: 現行 auditor ファイルの構造確認と同期検証
  `.claude/agents/mspec-checklist-auditor.md` と `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` が完全一致することを確認する（`diff` で差分ゼロを確認）。変更対象の `## Constraints` 節（優先順位リスト）の行番号を特定しておく。
  <!-- verify: fr-008 -->

---

## Phase 2 — Foundational

- [ ] [E2E] FR-008: カテゴリ横断的 verify:auto テストを新規作成
  `packages/cli/tests/e2e/checklist-auditor-auto-priority.e2e.test.ts` を作成。CLI コマンドで検証可能な項目・CI テストカバー FR・SoT Regression「影響なし」項目に `verify: human` が付与されないことをアサート（RED フェーズ：まず失敗することを確認）。
  @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md
  Requirements implemented: FR-008
  Change: checklist-reduce-verify-human
  <!-- verify: fr-008 -->

- [ ] [E2E] FR-009: verify:human 子リスト必須テストを新規作成
  `packages/cli/tests/e2e/checklist-auditor-human-steps.e2e.test.ts` を作成。`verify: human` 付与項目の直下に最低 2 項目のインデントされた子リストが存在することをアサート（RED フェーズ）。
  @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md
  Requirements implemented: FR-009
  Change: checklist-reduce-verify-human
  <!-- verify: fr-009 -->

- [ ] [E2E] FR-006: Constitution IV/VI verify:cmd テストを新規作成
  `packages/cli/tests/e2e/checklist-auditor-constitution-cmd.e2e.test.ts` を作成。Constitution IV 行が `<!-- verify: cmd:mspec anchor check -->` 形式、Constitution VI 行が `<!-- verify: cmd:grep "## Security Capabilities" -->` 形式で出力されることをアサート（RED フェーズ）。
  @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md
  Requirements implemented: FR-006
  Change: checklist-reduce-verify-human
  <!-- verify: fr-006 -->

- [ ] [E2E] FR-007: 優先順位拡張テストを新規作成
  `packages/cli/tests/e2e/checklist-auditor-priority-order.e2e.test.ts` を作成。verify:cmd ルートが verify:human より前に適用されること、E2E Scenario 対応 FR が `verify: fr-NNN` を受けることをアサート（RED フェーズ）。
  @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md
  Requirements implemented: FR-007
  Change: checklist-reduce-verify-human
  <!-- verify: fr-007 -->

- [ ] [IMPL] FR-008/FR-009/FR-006/FR-007: mspec-checklist-auditor.md の `## Constraints` 節を更新（GREEN フェーズ）
  以下の変更を **両ファイル同時に** 適用する（FR-014 同期要件）:
  - `.claude/agents/mspec-checklist-auditor.md`
  - `packages/cli/templates/claude/agents/mspec-checklist-auditor.md`

  **変更内容（優先順位リストの書き換え）:**
  1. critical FR → `verify: human` + 確認手順子リスト（最低 2 項目）（FR-009）
  2. E2E Scenario 対応 または CI テストカバー FR → `verify: fr-NNN`（FR-008 SoT Regression 含む）
  3. `mspec validate`・`mspec anchor check`・`mspec spec lint` など CLI コマンドで確認可能 → `verify: cmd:<command>`（FR-008 新規）
  4. Constitution IV → `mspec anchor check` 実行 → `- [x] <!-- verify: cmd:mspec anchor check -->`（FR-006 変更）
  5. Constitution VI → `grep "## Security Capabilities"` 実行 → `- [x] <!-- verify: cmd:grep ... -->`（FR-006 変更）
  6. その他 → `verify: human` + 理由括弧注記 + **確認手順子リスト（最低 2 項目）**（FR-009 新規）

  適用後、上記 4 件の E2E テストがすべて GREEN になることを確認する。
  @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md
  Requirements implemented: FR-006, FR-007, FR-008, FR-009
  Change: checklist-reduce-verify-human
  <!-- verify: fr-008 -->

---

## Phase 3 — User Story

- [ ] [E2E] FR-012: Web UI verify:cmd amber ハイライトテストを追加
  `packages/web-ui/tests/e2e/checklist-verify-human.e2e.test.ts` に `verify: cmd:...` 行が amber ハイライトされること・`verify: fr-NNN` 行がハイライトされないことのアサートを追加（RED フェーズ）。
  @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/artifact-preview/spec.md
  Requirements implemented: FR-012
  Change: checklist-reduce-verify-human
  <!-- verify: fr-012 -->

- [ ] [IMPL] FR-012: Web UI checklist renderer の amber ハイライト対象を拡張（GREEN フェーズ）
  `packages/web-ui/src/` の checklist アイテムレンダリング部分を修正する。行末の HTML コメントが `verify: human` または `verify: cmd:` で始まる場合に amber ハイライトクラスを適用する正規表現・条件式を拡張する。FR-012 E2E テストが GREEN になることを確認する。
  @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/artifact-preview/spec.md
  Requirements implemented: FR-012
  Change: checklist-reduce-verify-human
  <!-- verify: fr-012 -->

---

## Phase 4 — Polish

- [ ] checklist.md を再生成（self-review warning 解消）
  auditor 更新後に `mspec checklist --change 2026-05-27-235634-checklist-reduce-verify-human` を実行して checklist.md を再生成する。Constitution IV/VI 行が `verify: cmd` 形式に変わり、`verify: human` 項目に子リストが付与されることで、self-review の 2 件の warning が解消されることを確認する。
  <!-- verify: fr-006 -->

- [ ] フルテストスイート実行とリグレッション確認
  `npm test` または `pnpm test` を実行して既存テストがすべて GREEN を維持することを確認する。特に `checklist-auditor-verify-human-reason.e2e.test.ts` と `checklist-auditor-constitution-precheck.e2e.test.ts` の `runtime === template` 同期 assert が通ることを確認する。
  <!-- verify: fr-007 -->

---

## Constitution Check

| # | 原則 | Phase 0 |
|---|------|---------|
| I | ステップ独立性 | pass — tasks.md は design.md・checklist.md を参照するのみ、他アーティファクトを変更しない |
| II | 決定論的マージ | pass — 各タスクのアンカーブロックが Delta Spec FR-ID に対応づけられている |
| III | 質問駆動の要件確定 | pass — Open Choices はすべて research フェーズで決定済み。tasks 生成に際し未決事項なし |
| IV | 双方向アンカー | pass — `@mspec-delta` アンカーブロックを全実装・E2E タスクに付与済み |
| V | 強制ステップと拡張ステップの分離 | pass — tasks ステップ内に収まっている |
| VI | Security by Default | pass — 権限変更なし。変更はプロンプトテキストと Web UI renderer のみ |

<!-- LEARNING: TDD パターンで E2E テスト作成タスクを実装タスクの前に配置する際、同一ファイルへの複数 FR の変更は 1 つの IMPL タスクにまとめつつ E2E タスクは FR ごとに分離すると、トレーサビリティと並列化のバランスが取れる | source: FR-008 | confidence: high -->
