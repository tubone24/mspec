# Delta Spec: change-dashboard

## Security Capabilities

<!-- 権限境界: ファイルシステムアクセス（チェンジディレクトリの読み取りのみ） -->
<!-- アクセス増加: 増加なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-010 — アーティファクト一覧のワークフロー順ソート

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

チェンジ詳細のアーティファクト一覧画面を表示するとき、このシステムは SHALL アーティファクトを mspec ワークフローのステップ定義順（new / proposal / delta / research / design / quickstart / checklist / tasks / implement の順）に従ってソートして表示する.

#### Scenario: アーティファクトがワークフロー順に並ぶ
- GIVEN あるチェンジに proposal.md / design.md / tasks.md が存在する
- WHEN ユーザーがそのチェンジの詳細画面を開く
- THEN proposal.md が design.md より上に、design.md が tasks.md より上に表示される
- AND 新しいチェンジが追加されてもこのソート順は変わらない

#### Scenario: スキップされたステップのアーティファクトが欠けている場合
- GIVEN あるチェンジで proposal ステップがスキップされ proposal.md が存在しない
- WHEN ユーザーがそのチェンジの詳細画面を開く
- THEN 存在するアーティファクトのみがワークフロー順で表示される（欠落したアーティファクトは一覧に現れない）

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
