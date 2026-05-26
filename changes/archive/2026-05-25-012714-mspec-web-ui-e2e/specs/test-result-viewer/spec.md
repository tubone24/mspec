# Delta Spec: test-result-viewer

## ADDED Requirements

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
