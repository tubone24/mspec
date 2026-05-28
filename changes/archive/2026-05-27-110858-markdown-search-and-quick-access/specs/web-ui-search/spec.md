# Delta Spec: web-ui-search

## Security Capabilities

<!-- 権限境界: クライアントサイドのみ（ファイルシステムアクセスなし） -->
<!-- アクセス増加: 増加なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->
<!-- XSS対策: textContentのみ使用（HTML未レンダリング） -->
<!-- DoS対策: リテラルマッチのみ（正規表現禁止、ReDoS回避） -->

## ADDED Requirements

### Requirement: FR-004 — Markdown本文ヒット行スニペット表示

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

検索クエリがMarkdown本文にマッチしたとき、このシステムは SHALL マッチした行とその前後2行をプレーンテキスト（textContent）としてChangesダッシュボードの検索結果にスニペット表示する.

#### Scenario: Changes検索でヒット行がスニペットで表示される
- GIVEN Changesダッシュボードが表示されていて全文検索インデックスが構築済みの状態
- WHEN ユーザーがアーティファクト本文にのみ存在するキーワードを入力する
- THEN 検索結果の各Changeカードにヒット行前後2行のプレーンテキストスニペットが表示される

### Requirement: FR-005 — スペース区切り複数キーワードのAND条件検索

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

ユーザーがスペース区切りで複数キーワードを入力したとき、このシステムは SHALL すべてのキーワードをリテラルマッチで含むChangeのみを結果として返す.

#### Scenario: AND条件で複数キーワードを絞り込む
- GIVEN Changesダッシュボードで全文検索インデックスが構築済みの状態
- WHEN ユーザーが「quick access palette」と入力する
- THEN 3つのキーワードを全て含むChangeのみが結果として表示される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
