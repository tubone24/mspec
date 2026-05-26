# Delta Spec: test-result-viewer

## ADDED Requirements

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
