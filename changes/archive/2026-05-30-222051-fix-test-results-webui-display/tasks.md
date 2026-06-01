---
doc_type: Reference
---

# Tasks: fix-test-results-webui-display

## Phase 1 — Setup

- [ ] ローカル開発環境の動作確認: `npm run dev`（packages/web-ui）と `mspec serve` が起動することを確認する
- [ ] 既存 E2E テストスイートを実行して現在の状態を記録する: `npx playwright test packages/web-ui/tests/e2e/test-results.e2e.test.ts`

---

## Phase 2 — Foundational（TDD: テストを先に書く）

### E2E: FR-011 — change not found 時の graceful fallback

- [ ] `packages/web-ui/tests/e2e/test-results.e2e.test.ts` に「存在しない change ID で `/changes/nonexistent/test-results` へ移動したとき "No test results found." が表示され赤エラー文言が出ない」テストケースを追加する（GIVEN: 無効な changeId, WHEN: navigate, THEN: noResults メッセージ表示）
<!-- verify: fr-011 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-011
Change: fix-test-results-webui-display
-->

### ユニットテスト: FR-012 — CLI コマンド

- [ ] `packages/cli/src/commands/testResults.test.ts` に「`mspec test-results convert` が Playwright 形式の e2e-results/results.json を test-results.json に変換する」ユニットテストを追加する
<!-- verify: fr-012 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-012
Change: fix-test-results-webui-display
-->

- [ ] `packages/cli/src/commands/testResults.test.ts` に「e2e-results/results.json が存在しない場合にエラーメッセージを出力して exit(1) する」テストを追加する
<!-- verify: fr-012 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-012
Change: fix-test-results-webui-display
-->

### ユニットテスト: FR-013 — 汎用ランナー形式検出

- [ ] `detectRunnerFormat()` に対するユニットテストを追加する: Playwright JSON（`suites[]` 有）→ `'playwright'` を返す
<!-- verify: fr-013 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-013
Change: fix-test-results-webui-display
-->

- [ ] `detectRunnerFormat()` のユニットテスト: Vitest JSON（top-level `snapshot` 有）→ `'vitest'` を返す
<!-- verify: fr-013 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-013
Change: fix-test-results-webui-display
-->

- [ ] `detectRunnerFormat()` のユニットテスト: Jest JSON（`testResults[].testFilePath` 有）→ `'jest'` を返す
<!-- verify: fr-013 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-013
Change: fix-test-results-webui-display
-->

- [ ] `detectRunnerFormat()` のユニットテスト: 不明フォーマット → `'unknown'` を返し exit(1) する
<!-- verify: fr-013 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-013
Change: fix-test-results-webui-display
-->

- [ ] Jest/Vitest 変換ロジックのユニットテスト: `passed→green`, `failed→red`, `pending→skip`, `todo→skip` のステータスマッピングを確認する
<!-- verify: fr-013 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-013
Change: fix-test-results-webui-display
-->

- [ ] FR-010 継続確認ユニットテスト: Jest/Vitest の `failureMessages` から抽出した `stack_trace` に `maskAbsolutePaths()` が適用されて絶対パスが `[path]` に置換されることを確認する
<!-- verify: fr-013 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-013
Change: fix-test-results-webui-display
-->

---

## Phase 3 — User Story（実装）

### 実装: FR-011 — API 修正

- [ ] `packages/cli/src/server/routes/testResults.ts:61` を修正する: `findChange` が null のとき `reply.code(404).send(...)` を `reply.code(200).send([])` に変更する
<!-- verify: fr-011 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-011
Change: fix-test-results-webui-display
-->

### 実装: FR-011 — フロントエンド修正

- [ ] `packages/web-ui/src/pages/TestResults.tsx:30` を修正する: `if (error)` ブランチの赤エラー文言を `t('testResults.noResults')` の表示に変更する（`data-testid="no-results"` を付与）
<!-- verify: fr-011 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-011
Change: fix-test-results-webui-display
-->

### 実装: FR-012 — CLI コマンド登録

- [ ] `packages/cli/src/index.ts` に `mspec test-results convert --change <id>` コマンドを登録する（`findChange()` で変換元ディレクトリを解決し `convertTestResults()` を呼び出す）
<!-- verify: fr-012 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-012
Change: fix-test-results-webui-display
-->

### 実装: FR-013 — 汎用ランナー形式検出

- [ ] `packages/cli/src/commands/testResults.ts` に `detectRunnerFormat(raw: unknown): RunnerFormat` 関数を追加する（Playwright: `suites[]`, Vitest: `snapshot`, Jest: `testFilePath`）
<!-- verify: fr-013 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-013
Change: fix-test-results-webui-display
-->

- [ ] `packages/cli/src/commands/testResults.ts` に Jest/Vitest 変換ロジックを追加する: `assertionResults` から各テストケースを抽出し `passed/failed/pending/todo` → `green/red/skip` にマッピングする
<!-- verify: fr-013 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-013
Change: fix-test-results-webui-display
-->

- [ ] Jest/Vitest の `failureMessages` フィールドを `stack_trace` として抽出し、既存の `maskAbsolutePaths()` を通してから `TestResultEntry.stack_trace` に格納する（FR-010 継続保証）
<!-- verify: fr-013 -->
<!-- anchor:
@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md
Requirements implemented: FR-013
Change: fix-test-results-webui-display
-->

---

## Phase 4 — Polish

- [ ] `mspec anchor check --change 2026-05-30-222051-fix-test-results-webui-display` を実行してアンカー解決を確認する
- [ ] 全 E2E テストスイートを実行してリグレッションがないことを確認する: `npx playwright test packages/web-ui/tests/e2e/`
- [ ] `packages/cli/src/commands/testResults.ts` の `convertTestResults()` が `detectRunnerFormat()` を正しく呼び出す結合を手動で確認する（Playwright サンプル JSON で `mspec test-results convert` を実行）

---

## Constitution Check

| 原則 | Phase 0 | 備考 |
|------|---------|------|
| I. ステップ独立性 | ✅ | 各タスクは独立して実行・検証可能 |
| II. 決定論的マージ | ✅ | FR-011/012/013 の anchor ブロックは一意 |
| III. 質問駆動の要件確定 | ✅ | FR-013 の汎用ランナー対応はユーザー確認済み |
| IV. 双方向アンカー | ✅ | すべての実装タスクに `@mspec-delta` anchor ブロックを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | Phase 2 E2E → Phase 3 実装の TDD 順序を維持 |
| VI. Security by Default | ✅ | FR-010 継続保証タスクを Phase 2 と Phase 3 に明示配置 |
| VII. 設計意図と実装の対応確認 | ✅ | 各タスクの変更箇所は design.md の具体的なファイル・行番号と対応 |

<!-- LEARNING: `produces: []` の self-review ステップは `mspec done self-review` コマンドで明示的に完了マークする必要がある。mspec validate だけでは状態が進まない | source: FR-011 | confidence: high -->
