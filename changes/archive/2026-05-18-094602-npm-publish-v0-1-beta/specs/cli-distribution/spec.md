---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: npm-publish-v0-1-beta -->

# Delta Spec: cli-distribution

## ADDED Requirements

### Requirement: FR-001 — npm パッケージ公開設定

`@mspec/cli` パッケージが npm registry に公開可能な状態である場合、このシステムは SHALL `package.json` に `bin`・`files`・`publishConfig` を正しく設定し、`npm publish` で `dist/` と `templates/` のみが配布物として含まれる状態を保つ.

#### Scenario: グローバルインストール後のコマンド実行

- GIVEN `npm install -g @mspec/cli` が完了している
- WHEN ターミナルで `mspec --version` を実行する
- THEN バージョン番号が表示され、終了コード 0 で終了する

#### Scenario: 配布物にソースが含まれない

- GIVEN `npm pack` を実行する
- WHEN 生成された tarball の内容を確認する
- THEN `src/`・`node_modules/`・`.claude/` は含まれず、`dist/` と `templates/` のみが含まれる

### Requirement: FR-002 — npx 実行サポート

`npx @mspec/cli <command>` が実行された場合、このシステムは SHALL 対応するコマンドをインストールなしで実行できる状態を保つ.

#### Scenario: npx で init を実行

- GIVEN mspec がグローバルインストールされていない環境
- WHEN `npx @mspec/cli init` を実行する
- THEN `init` コマンドが実行され、プロジェクトに mspec が初期化される

### Requirement: FR-003 — ベータバージョンでの npm tag 管理

npm publish を実行する場合、このシステムは SHALL バージョン `0.1.0`（semver pre-release）を `--tag beta` で公開し、`latest` タグを更新しない.

#### Scenario: beta tag でのインストール

- GIVEN `@mspec/cli` が `beta` タグで公開されている
- WHEN `npm install -g @mspec/cli@beta` を実行する
- THEN beta バージョンがインストールされ、`mspec` コマンドが使用可能になる

#### Scenario: latest tag が汚染されない

- GIVEN `@mspec/cli@0.1.0` が `--tag beta` で公開されている
- WHEN `npm install -g @mspec/cli` を実行する（tag 指定なし）
- THEN `latest` タグが存在しないためインストールされないか、以前の `latest` バージョンがインストールされる

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
