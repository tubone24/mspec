# Delta Spec: artifact-preview

## Security Capabilities

権限境界: verify:cmd の実行は localhost API 経由のみ許可し、外部ネットワークへのコマンド転送は行わない
ロールバック手段: 実行ボタンはべき等 — 何度実行しても元の checklist.md ファイルを変更しない

## ADDED Requirements

### Requirement: FR-014 — verify:cmd アノテーション付き項目のインライン実行と結果表示

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`verify: cmd:<command>` アノテーションを持つ checklist.md 項目を表示しているとき、このシステムは SHALL 各項目の隣に実行ボタンを表示する.

実行ボタンがクリックされたとき、このシステムは SHALL アノテーションに指定されたコマンドを実行し、終了コード・stdout・stderr をその項目のインライン領域に表示する.

コマンドの実行中、このシステムは SHALL 実行ボタンを無効化してローディング状態を示す.

#### Scenario: verify:cmd 項目に実行ボタンが表示される
- GIVEN checklist.md に `- [ ] FR-006 検証 <!-- verify: cmd:mspec anchor check -->` という行が存在する
- WHEN ユーザーが当該 checklist.md のプレビュー画面を開く
- THEN その項目の隣に「実行」ボタンが表示される

#### Scenario: 実行ボタンクリックでコマンド結果がインラインに表示される
- GIVEN `verify: cmd:mspec validate --change foo` アノテーションを持つ項目の「実行」ボタンが表示されている
- WHEN ユーザーが「実行」ボタンをクリックする
- THEN コマンドの終了コード・stdout・stderr が当該項目の直下にインライン表示される

#### Scenario: コマンド実行中はボタンが無効化される
- GIVEN 実行ボタンがクリックされてコマンドが実行中である
- WHEN コマンドがまだ完了していない
- THEN 実行ボタンは disabled 状態かつローディングインジケータが表示される

#### Scenario: verify:fr アノテーションのみの項目には実行ボタンが表示されない
- GIVEN checklist.md に `- [ ] FR-001 確認 <!-- verify: fr-001 -->` という行が存在する（verify:cmd なし）
- WHEN ユーザーが当該 checklist.md のプレビュー画面を開く
- THEN その項目には実行ボタンが表示されない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
