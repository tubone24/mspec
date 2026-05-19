# Delta Spec: cli-distribution

## ADDED Requirements

## MODIFIED Requirements

### Requirement: FR-003 — ベータバージョンでの npm tag 管理

npm publish を実行する場合、このシステムは SHALL バージョン `1.0.0` 未満（`0.x.y` の初期開発フェーズ）を `--tag beta` で公開し、`latest` タグを更新しない.

#### Scenario: beta tag でのインストール

- GIVEN `@mspec/cli` が `beta` タグで公開されている
- WHEN `npm install -g @mspec/cli@beta` を実行する
- THEN beta バージョンがインストールされ、`mspec` コマンドが使用可能になる

#### Scenario: latest tag が汚染されない

- GIVEN `@mspec/cli@0.1.1` が `--tag beta` で公開されている
- WHEN `npm install -g @mspec/cli` を実行する（tag 指定なし）
- THEN `latest` タグが存在しないためインストールされないか、以前の `latest` バージョンがインストールされる

#### Scenario: パッチバージョン更新の継続的公開

- GIVEN `@mspec/cli@0.1.0` が `beta` タグで公開済みである
- WHEN 後続バージョン `0.1.1` を `npm publish --tag beta` で公開する
- THEN 新しい beta バージョンが追加され、`latest` タグは更新されない

## REMOVED Requirements

## RENAMED Requirements
