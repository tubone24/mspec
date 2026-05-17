# Delta Spec: cli-state-engine

## ADDED Requirements

### Requirement: FR-001 — produces レスステップの done 判定

When a step has `produces: []` and its `step-id` is recorded in `.mspec/cache/done-log.json` for the current change, the system SHALL return `'done'` as the step state.

#### Scenario: done-log に記録済みの produces レスステップ
- GIVEN `implement` ステップが `produces: []` であり `.mspec/cache/done-log.json` に `implement` エントリが存在する
- WHEN `state-engine` が当該ステップを評価する
- THEN ステップ状態として `'done'` が返される

### Requirement: FR-002 — produces レスステップの ready 判定

When a step has `produces: []` and its `step-id` is NOT recorded in `.mspec/cache/done-log.json`, the system SHALL return `'ready'` as the step state (assuming previous step is done or skipped).

#### Scenario: done-log に未記録の produces レスステップ
- GIVEN `implement` ステップが `produces: []` であり `.mspec/cache/done-log.json` に `implement` エントリが存在しない
- WHEN `state-engine` が当該ステップを評価する（前ステップは done 済み）
- THEN ステップ状態として `'ready'` が返される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
