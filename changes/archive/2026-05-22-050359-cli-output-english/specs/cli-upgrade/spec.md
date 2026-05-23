# Delta Spec: cli-upgrade

## ADDED Requirements

<!-- なし -->

## MODIFIED Requirements

### Requirement: FR-002 — 現在バージョンと最新バージョンの表示
`mspec upgrade` を実行したとき、このシステムは SHALL 現在インストール済みバージョンと npm registry 上の最新バージョンを英語ラベルで並べて表示する.

#### Scenario: バージョン情報が英語で表示される
- GIVEN mspec がインストールされており、ネットワークが利用可能である
- WHEN ユーザーが `mspec upgrade` を実行する
- THEN `"Current version: x.y.z"` `"Latest version:  a.b.c"` の形式で両バージョンが英語ラベルで表示される

### Requirement: FR-004 — 既に最新版の場合のメッセージ
現在インストール済みバージョンが最新バージョンと同一の場合、このシステムは SHALL アップグレードを実行せずに英語で already up-to-date 旨のメッセージを表示して正常終了する.

#### Scenario: 最新バージョンがインストール済みの場合
- GIVEN 現在インストールされているバージョンが npm registry の最新バージョンと同一である
- WHEN ユーザーが `mspec upgrade` を実行する
- THEN アップグレードは実行されず `"Already up to date (x.y.z)"` というメッセージが英語で表示されて終了する

## REMOVED Requirements

<!-- なし -->

## RENAMED Requirements

<!-- なし -->
