---
doc_type: Reference
---

# Tasks: web-ui-artifact-order-and-test-results

実装ガイドライン:
- **Tests-First**: 各 E2E / ユニットテストタスクが red（失敗）であることを確認してから、対応する実装タスクに進む
- **アンカー順守**: 各タスクの `anchor:` ブロックが示す Delta Spec FR と 1:1 で対応していること
- タスク完了時は `mspec test record --change <id> --fr <FR-ID> --status green` で記録する

---

## Phase 1: Setup

### Task 1.1 — 開発環境確認

- Web UI サーバーが `http://localhost:5173` で起動していること
- `packages/cli/` と `packages/web-ui/` のビルドが通ること
- E2E テスト（Playwright）が実行できること（`npx playwright test` がパスすること）

---

## Phase 2: Foundational（ユーティリティ関数）

### ~~Task 2.1~~ ✅ — [E2E] アーティファクトソート順のユニットテスト（RED → 記録済み）

`packages/cli/src/server/routes/artifacts.test.ts` に以下のユニットテストを追加する:
- `getStepForArtifact('proposal.md')` → `'proposal'` を返すこと
- `getStepForArtifact('design.md')` → `'design'` を返すこと
- `getStepForArtifact('specs/change-dashboard/spec.md')` → `'delta'` を返すこと
- `collectArtifacts()` が proposal.md / design.md / tasks.md を含む場合にワークフロー順で返すこと

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/change-dashboard/spec.md
  Requirements implemented: FR-010
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-010 -->

### ~~Task 2.2~~ ✅ — [Impl] WORKFLOW_STEP_ORDER 定数と getStepForArtifact() の実装（GREEN 済み）

`packages/cli/src/server/routes/artifacts.ts` に実装する:
- `WORKFLOW_STEP_ORDER` 定数配列を追加（`new / proposal / delta / research / design / quickstart / checklist / tasks / implement`）
- `getStepForArtifact(relativePath: string): string` 関数を実装（design.md D-1 のマッピングテーブルに準拠）
- `collectArtifacts()` の戻り値を `WORKFLOW_STEP_ORDER` で sort してから返す
- Task 2.1 のテストが GREEN になることを確認する

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/change-dashboard/spec.md
  Requirements implemented: FR-010
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-010 -->

### ~~Task 2.3~~ ✅ — [E2E] adaptStatus() と maskAbsolutePaths() のユニットテスト（RED → 記録済み）

`packages/cli/src/server/testResultParser.test.ts` に以下のユニットテストを追加する:
- `adaptStatus('green')` → `'pass'` を返すこと
- `adaptStatus('red')` → `'fail'` を返すこと
- `adaptStatus('skip')` → `'skip'` を返すこと
- `maskAbsolutePaths('/Users/foo/project/spec.ts:10')` → `[path]/spec.ts:10` のようにマスクされること
- `maskAbsolutePaths('C:\\Users\\foo\\project\\spec.ts')` → `[path]` を含むこと
- APIキーや環境変数名の文字列はマスクされないこと（絶対パスのみ対象）

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-010
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-010 -->

### ~~Task 2.4~~ ✅ — [Impl] adaptStatus() と maskAbsolutePaths() の実装（GREEN 済み）

`packages/cli/src/server/testResultParser.ts` に実装する:
- `adaptStatus(status: 'red' | 'green' | 'skip'): 'pass' | 'fail' | 'skip'` を実装（design.md D-4）
- `maskAbsolutePaths(text: string): string` を実装（design.md D-6 の正規表現）
- Task 2.3 のテストが GREEN になることを確認する

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-010
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-010 -->

### ~~Task 2.5~~ ✅ — [E2E] parseTestResultsJson() のユニットテスト（Task 2.3 REDと同時記録済み）

`packages/cli/src/server/testResultParser.test.ts` に以下のユニットテストを追加する:
- `parseTestResultsJson([{ name: '[FR-007] test', status: 'green', checklist_item_ids: ['fr-007'] }])` が正しい `TestCase` オブジェクトを返すこと
- `status` が `adaptStatus` で変換されること（`green → pass`）
- `stack_trace` が `maskAbsolutePaths` で変換されること
- `checklist_item_ids` が配列として保持されること

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-007
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-007 -->

