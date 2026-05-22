<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# upgrade-command Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — package.json の絶対パス参照

`mspec upgrade` が実行されたとき、このシステムは SHALL `__dirname` を基点とした絶対パスで `package.json` を参照する。

#### Scenario: グローバルインストール環境での package.json 解決
- GIVEN `@mspec/cli` が `/opt/homebrew/lib/node_modules/@mspec/cli/` にグローバルインストールされている
- WHEN ユーザーが任意のディレクトリで `mspec upgrade` を実行する
- THEN システムは `dist/index.js` の `__dirname` から `../package.json` を正しく解決し、エラーなくバージョン情報を取得する

#### Scenario: ローカルインストール環境での regression なし
- GIVEN `@mspec/cli` がプロジェクトの `node_modules/` にローカルインストールされている
- WHEN ユーザーが `mspec upgrade` を実行する
- THEN システムは従来通り `package.json` を正しく解決し、正常に動作する

### Requirement: FR-002 — upgrade コマンドの Cannot find module エラー排除

グローバルインストール環境で `mspec upgrade` が実行された場合、このシステムは SHALL `Cannot find module '../../package.json'` エラーを発生させずにコマンドを完了する。

#### Scenario: エラーが発生しないことの確認
- GIVEN `@mspec/cli` がグローバルインストールされている
- WHEN `mspec upgrade` を実行する
- THEN プロセスは exit code 0 で終了し、標準エラー出力に `Cannot find module` が含まれない

