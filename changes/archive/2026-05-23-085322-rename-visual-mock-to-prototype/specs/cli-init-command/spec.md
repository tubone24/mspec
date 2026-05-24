# Delta Spec: cli-init-command

## ADDED Requirements

### Requirement: FR-004 — カスタムサブエージェントの自動インストール

`mspec init` が実行されたとき、このシステムは SHALL `mspec-visual-prototype-runner` を含むカスタムサブエージェントファイルを `.claude/agents/` ディレクトリにコピーしてインストールする。

#### Scenario: init 実行時にサブエージェントがインストールされる

- GIVEN `mspec init` を実行するプロジェクトディレクトリで `.claude/agents/` が存在しないまたは空である
- WHEN ユーザーが `mspec init` を実行する
- THEN `.claude/agents/mspec-visual-prototype-runner.md` が生成され、`mspec prototype` コマンドからサブエージェントが呼び出し可能になる

#### Scenario: 既存サブエージェントは上書きされる

- GIVEN `.claude/agents/mspec-visual-prototype-runner.md` が古いバージョンで存在する
- WHEN ユーザーが `mspec init` を実行する
- THEN サブエージェントファイルは最新版で上書きされ、`mspec init: done.` が出力される

## MODIFIED Requirements

## REMOVED Requirements

## RENAMED Requirements
