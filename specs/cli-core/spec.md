<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# cli-core Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — CLI output messages SHALL use colon format for next-step command references

When the CLI emits a "next step" guidance message (e.g. after `mspec new`, `mspec continue`, or any other subcommand), the system SHALL render the recommended slash command in colon-separated format (`/mspec:<step>`). Hyphen-separated forms (e.g. `next: run /mspec-proposal`) MUST NOT appear in any CLI output, template file, or source-code string literal.

#### Scenario: mspec new コマンド実行後のメッセージがコロン形式
- GIVEN ユーザーが `mspec new <feature>` を実行する
- WHEN CLIが成功メッセージを出力する
- THEN 出力に含まれる次ステップ案内は `/mspec:proposal` 等のコロン形式である
- AND `next: run /mspec-proposal` 等のハイフン形式の文字列は出力されない

#### Scenario: テンプレートファイルにハイフン形式が存在しない
- GIVEN `packages/cli/templates/` 配下の全ファイルが修正済みである
- WHEN `grep -r "mspec-" packages/cli/templates/` を実行する
- THEN ハイフン形式のコマンド参照が 0 件である

### Requirement: FR-002 — Documentation files SHALL use colon format for all mspec command references

The system SHALL ensure that all documentation files (`README.md`, `docs/**/*.md`) reference mspec slash commands exclusively in colon-separated format (`/mspec:<step>`). Hyphen-separated command names MUST NOT appear in documentation.

#### Scenario: README.md のコマンド例がコロン形式
- GIVEN `README.md` にワークフローの使い方が記載されている
- WHEN ドキュメント内のコマンド例を確認する
- THEN すべての mspec コマンド参照が `/mspec:new`・`/mspec:continue` 等のコロン形式である

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


