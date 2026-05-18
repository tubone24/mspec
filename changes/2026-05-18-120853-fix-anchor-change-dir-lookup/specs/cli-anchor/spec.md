# Delta Spec: cli-anchor

## ADDED Requirements

### Requirement: FR-018 — JS/TS文字列リテラル内のアンカー出現をスキャン対象外にする

JS/TSファイルをスキャンする際、このシステムは SHALL テンプレートリテラル・シングルクォート・ダブルクォートの文字列リテラル内部に出現する `@mspec-delta` をアンカーブロックとして認識しない。

#### Scenario: テストファイル内のテストデータアンカーを無視する

- GIVEN `anchor.test.ts` がテストデータとしてテンプレートリテラル内に `@mspec-delta` アンカーブロックを含んでいる
- WHEN `mspec anchor-check` を実行する
- THEN そのテンプレートリテラル由来のアンカーはスキャン結果に含まれず、`change_dir not found` エラーは報告されない

#### Scenario: テストファイル先頭の実アンカーは引き続きスキャンされる

- GIVEN `archive.test.ts` がファイル先頭の行コメント（`// @mspec-delta ...`）として実アンカーを持っている
- WHEN `mspec anchor-check` を実行する
- THEN その行コメントのアンカーは正常に認識され、検証の対象となる

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
