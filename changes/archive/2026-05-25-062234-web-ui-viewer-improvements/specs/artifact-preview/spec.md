# Delta Spec: artifact-preview

## ADDED Requirements

### Requirement: FR-009 — Markdown 見出し・書式の完全レンダリング

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL アーティファクト表示時に Markdown の見出し（H1〜H6）・太字・斜体・コードブロック・テーブル・リストを含む全書式要素を視覚的に区別できる HTML としてレンダリングする.

#### Scenario: 見出しが正しくレンダリングされる
- GIVEN design.md に `# 設計` や `## 概要` などの見出しが含まれている
- WHEN ユーザーがそのアーティファクトをビューワーで表示する
- THEN 見出しテキストがフォントサイズ・ウェイト・余白によって視覚的に階層化されて表示される

#### Scenario: コードブロックが整形されて表示される
- GIVEN spec.md にコードフェンスで囲まれたコードブロックが含まれている
- WHEN ユーザーがプレビューを開く
- THEN コードブロックが等幅フォント・背景色付きの枠内に表示される

### Requirement: FR-010 — スプリットビューレイアウト

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

アーティファクト一覧でアイテムをクリックしたとき、このシステムは SHALL ページ遷移なしに、左ペインにアーティファクト一覧を残したまま右ペインにそのアーティファクトの内容を表示するスプリットビューレイアウトに切り替える.

#### Scenario: アーティファクトクリックでスプリットビューが開く
- GIVEN チェンジのアーティファクト一覧が表示されている
- WHEN ユーザーが `design.md` の行をクリックする
- THEN 画面が左右に分割され、左にアーティファクト一覧、右に design.md のレンダリング済みコンテンツが表示される

#### Scenario: 別アーティファクトへの切り替え
- GIVEN スプリットビューで design.md が表示されている
- WHEN ユーザーが左ペインで `proposal.md` をクリックする
- THEN 右ペインの表示が proposal.md の内容に切り替わり、左ペインの一覧は変化しない

#### Scenario: スプリットビューを閉じる
- GIVEN スプリットビューが表示されている
- WHEN ユーザーが閉じるボタンを押すか、同じアーティファクトを再クリックする
- THEN 右ペインが折りたたまれ、左ペインのアーティファクト一覧が全幅表示に戻る

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
