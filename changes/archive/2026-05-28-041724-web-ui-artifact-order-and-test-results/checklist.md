---
doc_type: Reference
---

# Checklist: web-ui-artifact-order-and-test-results

## Delta Spec Coverage

### change-dashboard

- [x] FR-010: アーティファクト一覧が mspec ワークフロー定義順（new/proposal/delta/research/design/quickstart/checklist/tasks/implement）にソートされて表示される <!-- verify: fr-010 -->
- [x] FR-010 Scenario（スキップステップ）: proposal.md が存在しないチェンジで、存在するアーティファクトのみがワークフロー順で表示され、欠落ファイルが一覧に現れない <!-- verify: fr-010 -->

### test-result-viewer

- [x] FR-007: test-results.json を正規データソースとして参照し、red/green/skip のエントリが各バッジ付きで一覧表示される <!-- verify: fr-007 -->
- [x] FR-007 Scenario（ファイル不在）: test-results.json が存在しないチェンジで Test Result Viewer を開いたとき "No test results found." が表示される <!-- verify: fr-007 -->
- [x] FR-008: 各テストケース行に checklist_item_ids の全 ID がラベルまたはリンクとして表示される（n:1 紐づき含む） <!-- verify: fr-008 -->
- [x] FR-009: checklist_item_ids に checklist.md に存在しない ID が含まれる場合、「チェックリスト項目：未解決」警告バッジが表示され、かつテストケース自体のステータスバッジも通常通り表示される <!-- verify: fr-009 -->
- [x] FR-010: スタックトレース中の絶対パス（Unix / Windows 両形式）がサーバー側で `[path]` にマスクされてからレスポンスに含まれる <!-- verify: fr-010 -->
- [x] FR-001 MODIFIED: データソースが Playwright XML から test-results.json に変更され、既存の `GET /api/changes/:id/test-results` レスポンスの TestCase.status が `red→fail / green→pass` に変換されて返る <!-- verify: fr-001 -->

### agent-runner

- [x] FR-004: implement ステップのテスト実行完了後に `changes/<change>/test-results.json` が生成または上書きされ、各エントリに `{ name, status: "red"|"green"|"skip", checklist_item_ids }` の構造が含まれる <!-- verify: fr-004 -->
- [x] FR-004 Scenario（上書き）: test-results.json が既存のチェンジで再テスト実行時、最新結果で上書きされ古い結果が保持されない <!-- verify: fr-004 -->
- [x] FR-004 Scenario（FR-003 整合）: テスト失敗メッセージに環境変数名が含まれる場合でも、環境変数の値・APIキー・認証情報が test-results.json に書き出されない <!-- verify: fr-004 -->

## Source-of-Truth Regression

### change-dashboard SoT（FR-001〜FR-009）

- [x] SoT FR-001（チェンジ一覧表示）: アーティファクトソート変更（routes/artifacts.ts）がチェンジ一覧の表示件数・順序・ステップ進捗表示に影響を与えない <!-- verify: fr-001 -->
- [x] SoT FR-002（ステップ進捗ビジュアライゼーション）: WORKFLOW_STEP_ORDER 定数追加がステップ進捗バーのレンダリングロジックに干渉しない <!-- verify: fr-002 -->
- [x] SoT FR-007（リアルタイム進捗）: artifacts.ts のソート追加が SSE/ポーリング更新の頻度・レイテンシに影響を与えない <!-- verify: fr-007 -->
- [x] SoT FR-009（SoT Spec ビューアー）: アーティファクト一覧ルートの変更が `specs/*/spec.md` 表示ルートに影響を与えない <!-- verify: fr-009 -->

### test-result-viewer SoT（FR-001〜FR-006）

