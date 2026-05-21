---
doc_type: AI-Internal
---

## Delta Spec Coverage

### visual-mock delta spec

- [x] FR-001 (Mock ファイル生成): design.md D-005 が `mspec-visual-mock-runner` サブエージェントによる `mock/index.html` 生成を規定し、D-004 の `framework-detector.ts` が FR-001 Scenario の前提条件（`@mui/material` 検出）をカバーしている <!-- verify: fr-001 -->
- [x] FR-002 (ローカル HTTP サーバー起動): design.md D-003 が `mock-server.ts` の API・ポート自動インクリメント・URL 表示を規定し、FR-002 Scenario の受け入れ基準と 1:1 対応している <!-- verify: fr-002 -->
- [x] FR-003 (フィードバック収集): design.md D-006 が `askMultiline()` によるフィードバック収集・`mock-feedback.md` 保存フォーマット・上書き動作を規定し、FR-003 Scenario をカバーしている <!-- verify: fr-003 -->
- [x] FR-004 (tasks.md へのフィードバック反映): design.md D-007 が tasks スキルへのソフト参照方式と skipped placeholder 除外ロジックを規定し、FR-004 Scenario をカバーしている <!-- verify: fr-004 -->

### cli-workflow-engine delta spec

- [x] FR-023 (visual-mock の任意ステップ定義): design.md D-001 が `workflow.default.yaml` への `visual-mock` ステップ挿入（`skippable: true`, `block: true`）を規定し、FR-023 の両 Scenario（`current_step: "visual-mock"` 返却・skip 成功）の受け入れ基準が記載されている <!-- verify: fr-023 -->

### cli-core delta spec

- [x] cli-core FR-004 (`mspec mock` サブコマンド): design.md D-002 が `program.command('mock')` 追加・`getActiveChange()` 流用・`--change`/`--port` オプションを規定し、FR-004 の両 Scenario（正常実行・no active change エラー）の受け入れ基準が記載されている <!-- verify: fr-004 -->

---

## Source-of-Truth Regression

### cli-workflow-engine SoT (FR-001〜FR-022)

- [ ] FR-002 (必須ステップの不変性): `workflow.default.yaml` に visual-mock を挿入することで `new / proposal / delta / tasks / implement / archive` の 6 必須ステップが削除または `removable: true` に変更されないことを確認する <!-- verify: human -->
- [ ] FR-005 (done 判定: produces ファイル存在): visual-mock ステップの `produces: [mock-feedback.md]` が正しく設定されており、`mock-feedback.md` 生成前に `done` と誤判定されないことを確認する <!-- verify: human -->
- [x] FR-006 (ready/blocked: upstream 完了依存): visual-mock ステップが `proposal.md` を `requires` に持ち、proposal 未完了時に `blocked` になることを確認する <!-- verify: fr-023 -->
- [x] FR-008 (skipped 状態のソース: skip-log): `mspec skip visual-mock` 実行後に skip-log に記録され、以降の status が `skipped` を返すことを確認する <!-- verify: fr-023 -->
- [ ] FR-013 (block:true ステップ後の continue): visual-mock が `block: true` で `done` になった後、`mspec continue` が次ステップ（delta）の `execute` を返すことを確認する — 既存 block フロー（proposal など）との干渉がないこと <!-- verify: human -->
- [ ] FR-022 (design ステップの produces): visual-mock ステップ挿入が design ステップの `produces: [design.md, design-rationale.md]` に影響を与えないことを確認する <!-- verify: human -->

### cli-skip-questions SoT (FR-001〜FR-012)

- [x] FR-001 (skip は skippable:true のみ許可): visual-mock ステップが `skippable: true` で宣言されていることを確認する — `mspec skip visual-mock` が成功し、`mspec skip proposal` 等の必須ステップが引き続き拒否されることを確認する <!-- verify: fr-023 -->
- [ ] FR-003 (skip 時の placeholder MD 生成): visual-mock ステップの `produces: [mock-feedback.md]` に対し、`mspec skip visual-mock` 実行時に `mock-feedback.md` がプレースホルダとして生成されることを確認する — D-006 の「skip 時の SKIPPED_PLACEHOLDER_MARKER 書き込み」と整合していること <!-- verify: human -->
- [ ] FR-006 (skipped ステップの Constitution Check 免除): visual-mock skip 時に生成された `mock-feedback.md` プレースホルダが validate で Constitution Check 欠落として fail しないことを確認する <!-- verify: human -->

### cli-state-engine SoT (FR-001〜FR-002)

- [ ] FR-002 (produces レスステップの ready 判定): visual-mock ステップは `produces: [mock-feedback.md]` を持つため produces レスではないが、`mock-feedback.md` が存在しない初期状態で正しく `ready` と評価されることを確認する <!-- verify: human -->

### cli-core SoT (FR-001〜FR-003)

- [ ] cli-core FR-003 (archive の done-log 記録): `mock.ts` 追加が `archive.ts` の `recordDone` 呼び出しパスに影響を与えないことを確認する <!-- verify: human -->
- [ ] cli-core FR-001/FR-002 (コマンド参照のコロン形式): `mock.ts` および新規 SKILL.md テンプレートに含まれる次ステップ案内がハイフン形式（`/mspec-*`）でなくコロン形式（`/mspec:*`）であることを確認する <!-- verify: human -->

### visual-mock SoT (新規 capability)

- [ ] visual-mock SoT が今回の Delta Spec で初期化されるため既存 SoT との差分リグレッションは発生しないが、tasks スキル（`mspec-tasks/SKILL.md`）の `mock-feedback.md` ソフト参照追加が既存 tasks 生成フローを破壊しないことを確認する <!-- verify: human -->

---

## Constitution

- [ ] 原則 I (ステップ独立性): design.md Constitution Check Phase 1 で「visual-mock ステップは独立して動作し、他ステップの成果物を書き換えない」と評価済み — `mock.ts` が `proposal.md` 等を読み取るのみで変更しないことを実装時に確認する <!-- verify: human -->
- [ ] 原則 II (決定論的マージ): design.md Constitution Check Phase 1 で「D-001〜D-007 が実装者が LLM に依存せず作業できるレベルで具体化されている」と評価済み — `mspec archive` での visual-mock Delta Spec マージが CLI パーサーで決定論的に完了できることを確認する <!-- verify: human -->
- [ ] 原則 III (質問駆動の要件確定): design.md Constitution Check Phase 1 で「未解決の Open Choice なし」と評価済み — フィードバック収集 UI の実装選択（multiline vs single-line）が research/design 成果物に追跡可能な形で記録されていることを確認する <!-- verify: human -->
- [ ] 原則 IV (双方向アンカー): design.md 冒頭に `@mspec-delta` アンカーが付与済み — 実装ファイル（`mock.ts`, `mock-server.ts`, `framework-detector.ts` 等）および E2E テストに `@mspec-delta` アンカーが打たれ、`mspec anchor check` でゼロエラーとなることを実装後に確認する <!-- verify: human -->
- [ ] 原則 V (強制ステップと拡張ステップの分離): design.md Constitution Check Phase 1 で「visual-mock は `skippable: true` で任意ステップ」「必須ステップは変更なし」と評価済み — `workflow.default.yaml` の変更後に `mspec schema validate` が 6 必須ステップの存在を確認しゼロエラーとなることを確認する <!-- verify: human -->
