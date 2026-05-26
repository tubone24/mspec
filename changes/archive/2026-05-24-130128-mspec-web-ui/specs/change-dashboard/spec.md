# Delta Spec: change-dashboard

## ADDED Requirements

### Requirement: FR-001 — チェンジ一覧表示

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL アーカイブされていない全チェンジを一覧表示し、各チェンジの ID・作成日・現在ステップ・モードを表に示す.

#### Scenario: アクティブなチェンジ一覧の表示
- GIVEN 複数のアーカイブ前チェンジが存在する
- WHEN ユーザーがダッシュボードにアクセスする
- THEN 全チェンジが作成日の降順で一覧表示され、各行にステップ進捗バーが表示される

### Requirement: FR-002 — ステップ進捗ビジュアライゼーション

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL 各チェンジのワークフローステップ（new / proposal / delta / research / design / quickstart / checklist / tasks / implement / archive）の完了状態を視覚的に表示する.

#### Scenario: 進捗バーの表示
- GIVEN あるチェンジが `design` ステップまで完了している
- WHEN ダッシュボードでそのチェンジ行を参照する
- THEN `new`〜`design` は完了マーク、`quickstart` 以降は未完了マークが付いたステップバーが表示され、ステップ状態の変化は最大 5 秒以内に UI に反映される

### Requirement: FR-003 — モード別フィルター

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL チェンジモード（typo / minor / bugfix / フルフロー）でチェンジ一覧をフィルタリングできる UI 要素を提供する.

#### Scenario: bugfix チェンジのみ表示
- GIVEN bugfix モードとフルフローモードの両方のチェンジが存在する
- WHEN ユーザーが「bugfix」フィルターを選択する
- THEN bugfix モードのチェンジのみが一覧に表示される

### Requirement: FR-004 — チェンジ詳細への遷移

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

チェンジ一覧でエントリをクリックしたとき、このシステムは SHALL そのチェンジのアーティファクト一覧画面に遷移する.

#### Scenario: チェンジクリックによる詳細遷移
- GIVEN ダッシュボードにチェンジ一覧が表示されている
- WHEN ユーザーが特定のチェンジ行をクリックする
- THEN そのチェンジのアーティファクト（proposal.md / design.md 等）一覧ページに遷移する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