- [x] SoT FR-001 退行（Playwright XML 廃止）: test-results.json 不在時の既存フォールバックコードが routes/testResults.ts に実装されているか確認する <!-- verify: human -->
- [x] SoT FR-001 退行（E2E テスト修正）: 既存 E2E テストが Playwright XML 依存のシナリオを含む場合、テスト修正またはスキップが必要か確認する <!-- verify: human -->
- [x] SoT FR-003（失敗詳細トレース表示）: stack_trace フィールドがパスマスク後も `data-testid="trace-panel"` に展開表示されることを確認する <!-- verify: fr-003 -->
- [x] SoT FR-005（E2E バッジ表示確認）: test-results.json を正規データソースとした後も `[data-testid="test-case-pass"]` 等の testid が維持されることを確認する <!-- verify: fr-005 -->
- [x] SoT FR-006（E2E トレース展開確認）: パスマスクされたスタックトレースでも `data-testid="trace-panel"` が visible 状態になることを確認する <!-- verify: fr-006 -->

### agent-runner SoT（FR-001〜FR-003）

- [x] SoT FR-001（Subagent Run Logger）: `mspec test-results convert` コマンド追加が `.agent-runs.jsonl` のログ追記ロジックに干渉しない <!-- verify: fr-001 -->
- [x] SoT FR-002（Log Entry Schema）: test-results.json 生成コマンドが agent-run ログエントリのスキーマフィールドに影響を与えない <!-- verify: fr-002 -->
- [x] SoT FR-003（Log Sanitization、risk_tier: critical）: test-results.json の全フィールドに機密情報（secrets・環境変数値・APIキー）が混入しないことを実際の失敗テストデータで確認する <!-- verify: human -->
- [x] SoT FR-003: error_message フィールドに環境変数を展開した文字列が含まれないことをユニットテストまたは手動検証で確認する <!-- verify: human -->

## Security

- [x] XSS: TestResults.tsx が `dangerouslySetInnerHTML` を使用せず、React 自動エスケープのみで checklist_item_ids・error_message・stack_trace をレンダリングしている <!-- verify: fr-010 -->
- [x] パスマスク正規表現の網羅性: `maskAbsolutePaths` の正規表現が Unix 絶対パス（`/path/to/file`）および Windows 絶対パス（`C:\path\to\file`）を両方マスクすることをユニットテストで確認する <!-- verify: fr-010 -->
- [x] test-results.json 書き込みスコープ: `mspec test-results convert` の書き込み先が `changes/<change>/test-results.json` に限定され、チェンジディレクトリ外へのパストラバーサルが発生しない <!-- verify: human -->
- [x] change ID バリデーション: `--change` 引数が英数字・ハイフン・アンダースコアのみ許容され、`../` 等を含む場合に書き込み先が `changes/` 外に出ないことを確認する <!-- verify: human -->
- [x] checklist.md 読み取りスコープ: `isResolved` 判定の checklist.md 読み取りパスが change ID から安全に構築され、パストラバーサルが不可能であることを確認する <!-- verify: human -->

## Constitution

- [x] 原則 IV（双方向アンカー）: `mspec anchor check` が 0 エラーで完了している <!-- verify: cmd:mspec anchor check -->
- [x] 原則 VI（Security by Default）: 全 Delta Spec ファイルに `## Security Capabilities` セクションが存在する <!-- verify: cmd:grep "## Security Capabilities" -->
- [x] 原則 I（ステップ独立性）: artifacts.ts / testResultParser.ts / testResults.ts / TestResults.tsx の変更が対象モジュール外の依存関係を新たに生じさせていないことをコードレビューで確認する <!-- verify: human -->
- [x] 原則 II（決定論的マージ）: API 型変更（checklist_item_ids / is_resolved フィールド追加）が後方互換な追加のみであり、既存フィールドの削除・型変更を含まないことを確認する <!-- verify: human -->
- [x] 原則 III（質問駆動の要件確定）: D-2・D-3・D-4・D-5 が FR の未決定事項を残さず確定させており、抽出正規表現 `\[FR-(\d+)\]` が Delta Spec のテスト名命名規則と整合していることを確認する <!-- verify: human -->
- [x] 原則 V（強制ステップと拡張ステップの分離）: `workflow.yaml` に `test-results convert` が強制ステップとして追加されておらず、既存ステップの独立性を損なっていないことを確認する <!-- verify: human -->
