# Delta Spec: cli-archive

## ADDED Requirements

### Requirement: FR-013 — archive 成功後に決定論的なマージサマリを出力する
システムは `mspec archive` が成功した後、影響を受けた capability ごとに「追加 / 変更 / 削除 / リネーム」された Requirement 件数を 1 行でまとめたサマリ報告を出力 MUST。これによりオペレータがマージ結果を Source-of-Truth スペック本体を覗かずに監査できる。

#### Scenario: サマリ行に capability ごとの件数が並ぶ
- GIVEN Delta Spec が capability `cli-anchor` に対し Requirement 2 件を追加・1 件を変更し、capability `cli-archive` に対し Requirement 1 件を追加する change ディレクトリが存在する
- WHEN ユーザーが `mspec archive <change-name> -y` を実行する
- THEN コマンドは同一報告内に `cli-anchor: +2 ~1 -0 ⇄0` と `cli-archive: +1 ~0 -0 ⇄0` の両方を含むサマリを表示する

#### Scenario: 再実行でサマリがバイト一致する
- GIVEN archive 前の状態スナップショットに対し、同一の archive 操作を再実行する
- WHEN ユーザーが (実行間にワーキングツリーをリセットして) `mspec archive <change-name> -y` を 2 回実行する
- THEN 2 回の実行は同一のサマリ出力をバイト一致で出力する

### Requirement: FR-014 — `--dry-run` ではサマリを抑制する
システムは `--dry-run` 実行時にはマージサマリ行を出力せず、その代わりにプランニング出力であることを明示するプレビューヘッダで置き換える MUST。これによりオペレータが dry-run 結果を完了済み archive と見間違わない。

#### Scenario: dry-run 出力はラベル付きで成功サマリを持たない
- GIVEN archive 可能な状態の change ディレクトリ
- WHEN ユーザーが `mspec archive <change-name> --dry-run` を実行する
- THEN 出力は `dry-run` を含むプレビューヘッダで始まり、FR-013 で規定されたマージサマリ行を含まない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
