<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# cli-state-engine Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

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

