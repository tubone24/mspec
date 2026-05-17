<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-002 -->
<!-- Change: fix-command-name-consistency -->

<!-- mspec: gaps in FR numbering are intentional. -->

# cli-init Specification

## Purpose

`mspec init` capability は、mspec を未導入のプロジェクトに対し、Spec-Driven Development を開始するために必要な最小一式 (`.mspec/` 設定ディレクトリ、`memory/constitution.md` の雛形、`.gitignore` への cache 行追記、ならびに任意で `.claude/` 統合資産) を冪等かつ安全に配置する責務を負う。実行後、ユーザーはこのコマンドが返す案内に従って次の `mspec new <feature>` ステップへ進める状態となる。

## Requirements

### Requirement: FR-001 — Generate `.mspec/` configuration files

The system MUST create `.mspec/config.yaml` and `.mspec/workflow.yaml` under the project root when `mspec init` is invoked in a project that does not yet contain these files.

#### Scenario: Fresh project initialization
- GIVEN プロジェクトルートに `.mspec/` ディレクトリが存在しない
- WHEN ユーザーが `mspec init` を実行する
- THEN `.mspec/config.yaml` と `.mspec/workflow.yaml` が新規作成される
- AND コマンドは終了コード 0 で完了する

### Requirement: FR-002 — Generate empty `memory/constitution.md`

The system MUST create `memory/constitution.md` as an empty template (Core Principles / Additional Constraints / Development Workflow & Governance の節を持つ雛形) when `mspec init` runs and the file does not already exist.

#### Scenario: Constitution scaffold is created
- GIVEN プロジェクトルートに `memory/constitution.md` が存在しない
- WHEN ユーザーが `mspec init` を実行する
- THEN `memory/constitution.md` が雛形内容で作成される
- AND ファイルには `## Core Principles` 節の見出しが含まれる

### Requirement: FR-003 — Prompt for `test.command` interactively

The system MUST interactively ask the user for the project's test execution command during `mspec init` and persist the answer as `test.command` in `.mspec/config.yaml`.

#### Scenario: User provides test command
- GIVEN `mspec init` が起動中で、対話プロンプトが表示されている
- WHEN ユーザーが `npm test --` と入力する
- THEN 生成された `.mspec/config.yaml` の `test.command` フィールドに `npm test --` が記録される

#### Scenario: User skips test command prompt
- GIVEN `mspec init` が test.command 入力を求めている
- WHEN ユーザーが入力を空のまま確定する
- THEN `.mspec/config.yaml` の `test.command` は空文字で生成される
- AND `mspec init` 自体は終了コード 0 で完了する

### Requirement: FR-004 — Append cache directory to `.gitignore`

The system MUST append `.mspec/cache/` to the project's `.gitignore` if that entry is not already present.

#### Scenario: Add cache entry to existing .gitignore
- GIVEN プロジェクトに `.gitignore` が存在し、`.mspec/cache/` 行が含まれていない
- WHEN ユーザーが `mspec init` を実行する
- THEN `.gitignore` 末尾に `.mspec/cache/` 行が追記される

#### Scenario: Skip when entry already exists
- GIVEN プロジェクトの `.gitignore` に既に `.mspec/cache/` 行が含まれている
- WHEN ユーザーが `mspec init` を実行する
- THEN `.gitignore` に新たな `.mspec/cache/` 行は追記されない

#### Scenario: Create .gitignore when missing
- GIVEN プロジェクトに `.gitignore` が存在しない
- WHEN ユーザーが `mspec init` を実行する
- THEN `.gitignore` が新規作成され、`.mspec/cache/` 行を含む

### Requirement: FR-005 — Abort on pre-existing artifacts without `--force`

The system MUST abort with a non-zero exit code when `mspec init` would overwrite any existing mspec artifact (`.mspec/config.yaml`, `.mspec/workflow.yaml`, `memory/constitution.md`) and the `--force` flag is not given.

