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

