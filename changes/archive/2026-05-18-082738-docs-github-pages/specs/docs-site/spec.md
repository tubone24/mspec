# Delta Spec: docs-site

## ADDED Requirements

### Requirement: FR-001 — Markdown ドキュメントの静的サイト公開

このシステムは SHALL `docs/` 配下の既存マークダウンファイルを、本文の追加加筆なく静的ウェブサイトとして公開できる。

#### Scenario: docs/ 配下の全ファイルがサイトに反映される
- GIVEN `docs/` 配下に tutorials / how-to / explanation / reference の各ディレクトリおよびマークダウンファイルが存在する
- WHEN 静的サイトジェネレータ（SSG）でビルドを実行する
- THEN 全マークダウンファイルが対応する HTML ページとして出力される

---

### Requirement: FR-002 — main ブランチ push による自動デプロイ

main ブランチへの push のとき、このシステムは SHALL GitHub Actions ワークフローが自動でビルドを実行し、GitHub Pages へデプロイする。

#### Scenario: main への push でサイトが更新される
- GIVEN GitHub Actions ワークフローが `main` ブランチへの push イベントで設定されている
- WHEN 開発者が main ブランチへ push する
- THEN GitHub Actions がビルドを実行し、`gh-pages` ブランチまたは GitHub Pages の設定先へ成果物をデプロイする

---

### Requirement: FR-003 — サイト内検索と Diátaxis ナビゲーション

このシステムは SHALL サイト内全文検索機能と、tutorials / how-to / explanation / reference の 4 カテゴリによる Diátaxis ナビゲーションを公開サイトに備える。

#### Scenario: ユーザーがキーワードで検索できる
- GIVEN 公開サイトが表示されている
- WHEN ユーザーが検索ボックスにキーワードを入力する
- THEN 該当する docs ページの検索結果が表示される

#### Scenario: Diátaxis 4 カテゴリのナビゲーションが機能する
- GIVEN 公開サイトのナビゲーションに tutorials / how-to / explanation / reference の各セクションが存在する
- WHEN ユーザーがいずれかのカテゴリリンクをクリックする
- THEN 対応するカテゴリ配下のページ一覧またはインデックスページへ遷移する

---

### Requirement: FR-004 — ローカルプレビューコマンド

このシステムは SHALL 開発者がローカル環境でサイトをプレビューできるコマンドを SSG 標準機能として提供する。

#### Scenario: ローカルでサイトをプレビューできる
- GIVEN 開発者がリポジトリをクローンし、依存パッケージをインストールしている
- WHEN ドキュメントに記載されたプレビューコマンドを実行する
- THEN ローカルサーバーが起動し、ブラウザで公開サイトと同等の内容を確認できる

---

### Requirement: FR-005 — 既存リンク構造の維持

このシステムは SHALL `docs/` 配下の相対パスリンクおよび `docs/images/` への画像参照が、公開サイトでも壊れない状態を維持する。

#### Scenario: 相対パスリンクが公開サイトで正常に機能する
- GIVEN `docs/` 配下のマークダウンファイルに相対パスの内部リンクが含まれている
- WHEN SSG がビルドを実行する
- THEN 生成された HTML 内のリンクが正しい公開 URL に変換され、リンク切れが発生しない

#### Scenario: 画像参照が公開サイトで表示される
- GIVEN マークダウンに `docs/images/` 配下の画像への参照が含まれている
- WHEN 公開サイトのページをブラウザで開く
- THEN 画像が正しく表示され、404 エラーが発生しない

---

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
