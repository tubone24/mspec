# Delta Spec: full-text-search

## Security Capabilities

<!-- 権限境界: ファイルシステムアクセス（ドキュメント読み込み） -->
<!-- アクセス増加: ファイル読み書き範囲の拡大（ドキュメントディレクトリ配下を広く読む） -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-001 — クライアントサイド全文検索エンジンの採用

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

ユーザーが検索クエリを入力したとき、このシステムは SHALL クライアントサイド npm パッケージ（Elasticsearch 等のサーバーサイドミドルウェアを使用せず）を用いて全文検索を実行する.

#### Scenario: npm パッケージのみで全文検索が動作する
- GIVEN ブラウザ上で mspec Web UI が起動している
- WHEN ユーザーが検索ボックスにキーワードを入力する
- THEN サーバーサイドへの検索リクエストを発生させず、クライアントサイドで即座に検索結果を返す

### Requirement: FR-002 — ドキュメント本文コンテンツの検索対象化

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

検索クエリが入力されたとき、このシステムは SHALL 変更名・タイトル・サマリー・タグに加えて、仕様書・ドキュメントの本文テキストコンテンツを検索対象に含める.

#### Scenario: 本文テキストのみに存在するキーワードで検索できる
- GIVEN 検索インデックスが構築済みの状態
- WHEN ユーザーが変更のタイトルには含まれないが仕様書本文に存在するキーワードで検索する
- THEN 該当仕様書を含む変更が検索結果に表示される

### Requirement: FR-003 — 検索結果ゼロ時の空状態表示

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

検索クエリが入力されたが一致するドキュメントが存在しない場合、このシステムは SHALL 「該当する結果がありません」旨のメッセージを表示する.

#### Scenario: マッチなし時のフィードバック
- GIVEN 全文検索インデックスが構築済みの状態
- WHEN ユーザーがどのドキュメントにも存在しないキーワードを入力する
- THEN 空のリスト表示に加えて「No results」または同等の空状態メッセージを表示する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
