---
doc_type: How-to
---

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-014 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

# Checklist: fix-e2e-flakiness-verify-cmd-auto-execute

## 機能確認

- [x] FR-001 — Playwright e2e テストにおける条件ベース待機の使用: `waitForTimeout()` 呼び出しがゼロになっていること <!-- verify: fr-001 -->
- [x] FR-001 — waitForTimeout 除去の静的検証 <!-- verify: cmd:grep -r "waitForTimeout" packages/web-ui/tests/e2e/ -->
- [x] FR-002 — vitest CLI e2e テストにおける process.cwd() スパイの分離: afterEach に vi.restoreAllMocks() が存在すること <!-- verify: fr-002 -->
- [x] FR-003 — e2e テストスイートのフレーク率ゼロ保証: 3 回連続実行で結果が安定すること <!-- verify: fr-003 -->
- [x] FR-014 — verify:cmd アノテーション付き項目のインライン実行と結果表示: 実行ボタン表示・結果インライン表示・ボタン無効化・verify:fr のみ項目には非表示 <!-- verify: fr-014 -->
- [x] FR-014 — mspec validate によるチェンジ整合性確認 <!-- verify: cmd:mspec validate --change 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute -->

## リグレッションリスク

- [x] FR-012 regression — ArtifactViewer.tsx の `li` コンポーネント変更による amber ハイライト（FR-012）への regression リスク <!-- verify: human -->（FR-014 の Run ボタン追加は FR-012 が実装済みの同一 `li` コンポーネントを変更するため、amber ハイライトの適用ロジックが壊れていないかは機械検証不可）
  - `<!-- verify: cmd:... -->` アノテーションが付いた項目を checklist.md で Web UI 表示し、amber 背景色が適用されていることを目視で確認する
  - `<!-- verify: fr-001 -->` アノテーションのみの項目に amber ハイライトが適用されていないことを目視で確認する

## デプロイ前確認

- [x] Constitution IV — 双方向アンカー: `mspec anchor check` でエラーゼロ <!-- verify: cmd:mspec anchor check --change 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute -->
- [x] Constitution VI — Security by Default: e2e-stability Delta Spec に `## Security Capabilities` セクションが存在する <!-- verify: cmd:grep "## Security Capabilities" changes/2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md -->
- [x] Constitution VI — Security by Default: artifact-preview Delta Spec に `## Security Capabilities` セクションが存在する <!-- verify: cmd:grep "## Security Capabilities" changes/2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md -->
- [x] POST /api/run-cmd が `mspec` 以外のコマンドを 403 で拒否すること <!-- verify: human -->
  - `curl -X POST http://localhost:<port>/api/run-cmd -H 'Content-Type: application/json' -d '{"cmd":"ls -la"}'` を実行して 403 レスポンスを確認する
  - `curl -X POST http://localhost:<port>/api/run-cmd -H 'Content-Type: application/json' -d '{"cmd":"mspec anchor check"}'` を実行して 200 レスポンスを確認する
- [x] e2e テストスイートを 3 回連続実行し、全回でパス/スキップ/フェイル件数が一致すること <!-- verify: human -->
  - `playwright test` を 3 回連続で実行し、各回の pass/skip/fail 件数をログで比較する
  - `vitest run` を 3 回連続で実行し、各回の結果が一致することを確認する
