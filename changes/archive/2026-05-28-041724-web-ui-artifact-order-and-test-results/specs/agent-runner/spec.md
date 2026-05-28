# Delta Spec: agent-runner

## Security Capabilities

<!-- 権限境界: ファイルシステムアクセス（チェンジ固有 test-results.json の書き込み） -->
<!-- アクセス増加: チェンジディレクトリへの新規ファイル書き込み（test-results.json） -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-004 — テストリザルトフィールドの JSON 出力

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

implement ステップのテスト実行が完了したとき、このシステムは SHALL チェンジ固有の `test-results.json` ファイルに各テストケースの status（`red` / `green` / `skip`）・テスト名・紐づくチェックリスト項目 ID の配列を出力する.

#### Scenario: テスト実行後に test-results.json が生成される
- GIVEN implement ステップでテストが実行された
- WHEN テスト実行が完了する
- THEN `changes/<change>/test-results.json` が生成または更新され、各エントリに `{ "name": "<テスト名>", "status": "red"|"green"|"skip", "checklist_item_ids": ["<ID>", ...] }` の構造が含まれる

#### Scenario: 複数回のテスト実行で結果が上書きされる
- GIVEN test-results.json が既に存在するチェンジで再度テストを実行する
- WHEN テスト実行が完了する
- THEN test-results.json は最新の実行結果で上書きされ、古い結果は保持されない

#### Scenario: FR-003 Log Sanitization との整合
- GIVEN テスト失敗メッセージに環境変数名が含まれる
- WHEN test-results.json を生成する
- THEN MUST NOT 環境変数の値・API キー・認証情報を test-results.json に書き出す（FR-003 に準拠）

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
