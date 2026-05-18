# Delta Spec: version-check

## ADDED Requirements

### Requirement: FR-001 — npm registry からの最新バージョン取得
このシステムは SHALL npm registry（`https://registry.npmjs.org/@mspec/cli/latest`）へのリクエストによって `@mspec/cli` の最新 stable バージョンを取得する.

#### Scenario: 最新バージョンの取得成功
- GIVEN ネットワーク接続が正常に利用可能である
- WHEN バージョンチェックが実行される
- THEN npm registry から最新バージョン文字列（例: "1.2.3"）が正常に取得される

### Requirement: FR-002 — ネットワークエラー時のエラーメッセージ表示
ネットワーク接続に失敗またはタイムアウトが発生した場合、このシステムは SHALL 処理を中断し、ユーザーに分かりやすいエラーメッセージを標準エラー出力に表示してゼロ以外の終了コードで終了する.

#### Scenario: ネットワーク障害時の挙動
- GIVEN npm registry へのネットワーク接続が利用不可である
- WHEN バージョンチェックが実行される
- THEN エラーメッセージが表示され、アップグレード処理は実行されず、非ゼロの終了コードで終了する

### Requirement: FR-003 — ベータ・RC バージョンの除外
このシステムは SHALL `latest` タグのバージョンのみを対象とし、`next` / `beta` / `rc` などの pre-release タグを比較対象から除外する.

#### Scenario: pre-release バージョンが最新の場合でも除外される
- GIVEN npm registry に `latest` タグの安定版と `next` タグのベータ版が存在する
- WHEN バージョンチェックが実行される
- THEN `latest` タグに対応する安定版バージョンのみが比較対象として使用される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
