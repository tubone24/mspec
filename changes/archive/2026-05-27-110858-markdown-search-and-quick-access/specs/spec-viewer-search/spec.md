# Delta Spec: spec-viewer-search

## Security Capabilities

<!-- 権限境界: クライアントサイドのみ（ファイルシステムアクセスなし） -->
<!-- アクセス増加: 増加なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->
<!-- XSS対策: textContentのみ使用（HTML未レンダリング） -->
<!-- DoS対策: リテラルマッチのみ（正規表現禁止、ReDoS回避） -->

## ADDED Requirements

### Requirement: FR-008 — Markdown本文ヒット行スニペット表示

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

検索クエリがMarkdown本文にマッチしたとき、このシステムは SHALL マッチした行とその前後2行をプレーンテキスト（textContent）としてスニペット表示する.

#### Scenario: 本文ヒット行がスニペットで表示される
- GIVEN Spec Viewer の検索インデックスが構築済みで、ユーザーが検索ボックスにキーワードを入力した
- WHEN 入力したキーワードがいずれかの spec.md 本文にマッチする
- THEN サイドバーの検索結果にヒット行前後2行のプレーンテキストスニペットが表示される

### Requirement: FR-009 — スペース区切り複数キーワードのAND条件検索

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

ユーザーがスペース区切りで複数キーワードを入力したとき、このシステムは SHALL すべてのキーワードをリテラルマッチで含むドキュメントのみを結果として返す.

#### Scenario: AND条件で複数キーワードを絞り込む
- GIVEN Spec Viewer の検索インデックスが構築済みの状態
- WHEN ユーザーが「検索 スニペット」と入力する
- THEN 両キーワードを本文または見出しに含む capability のみがサイドバーに表示される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
