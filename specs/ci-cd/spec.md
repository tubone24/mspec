<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# ci-cd Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — git tag トリガーによる自動 npm publish

`v*` パターンの git tag がリモートにプッシュされた場合、このシステムは SHALL GitHub Actions ワークフローを起動し、ビルド・テストを通過後に npm registry へ自動 publish する.

#### Scenario: バージョンタグのプッシュで自動リリース

- GIVEN GitHub Secrets に `NPM_TOKEN` が設定されている
- WHEN `git tag v0.1.0 && git push --tags` を実行する
- THEN GitHub Actions が起動し、ビルド・テスト後に `@mspec/cli@0.1.0 --tag beta` が npm に公開される

#### Scenario: タグなしプッシュでは publish しない

- GIVEN 通常の `git push origin main` を実行する
- WHEN GitHub Actions が起動する
- THEN npm publish は実行されず、CI チェック（ビルド・テスト）のみ実行される

### Requirement: FR-002 — publish 前の CI ゲート

npm publish を実行する場合、このシステムは SHALL `npm run build` および `npm test` が成功した後にのみ publish ステップを実行し、いずれかが失敗した場合は publish を中断する.

#### Scenario: テスト失敗時の publish 中断

- GIVEN テストが 1 件以上失敗する状態でタグをプッシュする
- WHEN GitHub Actions の `test` ステップが実行される
- THEN ワークフローがエラーで終了し、npm publish は実行されない

#### Scenario: ビルド・テスト通過後の publish 実行

- GIVEN 全テストが通過し、ビルドが成功する状態でタグをプッシュする
- WHEN GitHub Actions の全ステップが順に実行される
- THEN npm publish が実行され、成功ログが残る

### Requirement: FR-003 — GitHub Release トリガーによる publish

GitHub Release が作成された場合、このシステムは SHALL git tag トリガーと同様に npm publish ワークフローを起動できる.

#### Scenario: GitHub Release からの publish

- GIVEN GitHub UI または `gh release create` コマンドで Release を作成する
- WHEN `release: released` イベントが発火する
- THEN GitHub Actions が起動し、ビルド・テスト後に npm publish が実行される

