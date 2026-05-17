# Delta Spec: cli-workflow-engine

## ADDED Requirements

### Requirement: FR-018 — produces レスステップからの skippable 除去

The `workflow.yaml` MUST NOT carry `skippable: true` on steps where `produces: []` and `removable: false` (mandatory produce-less steps: `self-review`, `implement`, `archive`). Done transition for these steps SHALL be handled exclusively by `.mspec/cache/done-log.json` via `mspec done`.

#### Scenario: workflow.yaml の skippable フラグ削除
- GIVEN `implement`・`archive`・`self-review` ステップに `skippable: true` が設定されている
- WHEN 本チェンジが archive される
- THEN これらのステップの `skippable: true` が削除され、done への遷移は `mspec done` コマンドのみで行われる

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
