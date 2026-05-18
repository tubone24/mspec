<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# cli-upgrade Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — upgrade サブコマンドの提供
このシステムは SHALL `mspec upgrade` サブコマンドを提供し、ユーザーが CLI から直接アップグレードを実行できるようにする.

#### Scenario: upgrade コマンドが認識される
- GIVEN mspec CLI がインストールされている
- WHEN ユーザーが `mspec upgrade` を実行する
- THEN コマンドが認識され、バージョン確認フローが開始される

### Requirement: FR-002 — 現在バージョンと最新バージョンの表示
`mspec upgrade` を実行したとき、このシステムは SHALL 現在インストール済みバージョンと npm registry 上の最新バージョンを並べて表示する.

#### Scenario: バージョン情報が表示される
- GIVEN mspec がインストールされており、ネットワークが利用可能である
- WHEN ユーザーが `mspec upgrade` を実行する
- THEN 「現在のバージョン: x.y.z」「最新バージョン: a.b.c」の形式で両バージョンが表示される

### Requirement: FR-003 — アップグレードの実行
最新バージョンが現在バージョンより新しい場合、このシステムは SHALL ユーザーに確認を求めた後、`npm install -g @mspec/cli@latest` を実行してアップグレードを完了させる.

#### Scenario: 新しいバージョンが存在する場合にアップグレードが実行される
- GIVEN 現在バージョンより新しいバージョンが npm registry に存在する
- WHEN ユーザーが `mspec upgrade` を実行し確認プロンプトに同意する
- THEN npm install コマンドが実行され、アップグレード完了メッセージが表示される

### Requirement: FR-004 — 既に最新版の場合のメッセージ
現在インストール済みバージョンが最新バージョンと同一の場合、このシステムは SHALL アップグレードを実行せずに「already up-to-date」旨のメッセージを表示して正常終了する.

#### Scenario: 最新バージョンがインストール済みの場合
- GIVEN 現在インストールされているバージョンが npm registry の最新バージョンと同一である
- WHEN ユーザーが `mspec upgrade` を実行する
- THEN アップグレードは実行されず「すでに最新バージョンです」というメッセージが表示されて終了する

