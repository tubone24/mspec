# Delta Spec: cli-core

## ADDED Requirements

### Requirement: FR-004 — `mspec mock` サブコマンド

`mspec mock` コマンドが実行されたとき、このシステムは SHALL visual mock の生成・ローカルサーバー起動・フィードバック収集をシーケンシャルに実行する。

#### Scenario: `mspec mock` の正常実行

- GIVEN active change が存在し proposal.md が生成済みである
- WHEN ユーザーが `mspec mock --change <change>` を実行する
- THEN HTML/CSS/JS ファイルの生成 → ローカルサーバー起動 → URL 表示 → フィードバック収集の順に処理が進む

#### Scenario: active change が存在しない場合のエラー

- GIVEN `changes/` に active な change が存在しない
- WHEN ユーザーが `mspec mock` を実行する
- THEN エラーメッセージ `no active change found` が表示されコマンドは非ゼロ終了コードで終了する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
