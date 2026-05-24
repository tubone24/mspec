<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# cli-init-command Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Dev-mode Global Link Creation

When `mspec init` is executed and dev-mode is detected (both `package.json` and `tsconfig.json` exist one level above the CLI binary directory), the system SHALL automatically run `npm run build` followed by `npm link` to register the `mspec` command globally. The global link SHALL be created or overwritten silently.

#### Scenario: dev-mode で init を実行するとグローバルコマンドが作成される
- GIVEN mspecリポジトリをクローンして `packages/cli/package.json` と `packages/cli/tsconfig.json` が存在する環境で
- WHEN `mspec init` を実行したとき
- THEN `npm run build` と `npm link` が順番に実行され、`mspec` がグローバルコマンドとして使えるようになる

#### Scenario: グローバルリンクが既に存在する場合は上書きされる
- GIVEN npm グローバル bin ディレクトリに既存の `mspec` シンボリックリンクが存在する環境で
- WHEN `mspec init` を実行したとき
- THEN 既存リンクは警告なしに上書きされ、新しいビルドへのリンクが作成される

### Requirement: FR-002 — Non-dev-mode Skip

If dev-mode is not detected (either `package.json` or `tsconfig.json` is absent one level above the CLI binary directory), the system SHALL skip the global link creation step without error and continue with the remaining `init` operations.

#### Scenario: npm install -g ユーザーは影響を受けない
- GIVEN `npm install -g @mspec/cli` でインストールした環境（`packages/cli/tsconfig.json` が存在しない）で
- WHEN `mspec init` を実行したとき
- THEN グローバルリンク作成処理はスキップされ、通常の `init` 処理（設定ファイル配置等）のみ実行される

### Requirement: FR-003 — Build or Link Failure Tolerance

If `npm run build` or `npm link` fails during global link creation, the system SHOULD emit a warning message and continue completing the remaining `init` file operations, ensuring `mspec init: done.` is always displayed.

#### Scenario: ビルド失敗時でも init の他処理は継続される
- GIVEN `packages/cli` が存在するが TypeScript コンパイルエラーがある環境で
- WHEN `mspec init` を実行したとき
- THEN ビルドエラーの警告が表示され、グローバルリンク作成はスキップされるが、`.mspec/config.yaml` 等の設定ファイル配置は完了し `mspec init: done.` が出力される

#### Scenario: npm link 失敗時でも init の他処理は継続される
- GIVEN `packages/cli` が存在するが npm グローバル bin ディレクトリへの書き込み権限がない環境で
- WHEN `mspec init` を実行したとき
- THEN `npm link` エラーの警告が表示され、設定ファイル配置は完了しており `mspec init: done.` が出力される

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


