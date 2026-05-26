<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# test-result-viewer Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — E2E テスト結果一覧

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL チェンジ配下の E2E テスト結果ファイルを解析し、テストケースごとの合否（red / green / skip）を一覧表示する.

#### Scenario: テスト結果の一覧表示
- GIVEN あるチェンジに Playwright の XML 結果ファイルが存在する
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

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

Playwright E2E テストを実行したとき、このシステムは SHALL `e2e-results/` ディレクトリを持つチェンジのテスト結果ページで green / red / skip バッジが DOM に存在すること、またはテスト結果がない場合に "No test results found." メッセージが表示されること.

#### Scenario: テスト結果ページが正常に表示される
- GIVEN あるチェンジの `/changes/:id/test-results` ページに Playwright がアクセスする
- WHEN ページが完全に読み込まれる
- THEN `[data-testid="test-case-pass"]`・`[data-testid="test-case-fail"]`・`[data-testid="test-case-skip"]` のいずれか、または "No test results found." テキストが DOM に存在する

### Requirement: FR-006 — E2E 失敗テストのトレース展開確認

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

Playwright E2E テストを実行したとき、このシステムは SHALL 失敗テストケース行をクリックするとトレースパネル（`data-testid="trace-panel"`）が展開表示されること.

#### Scenario: 失敗テストのトレースが展開される
- GIVEN テスト結果ページに `[data-testid="test-case-fail"]` が 1 件以上存在する
- WHEN Playwright がその要素をクリックする
- THEN `[data-testid="trace-panel"]` 要素が visible 状態になりスタックトレースまたはエラーメッセージテキストが表示される


