# Delta Spec: change-dashboard

## Security Capabilities

<!-- mspec-security-analyzerサブエージェントが生成した動的セキュリティ質問と回答のペアをここに列挙する -->
<!-- 例: 権限境界: <動的質問への回答> -->
<!-- 例: ロールバック手段: <動的質問への回答> -->

## ADDED Requirements

### Requirement: FR-011 — アーカイブ件数の初期表示

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

ダッシュボードが初期ロードされたとき、このシステムは SHALL アーカイブ済みチェンジの件数を API から取得し、アーカイブフィルタートグル付近に正確な件数バッジとして表示する.

#### Scenario: 初期ロード時にアーカイブ件数が表示される
- GIVEN `changes/archive/` に 3 件のアーカイブ済みチェンジが存在する
- WHEN ユーザーがダッシュボード URL にアクセスし、ページが初期表示される
- THEN アーカイブフィルタートグル付近に「3」が件数バッジとして表示され、フィルターをクリックする前から正しい件数が確認できる

#### Scenario: アーカイブが 0 件のときは 0 が表示される
- GIVEN `changes/archive/` が空である
- WHEN ユーザーがダッシュボードを開く
- THEN アーカイブ件数バッジに「0」が表示される（初期ロード完了後）

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
