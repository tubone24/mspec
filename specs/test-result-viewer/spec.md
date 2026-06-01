<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# test-result-viewer Specification

## Purpose

チェンジ固有の test-results.json を正規データソースとして E2E テスト結果を green/red/skip バッジで一覧表示し、失敗ケースのスタックトレース展開・チェックリスト項目との紐づき・サーバー側パスマスクをユーザーに提供する。

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — E2E テスト結果一覧

このシステムは SHALL チェンジ配下の E2E テスト結果ファイルを解析し、テストケースごとの合否（red / green / skip）を一覧表示する.
**変更内容**: データソースを Playwright XML ファイルから、FR-007 で定義する チェンジ固有の test-results.json に変更する。Playwright XML による解析（旧 FR-001 の GIVEN 条件）は廃止し、test-results.json を正規データソースとする。

#### Scenario: テスト結果の一覧表示（JSONソース）
- GIVEN あるチェンジに test-results.json が存在し red / green / skip エントリを含む
- WHEN ユーザーが Test Result Viewer を開く
- THEN テストケース一覧が表示され、各ケースに green / red / skip のバッジが付く

### Requirement: FR-002 — テスト結果バッジ表示

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL テスト結果のステータスを green（合格）・red（失敗）・skip（スキップ）の色分けバッジで視覚化する.

#### Scenario: 失敗テストの強調表示
- GIVEN 10件中 2件のテストが失敗している
- WHEN Test Result Viewer にアクセスする
- THEN 失敗した 2件が赤バッジで上部にハイライト表示される

### Requirement: FR-003 — テスト失敗の詳細トレース表示

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

テストが失敗した場合、このシステムは SHALL テストケースをクリックすることでエラーメッセージ・スタックトレース・スクリーンショット（存在する場合）を展開表示する.

#### Scenario: 失敗テストの詳細確認
- GIVEN E2E テストが失敗しスタックトレースが記録されている
- WHEN ユーザーが失敗テストケース行をクリックする
- THEN エラーメッセージとスタックトレースが折りたたみパネルで展開される

### Requirement: FR-004 — スキップテストの明示表示

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL スキップされたテストケースを gray バッジで表示し、スキップ理由が記録されている場合はツールチップで表示する.

#### Scenario: スキップテストの確認
- GIVEN `it.skip` または `test.skip` でスキップされたテストが存在する
- WHEN Test Result Viewer にアクセスする
- THEN スキップテストが gray バッジ付きで表示される

### Requirement: FR-005 — E2E テスト結果バッジの表示確認

**変更内容**: データソースが test-results.json に変更されたため、シナリオの GIVEN 条件を「Playwright XML 結果ファイル」から「test-results.json」に更新する。`data-testid` は変更しない。

#### Scenario: テスト結果ページが test-results.json から正常に表示される
- GIVEN あるチェンジの `changes/<id>/test-results.json` に red / green / skip エントリが存在する
- WHEN `/changes/:id/test-results` ページが完全に読み込まれる
- THEN `[data-testid="test-case-pass"]`・`[data-testid="test-case-fail"]`・`[data-testid="test-case-skip"]` のいずれか、または "No test results found." テキストが DOM に存在する

### Requirement: FR-006 — E2E 失敗テストのトレース展開確認

**変更内容**: スタックトレースの表示元が test-results.json の `stack_trace` フィールドに変更されたため、シナリオの GIVEN 条件を更新する。パスマスク適用後の stack_trace でも `data-testid="trace-panel"` が visible になることを検証する。

#### Scenario: 失敗テストのトレースが test-results.json から展開される
- GIVEN test-results.json に `status: "red"` かつ `stack_trace` フィールドを持つエントリが 1 件以上存在する
- WHEN Playwright が `[data-testid="test-case-fail"]` 要素をクリックする
- THEN `[data-testid="trace-panel"]` 要素が visible 状態になり、パスマスク済みのスタックトレースまたはエラーメッセージテキストが表示される

### Requirement: FR-007 — エージェントJSONフィールド参照によるテストリザルト構成

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

テストリザルト画面を表示するとき、このシステムは SHALL チェンジ固有の test-results.json ファイルを参照し、各テストケースの status（red / green / skip）を読み込んでテストリザルト一覧を構成する.

#### Scenario: エージェントJSONからテストリザルトを構成する
- GIVEN あるチェンジの test-results.json に red / green / skip のエントリが存在する
- WHEN ユーザーが Test Result Viewer を開く
- THEN test-results.json を参照してテストケース一覧が表示され、各ケースに green / red / skip のバッジが付く
- AND 表示内容は Playwright XML ではなく test-results.json を正規データソースとする

#### Scenario: test-results.json が存在しない場合
- GIVEN あるチェンジに test-results.json が存在しない
- WHEN ユーザーが Test Result Viewer を開く
- THEN "No test results found." メッセージが表示される

### Requirement: FR-008 — テストケースとチェックリスト項目の紐づき表示

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

テストリザルト画面を表示するとき、このシステムは SHALL 各テストケースに紐づくチェックリスト項目 ID を表示し、1 つのテストケースが複数のチェックリスト項目に紐づく場合（n:1）もすべての紐づきを一覧できるようにする.

#### Scenario: チェックリスト紐づきが表示される
- GIVEN test-results.json のテストケースエントリに checklist_item_id フィールドが存在する
- WHEN ユーザーが Test Result Viewer を開く
- THEN 各テストケース行に紐づくチェックリスト項目 ID がラベルまたはリンクとして表示される

#### Scenario: 複数のチェックリスト項目に紐づくテストケース
- GIVEN あるテストケースが 3 つのチェックリスト項目に紐づいている
- WHEN ユーザーがそのテストケース行を確認する
- THEN 3 つのチェックリスト項目 ID がすべて表示される

### Requirement: FR-009 — チェックリスト紐づき未解決時の警告表示

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

テストリザルト画面を表示するとき、テストケースの checklist_item_id が参照先のチェックリスト項目に存在しない場合（dangling reference）、このシステムは SHALL テスト結果を表示したうえで「チェックリスト項目：未解決」として警告表示する.

#### Scenario: Dangling reference の警告表示
- GIVEN テストケースの checklist_item_id が checklist.md に存在しないチェックリスト項目を参照している
- WHEN ユーザーが Test Result Viewer を開く
- THEN そのテストケース行に「チェックリスト項目：未解決」の警告バッジが表示される
- AND テストケース自体の red / green / skip ステータスは通常通り表示される

### Requirement: FR-010 — スタックトレースのサーバー側サニタイズ

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

テストリザルトのスタックトレースを返すとき、このシステムは SHALL サーバー側で絶対パスをマスク（例: `/Users/xxx/...` → `[path]`）してからレスポンスに含める.

#### Scenario: スタックトレースの絶対パスがマスクされる
- GIVEN テスト失敗のスタックトレースに絶対ファイルパスが含まれる
- WHEN Test Result Viewer がスタックトレースを表示する
- THEN 絶対パス部分は `[path]` などのマスク文字列に置換されてレンダリングされる

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




