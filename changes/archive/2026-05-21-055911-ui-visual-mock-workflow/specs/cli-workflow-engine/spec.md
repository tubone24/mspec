# Delta Spec: cli-workflow-engine

## ADDED Requirements

### Requirement: FR-023 — visual-mock の任意ステップ定義

このシステムは SHALL ワークフロー定義に `visual-mock` を任意（skip 可能）ステップとして proposal ステップの直後に追加し、`block_after: true` で停止して次ステップへの進行はユーザー確認後とする。

#### Scenario: visual-mock ステップがワークフローに出現する

- GIVEN change が `proposal` ステップを完了している
- WHEN `mspec continue --change <change> --json` を実行する
- THEN `current_step: "visual-mock"` が返り、`block_after: true` が設定されている

#### Scenario: visual-mock を skip する

- GIVEN ユーザーが visual-mock ステップを不要と判断している
- WHEN `mspec skip visual-mock --change <change> --reason "..."` を実行する
- THEN visual-mock ステップが `skipped` 状態となり次ステップへ進める

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