### ~~Task 2.6~~ ✅ — [Impl] parseTestResultsJson() の実装（GREEN 済み）

`packages/cli/src/server/testResultParser.ts` に実装する:
- `parseTestResultsJson(entries: TestResultEntry[]): TestCase[]` を実装
- 各エントリに `adaptStatus()` と `maskAbsolutePaths()` を適用する（design.md D-2 スキーマ準拠）
- Task 2.5 のテストが GREEN になることを確認する

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-007
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-007 -->

---

## Phase 3: User Story（機能実装）

### Task 3.1 — [E2E] mspec test-results convert コマンドの E2E テスト（RED）

`packages/cli/src/commands/testResults.e2e.test.ts` に以下の E2E テストを追加する:
- `mspec test-results convert --change <id>` を実行すると `changes/<id>/test-results.json` が生成されること
- test-results.json の各エントリが `{ name, status: 'red'|'green'|'skip', checklist_item_ids }` 形式であること
- テスト名 `[FR-007] test name` から `checklist_item_ids: ['fr-007']` が抽出されること
- 再実行時に test-results.json が上書きされること（古い結果が残らない）

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/agent-runner/spec.md
  Requirements implemented: FR-004
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-004 -->

### Task 3.2 — [Impl] mspec test-results convert コマンドの実装

`packages/cli/src/commands/testResults.ts` を新規作成する:
- `mspec test-results convert --change <id>` コマンドを実装（design.md D-3）
- `changes/<change>/e2e-results/results.json`（Playwright 形式）を読み込む
- `suites[].specs[].tests[].results[]` を平坦化する
- テスト名から `\[FR-(\d+)\]` を正規表現で抽出し `fr-NNN` 形式の `checklist_item_ids` に変換する
- `passed→green / failed→red / skipped→skip` に status を変換する
- `stack_trace` に `maskAbsolutePaths` を適用する
- `changes/<change>/test-results.json` に上書き保存する
- Task 3.1 のテストが GREEN になることを確認する

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/agent-runner/spec.md
  Requirements implemented: FR-004
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-004 -->

### Task 3.3 — [E2E] Test Result Viewer の test-results.json 参照の E2E テスト（RED）

`packages/cli/src/server/routes/testResults.e2e.test.ts` に以下の E2E テストを追加する:
- `changes/<id>/test-results.json` が存在する場合、`GET /api/changes/:id/test-results` が test-results.json を正規データソースとして使用すること
- レスポンスの `TestCase.status` が `'pass' | 'fail' | 'skip'` であること（アダプター変換後）
- test-results.json が存在しない場合、`TestResults.tsx` に "No test results found." が表示されること

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-007, FR-001
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-007 -->

### Task 3.4 — [Impl] routes/testResults.ts を test-results.json 優先に更新

`packages/cli/src/server/routes/testResults.ts` を修正する:
- `changes/<change>/test-results.json` が存在する場合に `parseTestResultsJson()` を使って読み込む（design.md D-2）
- test-results.json が存在しない場合は既存の Playwright / JUnit XML フォールバックを維持する（SoT FR-001 退行防止）
- `checklist.md` から `<!-- verify: fr-NNN -->` の有効 ID セットを抽出し、各テストケースに `is_resolved` フィールドを追加する（design.md D-5）
- Task 3.3 のテストが GREEN になることを確認する

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-007, FR-001
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-007 -->

### Task 3.5 — [E2E] checklist_item_ids バッジの Playwright E2E テスト（RED）

`packages/web-ui/src/pages/TestResults.e2e.test.ts` に以下の E2E テストを追加する:
- テストケースに `checklist_item_ids: ['fr-007', 'fr-008']` が含まれる場合、FR-007 と FR-008 のバッジが DOM に表示されること
- `data-testid="checklist-badge-fr-007"` などの testid でバッジを確認できること

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-008
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-008 -->

### Task 3.6 — [Impl] TestCase 型更新と TestResults.tsx へのチェックリストバッジ追加

