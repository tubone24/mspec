# Delta Spec: cli-init

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: プロジェクトルート内の .mspec/ ディレクトリへのファイル書き込みのみ -->
<!-- アクセス増加: なし（既存の mspec init 権限範囲内） -->
<!-- エージェント権限: 不要 -->
<!-- ロールバック手段: .mspec/.gitignore を手動削除、または --force で再初期化 -->

## ADDED Requirements

### Requirement: FR-012 — Generate `.mspec/.gitignore` with runtime-generated file patterns

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

`mspec init` のとき、このシステムは SHALL `.mspec/.gitignore` を新規作成し、`ui.pid` を含む実行時生成ファイルのパターンを記載する.

#### Scenario: Fresh init creates .mspec/.gitignore
- GIVEN プロジェクトルートに `.mspec/.gitignore` が存在しない
- WHEN ユーザーが `mspec init` を実行する
- THEN `.mspec/.gitignore` が新規作成される
- AND ファイルには `ui.pid` 行が含まれる
- AND コマンドは終了コード 0 で完了する

#### Scenario: Existing .mspec/.gitignore is not overwritten without --force
- GIVEN `.mspec/.gitignore` が既に存在する
- WHEN ユーザーが `mspec init` を `--force` なしで実行する
- THEN `.mspec/.gitignore` の内容は変更されない

#### Scenario: Force re-init regenerates .mspec/.gitignore
- GIVEN `.mspec/.gitignore` が既に存在する
- WHEN ユーザーが `mspec init --force` を実行する
- THEN `.mspec/.gitignore` が新しい内容で再生成される
- AND ファイルには `ui.pid` 行が含まれる

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
