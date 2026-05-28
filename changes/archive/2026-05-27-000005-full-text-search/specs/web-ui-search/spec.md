# Delta Spec: web-ui-search

## Security Capabilities

<!-- 権限境界: ファイルシステムアクセス（ドキュメント読み込み） -->
<!-- アクセス増加: ファイル読み書き範囲の拡大（ドキュメントディレクトリ配下を広く読む） -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-001 — 既存検索 UI の全文検索エンジンへの接続

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

ユーザーが検索ボックスにテキストを入力したとき、このシステムは SHALL 既存の `String.prototype.includes()` 部分一致検索を廃止し、全文検索インデックスに対してクエリを発行する.

#### Scenario: 検索入力が全文検索エンジンに渡される
- GIVEN 全文検索インデックスが構築済みで Dashboard が表示されている
- WHEN ユーザーが検索ボックスに文字を入力する
- THEN クライアントサイド全文検索エンジンがクエリを処理し、スコアリングされた結果を返す

### Requirement: FR-002 — 検索対象の全ドキュメントへの拡張

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

全文検索が有効な状態の間、このシステムは SHALL 変更のメタデータ（名前・タイトル・タグ）に加えてすべての仕様書・ドキュメントアーティファクトの本文テキストを検索対象に含める.

#### Scenario: アーティファクト本文を横断して検索できる
- GIVEN 複数の変更がそれぞれ proposal.md・spec.md・design.md を持つ状態
- WHEN ユーザーがいずれかのドキュメント本文にのみ登場するキーワードを検索する
- THEN そのドキュメントを持つ変更が検索結果に表示される

### Requirement: FR-003 — 検索結果のスコアベースソート

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

検索クエリに対して複数の結果が存在する場合、このシステムは SHALL 全文検索エンジンが算出した関連度スコアの降順で結果を並べ替えて表示する.

#### Scenario: 関連度の高い変更が上位に表示される
- GIVEN 複数の変更がクエリキーワードを異なる頻度で含む状態
- WHEN ユーザーが検索クエリを入力する
- THEN キーワードの出現頻度・位置に基づくスコアの高い変更が先頭に表示される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
