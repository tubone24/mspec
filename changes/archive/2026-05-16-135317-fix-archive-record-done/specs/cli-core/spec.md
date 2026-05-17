# Delta Spec: cli-core

## ADDED Requirements

### Requirement: FR-003 — archive コマンドの done-log 記録

When the `mspec archive` command successfully renames the change directory from `changes/<name>` to `changes/archive/<name>`, the system SHALL call `recordDone(paths, change.name, 'archive')` immediately after the rename completes.

If the rename operation fails, the system MUST NOT call `recordDone`.

If `recordDone` throws an exception, the system SHALL propagate the error to the caller without silently swallowing it.

#### Scenario: 正常アーカイブ後の done-log 記録

- GIVEN `changes/2026-05-16-fix-archive-record-done` ディレクトリが存在し、`mspec archive` を実行する
- WHEN `rename()` が成功して `changes/archive/2026-05-16-fix-archive-record-done` への移動が完了する
- THEN `recordDone(paths, change.name, 'archive')` が呼び出され、done-log に archive ステップが記録される

#### Scenario: rename 失敗時の recordDone 未呼び出し

- GIVEN `changes/2026-05-16-fix-archive-record-done` ディレクトリが存在し、`mspec archive` を実行する
- WHEN `rename()` がエラーを投げて失敗する
- THEN `recordDone` は呼び出されず、done-log は変更されない

#### Scenario: recordDone 例外のエラー伝播

- GIVEN `rename()` が成功した後、`recordDone` が例外を投げる
- WHEN `archive` コマンドが `recordDone` を `await` で呼び出す
- THEN 例外はサイレントに無視されず、呼び出し元に伝播してコマンドが非ゼロ終了コードで終了する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
