---
doc_type: Reference
---

# Checklist: fix-test-results-webui-display

## 機能確認

### FR-011 — WebUI テスト結果ページの到達可能性

- [x] `GET /api/changes/:id/test-results` で change が見つからない場合に `200 []` を返す（`testResults.ts:61` の `reply.code(404)` が `reply.code(200).send([])` に変更されていること） <!-- verify: fr-011 -->
- [x] test-results.json が存在しないチェンジに対して WebUI で `/changes/<id>/test-results` へ移動したとき、"No test results found." が表示され 404・白画面・赤エラー文言にならないこと <!-- verify: fr-011 -->
- [x] `TestResults.tsx:30` の `if (error)` ブランチが赤エラー文言ではなく `data-testid="no-results"` の "No test results found." を返すこと <!-- verify: fr-011 -->
- [x] test-results.json が 1 件以上のエントリを持つチェンジに対して `/changes/<id>/test-results` へ移動したとき、green / red / skip バッジ付きのテストケース一覧が表示されること <!-- verify: fr-011 -->

### FR-012 — mspec test 完了後の test-results.json 自動生成

- [x] `mspec test expect-red/green` が完了した後に `convertTestResults(change.dir)` が自動的に呼ばれ、`test-results.json` が生成されること（`test.ts` の evidence 保存後に `await convertTestResults(change.dir).catch(...)` が追加されていること） <!-- verify: fr-012 -->
- [x] `e2e-results/results.json` に Playwright JSON 結果が存在するとき、`mspec test` 完了後に `changes/<id>/test-results.json` が自動生成され、各テストケースに `red / green / skip` ステータスが記録されること <!-- verify: fr-012 -->
- [x] `e2e-results/results.json` が存在しないとき、`convertTestResults()` がエラーをスローせずに silently skip し、test-results.json が作成されないこと <!-- verify: fr-012 -->

### FR-013 — 汎用テストランナー対応

- [x] `detectRunnerFormat()` が `suites[]` フィールドを持つ JSON を `playwright` と判定すること <!-- verify: fr-013 -->
- [x] `detectRunnerFormat()` が top-level `snapshot` フィールドを持つ JSON を `vitest` と判定すること（`tasks` フィールドではない — Vitest は Jest 互換形式を使用） <!-- verify: fr-013 -->
- [x] `detectRunnerFormat()` が `testResults[].testFilePath` フィールドを持つ JSON を `jest` と判定すること <!-- verify: fr-013 -->
- [x] Jest JSON レポートから `convertTestResults()` を呼ぶと `passed → green`・`failed → red`・`pending / todo → skip` にマッピングされた test-results.json が生成されること <!-- verify: fr-013 -->
- [x] Vitest JSON レポートから `convertTestResults()` を呼ぶと `passed → green`・`failed → red`・`pending / todo → skip` にマッピングされた test-results.json が生成されること（Vitest は Jest 互換ステータス値を使用） <!-- verify: fr-013 -->
- [x] 不明なフォーマットの results.json に対して `convertTestResults()` を呼ぶと警告ログを出力して silently skip し、test-results.json が生成されないこと <!-- verify: fr-013 -->

---

## リグレッションリスク

### FR-001 — E2E テスト結果一覧（Playwright 形式が引き続き正しく処理されるか）

- [x] `detectRunnerFormat()` 導入後も既存の Playwright JSON が `playwright` と正しく判定され、`convertTestResults()` の Playwright パスが変わらず動作すること <!-- verify: fr-001 -->
  - 確認手順: 既存の Playwright `results.json`（`suites[]` フィールドあり）を入力として `mspec test-results convert` を実行し、生成された test-results.json のステータスが従来と一致することを確認する
  - 確認手順: `detectRunnerFormat()` のユニットテストで `suites[]` あり JSON が `'playwright'` を返すことを確認する

### FR-003 / FR-006 — トレース展開・スタックトレース表示（Jest / Vitest 追加後の degradation）

- [ ] Jest および Vitest の変換ロジックが `stack_trace` フィールドを test-results.json に含めて出力することを確認し、FR-003（トレース展開）・FR-006（E2E トレース検証）が新ランナー形式でも機能すること <!-- verify: human -->（Jest / Vitest の stack_trace フィールド生成は設計ドキュメントに明示されておらず、E2E Scenario で直接カバーされていない）
  - 確認手順: Jest 失敗ケースを含む JSON から変換した test-results.json に `stack_trace` フィールドが存在するかを確認する
  - 確認手順: Vitest 失敗ケースについても同様に `stack_trace` フィールドの有無を確認し、WebUI のトレース展開パネルが表示されることを確認する

### FR-007 — test-results.json が正規データソース（「no results」フォールバックの二重処理リスク）

