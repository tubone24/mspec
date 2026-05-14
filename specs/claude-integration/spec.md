<!-- mspec: gaps in FR numbering are intentional. -->

# claude-integration Specification

## Purpose

`claude-integration` capability は、mspec ワークフローを Claude Code から駆動するための統合資産 (スラッシュコマンド / Skill / Subagent) の構造と、ワークフロー実行時に Claude が従うべき手順 (SKILL.md 共通骨子・subagent 起動 protocol・主体ごとの役割分担) を規定する。v0 では Claude Code のみを公式サポート対象 AI ツールとし、Codex / GitHub Copilot 等は将来バージョンの担当範囲とする。本 capability は、配置物 (Skill / Command / Agent ファイル群) が満たすべき仕様と、Claude (skill) / subagent / mspec CLI の役割境界、ならびに `mspec continue` から受け取る指示に基づく subagent 呼び出し規約を扱う。`mspec init` コマンド自体の引数処理や冪等性は `cli-init` capability の責務である。

## Requirements

### Requirement: FR-001 — Slash commands under `.claude/commands/mspec/`

The system MUST provide a slash-command Markdown file under `.claude/commands/mspec/` for each mspec workflow step (e.g. `new`, `proposal`, `delta`, `research`, `design`, `quickstart`, `checklist`, `review`, `tasks`, `implement`, `archive`) and for the workflow driver `continue`, so that the user can invoke any step from Claude Code as `/mspec-<step>`.

#### Scenario: Step commands are available in Claude Code
- GIVEN `mspec init --tools claude` がプロジェクトに対して実行済みである
- WHEN Claude Code セッションで `/` を入力してコマンド一覧を確認する
- THEN `/mspec-new`, `/mspec-proposal`, `/mspec-continue` を含む各 step に対応するスラッシュコマンドが利用可能である
- AND 各コマンドは `.claude/commands/mspec/<step>.md` というパスにファイルとして存在する

### Requirement: FR-002 — One SKILL.md per workflow step

The system MUST provide a Skill at `.claude/skills/mspec-<step>/SKILL.md` for each mspec workflow step, and each SKILL.md MUST contain a YAML frontmatter (with `name`, `description`, `when_to_use` keys) followed by a `## Procedure` section that describes the step-specific behavior.

#### Scenario: SKILL.md は frontmatter と Procedure を持つ
- GIVEN `mspec init --tools claude` 実行後のプロジェクト
- WHEN `.claude/skills/mspec-proposal/SKILL.md` を開く
- THEN 先頭に `---` で囲まれた YAML frontmatter があり、`name: mspec-proposal` と `when_to_use` フィールドを含む
- AND ファイル本文に `## Procedure` という H2 見出しが存在する

### Requirement: FR-003 — SKILL.md procedure starts with `mspec status --json`

The system MUST define every SKILL.md `Procedure` so that the first executable step is `mspec status --change <name> --json`, before any artifact is read or written.

#### Scenario: Procedure starts by reading status
- GIVEN 任意の `.claude/skills/mspec-<step>/SKILL.md` を開く
- WHEN `## Procedure` 節の番号付きリスト 1 番目を読む
- THEN そのステップは `mspec status --change <name> --json` の実行を指示している
- AND この status 実行は、`requires` アーティファクトの読み込みより前に位置する

### Requirement: FR-004 — Subagent files under `.claude/agents/`

The system MUST provide subagent definitions as `.claude/agents/mspec-<role>.md` files for each role that requires an isolated context window — at minimum `mspec-researcher`, `mspec-self-reviewer`, and `mspec-checklist-auditor`.

#### Scenario: Default roles are present
- GIVEN `mspec init --tools claude` が `--no-subagents` なしで実行された
- WHEN `.claude/agents/` ディレクトリの中身を確認する
- THEN `mspec-researcher.md`, `mspec-self-reviewer.md`, `mspec-checklist-auditor.md` の 3 ファイルが少なくとも存在する

### Requirement: FR-005 — Subagent assets are optional via `--no-subagents`

The system MUST allow Claude integration to be installed without subagent definitions: when the integration is enabled but the user opted out of subagents (`mspec init --tools claude --no-subagents`), the `.claude/agents/mspec-*.md` files MUST NOT be placed, while `.claude/skills/` and `.claude/commands/mspec/` assets MUST still be placed.

