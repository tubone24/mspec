# Delta Spec: web-ui-server

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: Web UI サーバー層（HTTP レスポンス生成）のみ。外部サービスへのアクセスなし -->
<!-- アクセス増加: なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: 該当コンポーネントの前バージョンへの差し戻し -->

## ADDED Requirements

### Requirement: FR-005 — checklist.md の verify-human 項目ハイライト表示

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

checklist.md が表示される間、このシステムは SHALL `verify-human` タグを持つチェックリスト項目を、他の項目と視覚的に区別できるよう背景色または枠線でハイライト表示する.

#### Scenario: verify-human 項目の色付き表示
- GIVEN checklist.md に `verify-human` タグを持つ項目が含まれる
- WHEN Web UI がその checklist.md を描画する
- THEN 該当項目が警告色（例: 黄色背景・オレンジ枠線）で目立つスタイルで表示される

#### Scenario: verify-human 以外の項目は通常表示
- GIVEN checklist.md に `verify-human` タグを持たない通常の項目が含まれる
- WHEN Web UI がその checklist.md を描画する
- THEN 通常スタイルで表示され、ハイライトは適用されない

### Requirement: FR-006 — checklist.md チェックボックスのインタラクティブ操作

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

checklist.md が表示される間、このシステムは SHALL チェックボックス項目をクリック可能なインタラクティブ要素として描画し、ユーザーが Web UI 上で ON/OFF をトグルできるようにする.

#### Scenario: チェックボックスのトグル操作
- GIVEN Web UI に checklist.md のチェックリストが表示されている
- WHEN ユーザーが未チェックの項目をクリックする
- THEN その項目がチェック済みになり、視覚的にチェックマークが表示される

#### Scenario: チェック済み項目のアンチェック操作
- GIVEN Web UI に checklist.md のチェックリストが表示されており、一部の項目がチェック済みである
- WHEN ユーザーがチェック済みの項目をクリックする
- THEN その項目のチェックが外れ、未チェック状態に戻る

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
