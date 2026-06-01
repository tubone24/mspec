# Delta Spec: test-result-viewer

## Security Capabilities

- パスマスク保証: `mspec test-results convert` で生成する test-results.json の `stack_trace` フィールドには、既存の `maskAbsolutePaths()` を Jest / Vitest 変換パスでも適用し、絶対パスを `[path]` に置換する（FR-010 継続保証）
- 書き込みスコープ制限: `mspec test-results convert` コマンドは `changes/<id>/` ディレクトリ配下のみにファイルを書き込む。任意パスへの書き込みは行わない

## ADDED Requirements

### Requirement: FR-011 — WebUI テスト結果ページの到達可能性

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`/changes/:id/test-results` に移動するとき、このシステムは SHALL 対象チェンジの test-results.json を読み込み、テストケース一覧画面をレンダリングする.

#### Scenario: test-results.json が存在する場合にページが表示される
- GIVEN あるチェンジの `changes/<id>/test-results.json` に 1 件以上のエントリが存在する
- WHEN ユーザーが WebUI で `/changes/<id>/test-results` へ移動する
- THEN テストケース一覧が green / red / skip バッジ付きで表示される
- AND ページが 404 または空白になることはない

#### Scenario: test-results.json が存在しない場合のフォールバック
- GIVEN あるチェンジに test-results.json が存在しない
- WHEN ユーザーが WebUI で `/changes/<id>/test-results` へ移動する
- THEN "No test results found." メッセージが表示される
- AND エラーページや白画面にはならない

### Requirement: FR-012 — mspec test 完了後の test-results.json 自動生成

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`mspec test expect-red` または `mspec test expect-green` が完了するとき、このシステムは SHALL 自動的に `convertTestResults()` を呼び出して `changes/<id>/test-results.json` を生成・更新する.

#### Scenario: mspec test 完了後に test-results.json が自動生成される
- GIVEN `changes/<id>/e2e-results/results.json` にランナーの実行結果が存在する
- WHEN `mspec test expect-red <task-id>` または `mspec test expect-green <task-id>` が完了する
- THEN `changes/<id>/test-results.json` が自動生成・更新され、WebUI が次のリクエスト時に結果を表示できる

#### Scenario: e2e-results が存在しない場合の挙動
- GIVEN `changes/<id>/e2e-results/results.json` が存在しない
- WHEN `mspec test` が完了する
- THEN test-results.json の生成はスキップされ、エラーにならない

### Requirement: FR-013 — 汎用テストランナー対応

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`convertTestResults()` を呼び出すとき、このシステムは SHALL Playwright 形式に加えて Jest / Vitest の JSON レポート形式を検出・変換し、ランナーの種別に依存しない統一フォーマットで test-results.json を生成する.

#### Scenario: Jest JSON レポートから test-results.json を生成する
- GIVEN `changes/<id>/e2e-results/results.json` が Jest の `--json` 出力形式（`testResults[].testFilePath` フィールドを含む）である
- WHEN `convertTestResults()` が呼び出される
- THEN `changes/<id>/test-results.json` が生成され、Jest の `passed / failed / pending` が `green / red / skip` にマッピングされる

#### Scenario: Vitest JSON レポートから test-results.json を生成する
- GIVEN `changes/<id>/e2e-results/results.json` が Vitest の JSON レポート形式（top-level `snapshot` フィールドを含む）である
- WHEN `convertTestResults()` が呼び出される
- THEN `changes/<id>/test-results.json` が生成され、Vitest の `passed / failed / pending` が `green / red / skip` にマッピングされる

#### Scenario: 不明なフォーマットの場合のフォールバック
- GIVEN `changes/<id>/e2e-results/results.json` が既知のランナー形式と一致しない
- WHEN `convertTestResults()` が呼び出される
- THEN スキップして test-results.json を生成せず、警告ログを出力する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