#### Scenario: Skills and commands placed without agents
- GIVEN プロジェクトに `.claude/` 配下の mspec 資産が存在しない
- WHEN ユーザーが `mspec init --tools claude --no-subagents` を実行する
- THEN `.claude/skills/mspec-*/SKILL.md` と `.claude/commands/mspec/*.md` が配置される
- AND `.claude/agents/` 配下には `mspec-*.md` ファイルが一つも配置されない

### Requirement: FR-006 — Role boundary between Claude, subagent, and CLI

The system MUST clearly assign responsibilities so that (a) the main Claude skill performs text generation and user dialogue, (b) `.claude/agents/mspec-*.md` subagents perform context-isolated tasks (research, self-review, checklist audit), and (c) the `mspec` CLI performs deterministic operations (structural validation, archive merge, status computation, anchor verification). Each SKILL.md MUST delegate accordingly rather than re-implementing CLI logic inline.

#### Scenario: Skill delegates validation to CLI
- GIVEN `.claude/skills/mspec-design/SKILL.md` を開く
- WHEN `## Procedure` 節を読む
- THEN 構造的な妥当性検証ステップは `mspec validate --change <name>` の実行として記述されている
- AND Skill 本文には Markdown 構造検査ロジックの再実装が含まれない

#### Scenario: Research is delegated to subagent
- GIVEN `.claude/skills/mspec-research/SKILL.md` を開く (subagents 有効)
- WHEN Procedure を読む
- THEN リサーチ作業は Task ツール経由で `mspec-researcher` subagent に委譲される手順が記述されている
- AND メインスキル自身は調査結果のテキスト生成のみを行う

### Requirement: FR-007 — Subagent launch protocol via `mspec continue`

The system MUST treat `subagent_prompt` and `subagent_name` fields in the `mspec continue` JSON output as the source of truth for subagent invocation: when those fields are present (i.e. the step has `subagent: true`), the main Skill MUST launch a subagent using the Task tool, passing `subagent_name` as the target agent identifier and `subagent_prompt` as the prompt body.

#### Scenario: Main skill launches subagent based on continue output
- GIVEN `mspec continue --change <name>` の JSON 出力が `subagent_name: "mspec-researcher"` と `subagent_prompt: "<研究指示>"` を含んで返ってきた
- WHEN メインの Claude スキルがその出力を受け取る
- THEN メインスキルは Claude Code の Task ツールを用いて `mspec-researcher` subagent を起動する
- AND Task ツールに渡されるプロンプトは `subagent_prompt` フィールドの内容と一致する

#### Scenario: No subagent fields means inline execution
- GIVEN `mspec continue --change <name>` の JSON 出力に `subagent_prompt` / `subagent_name` フィールドが存在しない (該当 step が `subagent: false`)
- WHEN メインの Claude スキルがその出力を受け取る
- THEN メインスキルは subagent を起動せず、そのまま自身の文脈で step を実行する

### Requirement: FR-008 — Subagents disabled when user opted out

The system MUST NOT instruct the main Skill to launch a subagent when the project is configured with subagents disabled (`integrations.claude.subagents: false` in `.mspec/config.yaml`), even if a workflow step is marked `subagent: true`. In that case, the step's behavior MUST be executed inline by the main Skill.

#### Scenario: Opted-out project falls back to inline execution
- GIVEN プロジェクトの `.mspec/config.yaml` に `integrations.claude.subagents: false` が記録されている
- AND ワークフロー上 `research` step は `subagent: true` と定義されている
- WHEN ユーザーが `/mspec-continue` を実行し、research step に到達する
- THEN メインの Claude スキルは Task ツールによる subagent 起動を行わない
- AND research step の手順はメインスキル自身が実行する

### Requirement: FR-009 — v0 supports Claude Code only

The system MUST limit AI-tool integration assets in v0 to Claude Code: `mspec init` MUST accept `claude` as the only valid value for `--tools`, and MUST NOT generate integration assets for Codex, GitHub Copilot, or other AI tools in this version.

#### Scenario: Unsupported tool value is rejected
- GIVEN v0 の mspec バイナリがインストールされている
- WHEN ユーザーが `mspec init --tools codex` を実行する
- THEN コマンドは非ゼロの終了コードで失敗する
- AND エラーメッセージは v0 では Claude のみがサポート対象である旨を示す

#### Scenario: Only Claude assets are produced
- GIVEN v0 の `mspec init --tools claude` が正常に完了した
- WHEN プロジェクト直下を観察する
- THEN `.claude/` 配下にのみ mspec 統合資産が存在する
- AND Codex / Copilot 用のディレクトリ (例: `.codex/`, `.github/copilot/`) は作成されない
