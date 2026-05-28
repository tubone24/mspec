<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# web-ui-search Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

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


