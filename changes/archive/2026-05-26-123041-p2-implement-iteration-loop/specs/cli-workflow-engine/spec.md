# Delta Spec: cli-workflow-engine

## Security Capabilities

<!-- 権限境界: workflow.yaml スキーマと SKILL.md のみ変更、外部 API 無変更 -->
<!-- アクセス増加: なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-024 — implement ステップの max_iterations 設定

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL implement ステップの `max_iterations` フィールドを workflow.yaml で設定可能にする。

#### Scenario: max_iterations フィールドの schema 検証
- GIVEN workflow.yaml の implement ステップに `max_iterations: 3` が設定されている
- WHEN `mspec schema validate` を実行する
- THEN バリデーションエラーなしで通過する

#### Scenario: max_iterations 未設定の場合のデフォルト
- GIVEN workflow.yaml の implement ステップに `max_iterations` が設定されていない
- WHEN workflow を読み込む
- THEN `max_iterations` は `undefined`（制限なし）として扱われる

### Requirement: FR-025 — implement スキルのエスカレーション手順

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL implement スキルが `max_iterations` 回の TDD 失敗後にエスカレーション手順を実行する。

#### Scenario: max_iterations 到達時のエスカレーション
- GIVEN tasks.md のタスクで TDD red→green が `max_iterations` 回連続して失敗した
- WHEN エスカレーション条件が満たされる
- THEN design.md の末尾に `## Escalation Summary` セクションが追記される

#### Scenario: エスカレーションサマリの内容
- GIVEN TDD が max_iterations 回失敗した
- WHEN `## Escalation Summary` が追記される
- THEN タスクID、失敗回数、失敗理由の要約、推奨アクション（設計変更 or 仕様見直し）が含まれる

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
