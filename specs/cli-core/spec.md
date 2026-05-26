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

### Requirement: FR-004 — `mspec mock` サブコマンド

`mspec mock` コマンドが実行されたとき、このシステムは SHALL visual mock の生成・ローカルサーバー起動・フィードバック収集をシーケンシャルに実行する。

#### Scenario: `mspec mock` の正常実行

- GIVEN active change が存在し proposal.md が生成済みである
- WHEN ユーザーが `mspec mock --change <change>` を実行する
- THEN HTML/CSS/JS ファイルの生成 → ローカルサーバー起動 → URL 表示 → フィードバック収集の順に処理が進む

#### Scenario: active change が存在しない場合のエラー

- GIVEN `changes/` に active な change が存在しない
- WHEN ユーザーが `mspec mock` を実行する
- THEN エラーメッセージ `no active change found` が表示されコマンドは非ゼロ終了コードで終了する

### Requirement: FR-005 — mspec verify --llm コマンド

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL `mspec verify --llm` コマンドを提供し、FR-IDごとの評価プロンプトと検証チェック項目をJSON形式で stdout に出力する。

#### Scenario: LLM評価プロンプトのJSON出力
- GIVEN change ディレクトリに specs/*/spec.md と design.md が存在する
- WHEN `mspec verify --llm --change <change>` を実行する
- THEN `{ "fr_checks": [{ "fr_id": "FR-NNN", "title": "...", "prompt": "...", "acceptance_criteria": [...] }] }` 形式のJSONが stdout に出力される

#### Scenario: --json フラグによる machine-readable 出力
- GIVEN `mspec verify --llm --json --change <change>` が実行される
- WHEN コマンドが実行される
- THEN JSON形式で同一の内容が出力される（--llm と --json を組み合わせ可能）

#### Scenario: specs/*/spec.md が存在しない場合
- GIVEN change ディレクトリに specs/*/spec.md が存在しない
- WHEN `mspec verify --llm --change <change>` を実行する
- THEN エラーメッセージを stderr に出力して exit code 1 で終了する

### Requirement: FR-006 — mspec learn コマンド

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL `mspec learn` コマンドを提供し、archive済みchangesから修正パターンを抽出してpost-condition候補をJSON形式で stdout に出力する。

#### Scenario: self-review blockerからのパターン抽出
- GIVEN `changes/archive/` 配下の change に `.agent-runs.jsonl` が存在し edits > 0 のエントリがある
- WHEN `mspec learn` を実行する
- THEN `{ patterns: [{ type: "review-blocker", change: "...", step: "...", edits: N }] }` 形式のJSONが出力される

#### Scenario: verify:human 未チェック項目からのパターン抽出
- GIVEN archive済みchangeの `checklist.md` に `<!-- verify: human -->` が付いた `- [ ]` 行が存在する
- WHEN `mspec learn` を実行する
- THEN `{ patterns: [{ type: "unchecked-human-verify", change: "...", items: [...] }] }` 形式のJSONに含まれる

#### Scenario: archiveが空の場合のgraceful handling
- GIVEN `changes/archive/` が存在しないまたは空である
- WHEN `mspec learn` を実行する
- THEN `{ patterns: [] }` を出力して exit code 0 で終了する