#### Scenario: Existing config halts init
- GIVEN プロジェクトに既に `.mspec/config.yaml` が存在する
- WHEN ユーザーが `mspec init` を `--force` なしで実行する
- THEN コマンドは非ゼロの終了コードで中断する
- AND 既存のファイルは変更されない

### Requirement: FR-006 — `--force` overwrites existing artifacts

The system MUST overwrite existing mspec artifacts when `mspec init --force` is invoked.

#### Scenario: Force re-init
- GIVEN プロジェクトに既に `.mspec/config.yaml` と `memory/constitution.md` が存在する
- WHEN ユーザーが `mspec init --force` を実行する
- THEN それぞれのファイルが新しい雛形内容で再生成される
- AND コマンドは終了コード 0 で完了する

### Requirement: FR-007 — Place Claude Code integration assets

The system MUST place `.claude/skills/mspec-*/SKILL.md` files and `.claude/commands/mspec/*.md` files when `mspec init --tools claude` is invoked.

#### Scenario: Claude integration is installed
- GIVEN プロジェクトに `.claude/` ディレクトリが存在しない
- WHEN ユーザーが `mspec init --tools claude` を実行する
- THEN `.claude/skills/` 配下に `mspec-*` スキルが配置される
- AND `.claude/commands/mspec/` 配下にスラッシュコマンド MD が配置される

### Requirement: FR-008 — Place sub-agents by default and suppress with `--no-subagents`

The system MUST place `.claude/agents/mspec-*.md` files when Claude integration is enabled, unless the `--no-subagents` flag is given, in which case the system MUST NOT place those agent files.

#### Scenario: Sub-agents are placed by default
- GIVEN プロジェクトに `.claude/agents/` 配下に mspec エージェントが存在しない
- WHEN ユーザーが `mspec init --tools claude` を実行する
- THEN `.claude/agents/mspec-*.md` ファイル群が配置される

#### Scenario: Sub-agents are suppressed
- GIVEN プロジェクトに `.claude/agents/` 配下に mspec エージェントが存在しない
- WHEN ユーザーが `mspec init --tools claude --no-subagents` を実行する
- THEN `.claude/agents/mspec-*.md` は配置されない

### Requirement: FR-009 — Reflect sub-agent selection in `config.yaml`

The system MUST write `integrations.claude.subagents: false` into `.mspec/config.yaml` when `--no-subagents` is given, and `true` otherwise (when Claude integration is enabled).

#### Scenario: Sub-agents flag persisted as false
- GIVEN ユーザーが `mspec init --tools claude --no-subagents` を実行した
- WHEN 生成された `.mspec/config.yaml` を読み込む
- THEN `integrations.claude.subagents` の値は `false` である

#### Scenario: Sub-agents flag persisted as true
- GIVEN ユーザーが `mspec init --tools claude` を `--no-subagents` なしで実行した
- WHEN 生成された `.mspec/config.yaml` を読み込む
- THEN `integrations.claude.subagents` の値は `true` である

### Requirement: FR-010 — Emit next-step guidance on success

The system MUST emit a `next: run /mspec:new <feature>` style instruction to the user when `mspec init` completes successfully.

#### Scenario: Success message guides user
- GIVEN `mspec init` が成功条件をすべて満たして完了する直前
- WHEN コマンドが終了する
- THEN 標準出力に次に実行すべきコマンドとして `/mspec:new` を含む案内が表示される
- AND 終了コードは 0 である

### Requirement: FR-011 — `config.yaml` carries declared schema version

The system MUST write `version: 1` as the top-level field of the generated `.mspec/config.yaml`, alongside the `test`, `project`, and `integrations` sections.

#### Scenario: Config schema is well-formed
- GIVEN `mspec init` が正常に完了した
- WHEN 生成された `.mspec/config.yaml` を読み込む
- THEN ファイルは `version: 1` を含む
- AND `test`, `project`, `integrations` の各セクションが存在する
