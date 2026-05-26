# Delta Spec: change-dashboard

## ADDED Requirements

### Requirement: FR-007 — ステップ実行中のリアルタイム進捗描画

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

ステップが実行中の間、このシステムは SHALL ダッシュボードのステップ進捗表示をポーリングまたはサーバー送信イベント（SSE）によって 2 秒以内のレイテンシで自動更新し、ユーザーが手動リロードなしにステップの進行状況を確認できるようにする.

#### Scenario: ステップ実行中に進捗が自動更新される
- GIVEN ダッシュボードが表示されており、あるチェンジのステップが CLI で実行中である
- WHEN ステップの状態が変化する（例: `ready` → `in_progress` → `done`）
- THEN ダッシュボード上の該当チェンジのステップインジケーターが 2 秒以内に新しい状態へ更新される（ページリロード不要）

#### Scenario: 実行中ステップにアニメーションが表示される
- GIVEN あるチェンジのステップが `in_progress` 状態である
- WHEN ダッシュボードでそのチェンジを表示する
- THEN 実行中のステップに回転インジケーターなどのアニメーションが付与され、完了済み・未着手ステップと視覚的に区別される

#### Scenario: ステップ完了時に即座に表示が切り替わる
- GIVEN ダッシュボードでステップ実行中アニメーションが表示されている
- WHEN ステップが完了する
- THEN 実行中アニメーションが完了マークに切り替わり、次のステップが強調表示される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
