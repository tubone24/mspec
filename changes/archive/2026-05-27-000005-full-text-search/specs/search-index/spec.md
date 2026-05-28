# Delta Spec: search-index

## Security Capabilities

<!-- 権限境界: ファイルシステムアクセス（ドキュメント読み込み） -->
<!-- アクセス増加: ファイル読み書き範囲の拡大（ドキュメントディレクトリ配下を広く読む） -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-001 — ブラウザ起動時の動的インデックス構築

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

Web UI が初期化されたとき、このシステムは SHALL API から取得した変更一覧および各変更のアーティファクトコンテンツを元に全文検索インデックスをメモリ上に動的に構築する.

#### Scenario: 起動時にインデックスが自動構築される
- GIVEN ユーザーが mspec Web UI を開いた
- WHEN アプリケーションの初期化処理が完了する
- THEN 全変更の仕様書・ドキュメント本文を含む検索インデックスがメモリ上に構築され、検索が有効化される

### Requirement: FR-002 — インデックス対象フィールドの定義

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

インデックスを構築するとき、このシステムは SHALL 各ドキュメントについて少なくとも「変更名」「タイトル」「サマリー」「タグ」「本文テキスト」をインデックス対象フィールドとして含める.

#### Scenario: 複数フィールドをまたいだ検索
- GIVEN インデックスが構築済みの状態
- WHEN ユーザーが変更のタグと一致するキーワードで検索する
- THEN タグフィールドのマッチも検索結果に反映される

### Requirement: FR-003 — インデックス構築失敗時の劣化動作

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

インデックス構築中にエラーが発生した場合、このシステムは SHALL 全文検索を無効化し、既存のメタデータのみによる部分一致検索にフォールバックする.

#### Scenario: API エラー時にも基本検索が動作する
- GIVEN API からアーティファクトコンテンツの取得に失敗した
- WHEN ユーザーが検索クエリを入力する
- THEN エラーは UI に表示せず、変更名・タイトル・タグ等のメタデータを対象とした部分一致検索で結果を返す

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