`packages/web-ui/src/api/client.ts` と `packages/web-ui/src/pages/TestResults.tsx` を修正する:
- `TestCase` 型に `checklist_item_ids: string[]` と `is_resolved: boolean` を追加（design.md D-7）
- `TestResults.tsx` の各テストケース行に FR バッジを表示する（`fr-007 → FR-007` 大文字変換して表示）
- `dangerouslySetInnerHTML` を使わず React 自動エスケープに委譲する
- Task 3.5 のテストが GREEN になることを確認する

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-008
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-008 -->

### Task 3.7 — [E2E] ダングリングリファレンス警告バッジの Playwright E2E テスト（RED）

`packages/web-ui/src/pages/TestResults.e2e.test.ts` に以下の E2E テストを追加する:
- `checklist_item_ids` に checklist.md に存在しない ID が含まれる場合、`data-testid="unresolved-warning"` バッジが表示されること
- テストケース自体のステータスバッジ（pass/fail/skip）も通常通り表示されること

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-009
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-009 -->

### Task 3.8 — [Impl] ダングリングリファレンス警告バッジの表示実装

`packages/web-ui/src/pages/TestResults.tsx` を修正する:
- `is_resolved === false` の場合に「チェックリスト項目：未解決」警告バッジを表示する（design.md D-7）
- Task 3.7 のテストが GREEN になることを確認する

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-009
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-009 -->

---

## Phase 4: Polish（仕上げ・検証）

### Task 4.1 — [E2E] アーティファクト一覧の Playwright E2E テスト（change-dashboard）

`packages/web-ui/src/pages/ChangeDetail.e2e.test.ts` に以下の E2E テストを追加する:
- チェンジ詳細画面で proposal.md が design.md より上に表示されること
- design.md が tasks.md より上に表示されること
- アーティファクトが欠落している場合（proposal.md なし）でも残りがワークフロー順であること

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/change-dashboard/spec.md
  Requirements implemented: FR-010
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: fr-010 -->

### Task 4.2 — SoT FR-005 / FR-006 の更新シナリオ確認（手動）

test-results.json を正規データソースとした後も以下が維持されることを手動で確認する:
- `[data-testid="test-case-pass"]` / `[data-testid="test-case-fail"]` / `[data-testid="test-case-skip"]` が DOM に存在すること
- `[data-testid="trace-panel"]` がパスマスク済みスタックトレースで展開されること

```
anchor:
  @mspec-delta changes/2026-05-28-041724-web-ui-artifact-order-and-test-results/specs/test-result-viewer/spec.md
  Requirements implemented: FR-005, FR-006
  Change: web-ui-artifact-order-and-test-results
```
<!-- verify: human -->

### Task 4.3 — セキュリティ確認: --change 引数のパストラバーサル防止

`packages/cli/src/commands/testResults.ts` の `--change` 引数バリデーションを確認する:
- `../` を含む change ID でコマンド実行時に書き込み先が `changes/` 外に出ないこと
- change ID に英数字・ハイフン・アンダースコア以外が含まれる場合にエラーになること
<!-- verify: human -->

### Task 4.4 — セキュリティ確認: test-results.json への機密情報混入防止

実際のテスト失敗ログを使って以下を確認する:
- `test-results.json` の全フィールド（name / status / checklist_item_ids / error_message / stack_trace）に API キー・シークレット・環境変数の値が含まれていないこと
- agent-runner FR-003（Log Sanitization）への準拠を実データで検証すること
<!-- verify: human -->

### Task 4.5 — セキュリティ確認: XSS レンダリング確認

`TestResults.tsx` のレンダリング実装を確認する:
- `dangerouslySetInnerHTML` が使われていないこと
- FR バッジ・警告バッジ・スタックトレースが React 自動エスケープで安全にレンダリングされていること
<!-- verify: fr-010 -->

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | OK — tasks は design.md と checklist.md のみに依存 | — |
| II. 決定論的マージ | OK — 各タスクに anchor ブロックを付与、FR-ID が一意に対応 | — |
| III. 質問駆動の要件確定 | OK — Open Choices はすべて design.md D-1〜D-8 で確定済み | — |
| IV. 双方向アンカー | OK — `mspec anchor check` で全アンカーが解決可能なこと | — |
| V. 強制ステップと拡張ステップの分離 | OK — tasks は強制ステップ内のタスクのみを記述 | — |
| VI. Security by Default | OK — Task 4.3〜4.5 でセキュリティ検証タスクを明示 | — |