- [x] FR-011 の `if (error) → "No test results found."` と FR-007 既存の「test-results.json 存在しない → No test results found.」が同じメッセージを返し、二重処理・競合が発生しないこと <!-- verify: fr-007 -->

### FR-010 — スタックトレースのサーバー側サニタイズ（新ランナー形式でのパスマスク）

- [ ] Jest / Vitest から生成した test-results.json の `stack_trace` に絶対パスが含まれる場合、サーバー側のパスマスク処理（FR-010）が引き続き適用されること <!-- verify: human -->（Jest / Vitest の stack_trace フォーマットはサニタイザのパターンと一致しない可能性があり、静的確認のみでは不十分）
  - 確認手順: Jest 失敗テストの stack_trace に `/Users/` などの絶対パスを含む入力を用意し、API レスポンスでマスクされることを確認する
  - 確認手順: Vitest の stack_trace についても同様のマスク確認を実施する

### FR-005 — テスト結果バッジ表示確認（フロントエンド error state 変更の影響）

- [x] `TestResults.tsx` の `if (error)` ブランチ変更後も、test-results.json が正常に取得できる場合に `[data-testid="test-case-pass"]`・`[data-testid="test-case-fail"]`・`[data-testid="test-case-skip"]` が引き続き DOM に存在すること <!-- verify: fr-005 -->

### FR-001 / FR-005 / FR-007 — ネットワーク・500エラー時のエラー隠蔽リスク

- [ ] 500 エラーやネットワーク障害など本物のエラーが発生した場合に、`if (error)` ブランチが "No test results found." を表示してユーザーが根本原因に気づけなくなるリスクを、設計上許容可能と判断した根拠をレビューで確認すること <!-- verify: human -->（エラー種別の隠蔽は機械検証不可。設計判断の妥当性はレビューが必要）
  - 確認手順: API サーバーを停止した状態で WebUI にアクセスし、表示される文言が "No test results found." であることと、コンソールに元のエラーが記録されることを確認する
  - 確認手順: 設計意図（意図的に error state を "No test results" に統一した理由）が design-rationale.md に記録されていることを確認する

---

## デプロイ前確認

### Constitution I — ステップ独立性

- [ ] 本チェンジの実装が前ステップのコンテキスト（会話文脈）に依存せず、`changes/2026-05-30-222051-fix-test-results-webui-display/` 内の成果物のみで再現可能であること <!-- verify: human -->（ステップ独立性は会話コンテキストの参照有無を機械検証不可）
  - 確認手順: 成果物（design.md / tasks.md / Delta Spec）だけを参照して実装が理解できることをレビューで確認する
  - 確認手順: 新規セッションから `mspec status` のみで実装に着手できる構成になっていることを確認する

### Constitution II — 決定論的マージ

- [x] FR-011 / FR-012 / FR-013 の FR-ID が SoT spec に重複せず、`mspec archive` によるマージが冪等に実行できること <!-- verify: cmd:grep -n "FR-011\|FR-012\|FR-013" /Users/kagadminmac/project/mspec/specs/test-result-viewer/spec.md -->

### Constitution IV — 双方向アンカー

- [x] 実装ファイル（`testResults.ts`・`test.ts`・`routes/testResults.ts`・`TestResults.tsx`・`test-results.e2e.test.ts`）に `@mspec-delta 2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md` アンカーが付与されていること（手動確認済み） <!-- verify: cmd:mspec anchor check -->

### Constitution V — 強制ステップと拡張ステップの分離

- [x] `convertTestResults()` の自動呼び出し追加が既存の強制ステップ（spec / delta / archive）の workflow.yaml スキーマを変更しないこと（`workflow.ts` に test-results 参照なし、確認済み） <!-- verify: cmd:grep -n "test-results" /Users/kagadminmac/project/mspec/packages/cli/src/types/workflow.ts -->

### Constitution VI — Security by Default

- [x] Delta Spec に `## Security Capabilities` セクションが存在すること <!-- verify: cmd:grep "## Security Capabilities" /Users/kagadminmac/project/mspec/changes/2026-05-30-222051-fix-test-results-webui-display/specs/test-result-viewer/spec.md -->

### Constitution VII — 設計意図と実装の対応確認

- [ ] design.md の `## Decisions` テーブルで定義された設計判断（`200 []` 変更・フォーマット検出ヒューリスティック・CLI コマンド名）がそれぞれ対応するコードに実装されていること <!-- verify: human -->（設計と実装の対応は E2E で部分的にカバーされるが、設計判断の網羅性はコードレビューが必要）
  - 確認手順: `design.md` の Decisions テーブル全 5 行と対応する実装ファイル・行番号を突き合わせてレビューする
  - 確認手順: design.md に記載のない実装変更がないことを diff で確認する
