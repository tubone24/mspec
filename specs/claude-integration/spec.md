<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-002 -->
<!-- Change: fix-command-name-consistency -->

<!-- mspec: gaps in FR numbering are intentional. -->

# claude-integration Specification

## Purpose

`claude-integration` capability は、mspec ワークフローを Claude Code から駆動するための統合資産 (スラッシュコマンド / Skill / Subagent) の構造と、ワークフロー実行時に Claude が従うべき手順 (SKILL.md 共通骨子・subagent 起動 protocol・主体ごとの役割分担) を規定する。v0 では Claude Code のみを公式サポート対象 AI ツールとし、Codex / GitHub Copilot 等は将来バージョンの担当範囲とする。本 capability は、配置物 (Skill / Command / Agent ファイル群) が満たすべき仕様と、Claude (skill) / subagent / mspec CLI の役割境界、ならびに `mspec continue` から受け取る指示に基づく subagent 呼び出し規約を扱う。`mspec init` コマンド自体の引数処理や冪等性は `cli-init` capability の責務である。

## Requirements

### Requirement: FR-001 — Slash commands under `.claude/commands/mspec/`

The system MUST provide a slash-command Markdown file under `.claude/commands/mspec/` for each mspec workflow step (e.g. `new`, `proposal`, `delta`, `research`, `design`, `quickstart`, `checklist`, `review`, `tasks`, `implement`, `archive`) and for the workflow driver `continue`, so that the user can invoke any step from Claude Code as `/mspec:<step>`.

#### Scenario: Step commands are available in Claude Code
- GIVEN `mspec init --tools claude` がプロジェクトに対して実行済みである
- WHEN Claude Code セッションで `/` を入力してコマンド一覧を確認する
- THEN `/mspec:new`, `/mspec:proposal`, `/mspec:continue` を含む各 step に対応するスラッシュコマンドが利用可能である
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
- WHEN ユーザーが `/mspec:continue` を実行し、research step に到達する
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

### Requirement: FR-010 — Update mspec skill prompts to explicitly reference EARS+Scenario format and RFC 2119 keyword semantics

The system MUST update the `## Procedure` section of each mspec SKILL.md (at minimum `mspec-delta`, `mspec-proposal`, and `mspec-design`) to explicitly instruct Claude to write Requirement bodies in EARS format, applying the RFC 2119 keyword distinctions defined in the Constitution (SHALL for functional requirements, MUST for constraints and safety requirements, SHOULD for recommendations), and to nest at least one `#### Scenario:` block with GIVEN / WHEN / THEN bullets inside each Requirement.

#### Scenario: mspec-delta skill prompt references EARS format and keyword semantics
- GIVEN `.claude/skills/mspec-delta/SKILL.md` の `## Procedure` 節を開く
- WHEN 節の内容を読む
- THEN Requirement 本文を EARS 形式（SHALL / MUST / SHOULD の使い分け）で記述するよう明示した指示が含まれる
- AND Scenario（GIVEN/WHEN/THEN）を各 Requirement の直下に入れ子で必須とする旨が記述されている

#### Scenario: mspec-proposal skill prompt acknowledges EARS+Scenario convention
- GIVEN `.claude/skills/mspec-proposal/SKILL.md` の `## Procedure` 節を開く
- WHEN 節の内容を読む
- THEN Capabilities セクションへの記述を促す箇所に、後続の delta ステップで EARS+Scenario 形式が使われることを前提とした注記が含まれる

#### Scenario: mspec-design skill prompt references EARS requirement conventions
- GIVEN `.claude/skills/mspec-design/SKILL.md` の `## Procedure` 節を開く
- WHEN 節の内容を読む
- THEN design.md に記載する受け入れ基準を Delta Spec の Scenario（GIVEN/WHEN/THEN）と対応付けるよう指示する記述が含まれる

### Requirement: FR-011 — checklist-auditor annotates each item with verify metadata

When the `mspec-checklist-auditor` subagent generates `checklist.md`, the system SHALL annotate **every** checklist item with exactly one of: `<!-- verify: fr-NNN -->` when the item is automatically verifiable by the E2E tests that implement the corresponding FR, or `<!-- verify: human -->` when the item requires human judgment (e.g., Constitution compliance, design assessment, or external observation). The auditor MUST NOT leave any checklist item without a `verify:` annotation, and MUST validate after generation that all items carry exactly one annotation before declaring the step complete.

#### Scenario: AI-verifiable item receives FR reference annotation
- GIVEN `mspec-checklist-auditor` が `checklist.md` を生成している
- WHEN あるチェックリスト項目が Delta Spec の特定の FR（例: `fr-011`）の E2E シナリオによって検証可能である
- THEN その項目の末尾に `<!-- verify: fr-011 -->` というインラインコメントが付与される
- AND 1 項目に付与される `verify:` アノテーションは 1 つである

#### Scenario: Human-review item receives human annotation
- GIVEN `mspec-checklist-auditor` が `checklist.md` を生成している
- WHEN あるチェックリスト項目が Constitution 準拠・設計判断・外部観察など自動検証できない性質のものである
- THEN その項目の末尾に `<!-- verify: human -->` というインラインコメントが付与される

#### Scenario: Auditor self-validates that no item is left unannotated
- GIVEN `mspec-checklist-auditor` が `checklist.md` の全項目を書き終えた
- WHEN auditor が完了宣言の前に自己検証ステップを実行する
- THEN `checklist.md` 内に `verify:` アノテーションを持たないチェックボックス行が 0 件であることを確認する
- AND アノテーションなし行が検出された場合は、その行に適切なアノテーションを付与してから完了を宣言する

### Requirement: FR-012 — implement skill auto-checks checklist items when task reaches GREEN

When a task transitions to GREEN (all associated tests pass) during the `mspec-implement` step, the system SHALL read the task's anchor (`Requirements implemented: FR-NNN`) to resolve the corresponding FR IDs, then locate checklist items annotated with `<!-- verify: fr-NNN -->` and update them from `- [ ]` to `- [x]`.

#### Scenario: Test suite goes GREEN, corresponding checklist item is auto-checked
- GIVEN `mspec-implement` が `task-003` のテストを実行している
- WHEN `task-003` の全テストが RED から GREEN になる
- AND `task-003` のアンカーに `Requirements implemented: FR-011` が記録されている
- THEN `checklist.md` 内の `<!-- verify: fr-011 -->` が末尾に付与されているチェックボックスが `- [x]` に更新される
- AND 他の `verify:` アノテーションを持つチェックボックスは変更されない

#### Scenario: No matching verify annotation — checklist unchanged
- GIVEN `mspec-implement` が `task-005` のテストを実行している
- WHEN `task-005` が GREEN になる
- AND `task-005` のアンカーに `Requirements implemented: FR-013` が記録されている
- AND `checklist.md` に `<!-- verify: fr-013 -->` が付与された項目が存在しない
- THEN `checklist.md` は変更されない

### Requirement: FR-013 — implement step reports unchecked items after all tasks complete

When all tasks in `tasks.md` have reached GREEN and the `mspec-implement` step concludes, the system SHALL inspect `checklist.md` for remaining unchecked items and, if any exist, SHALL report them to the user grouped by annotation type: items with `<!-- verify: human -->` requiring manual verification, and any items with `<!-- verify: fr-NNN -->` that were not auto-checked (indicating a gap between tasks and checklist coverage). Where no unchecked items remain, the system SHALL declare implementation complete without an additional report.

#### Scenario: Unchecked human items reported at end of implement
- GIVEN `mspec-implement` が `tasks.md` の全タスクを GREEN にした
- WHEN `checklist.md` に `<!-- verify: human -->` の未チェック項目が 1 件以上残っている
- THEN スキルはその項目の一覧をユーザーに提示する
- AND 人間によるレビューを求めるメッセージを出力し、ユーザーの確認を待つ

#### Scenario: Unchecked fr-annotated items trigger gap warning
- GIVEN `mspec-implement` が全タスクを GREEN にした
- WHEN `checklist.md` に `<!-- verify: fr-NNN -->` の未チェック項目が残っている
- THEN スキルは対象項目と対応 FR 番号をユーザーに報告する
- AND チェックリストとタスクの `Requirements implemented` アンカー間の対応関係にギャップがある旨を説明する
- AND ユーザーの確認を待つ（警告 + ブロック）

#### Scenario: All items checked — implementation declared complete
- GIVEN `mspec-implement` が全タスクを GREEN にした
- WHEN `checklist.md` の全項目が `- [x]` にチェックされている
- THEN スキルは未チェック項目の報告を行わず、実装完了を宣言する

### Requirement: FR-014 — Runtime skill files and CLI template files are kept in sync

The system MUST update both the runtime asset files (`.claude/skills/mspec-implement/SKILL.md`, `.claude/agents/mspec-checklist-auditor.md`) and their corresponding CLI template sources (`packages/cli/templates/claude/skills/mspec-implement/SKILL.md`, `packages/cli/templates/claude/agents/mspec-checklist-auditor.md`) whenever the `verify:` annotation procedure or auto-check logic is modified, ensuring that projects installed via `mspec init` and existing projects that update manually produce identical behavior.

#### Scenario: Template and runtime skill contain identical verify procedure
- GIVEN `mspec-checklist-auditor.md` のランタイムファイルが `verify:` アノテーション手順を含む形に更新された
- WHEN `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` を確認する
- THEN 同一の `verify:` メタデータ付与手順が存在する
- AND ランタイムファイルとテンプレートファイルの内容に差異がない

### Requirement: FR-015 — Each mspec skill step updates readme.md Artifacts checkbox on completion

When a mspec skill step produces its designated artifact(s), the system SHALL immediately update the corresponding `- [ ]` entry in the `## Artifacts` section of `changes/<change-dir>/readme.md` to `- [x]`, reflecting that the artifact has been produced.

#### Scenario: Proposal step marks its artifact as done
- GIVEN `changes/2026-05-15-example/readme.md` の `## Artifacts` 節に `- [ ] proposal.md` が存在する
- WHEN `mspec-proposal` スキルが `proposal.md` の書き込みを完了する
- THEN `readme.md` の `## Artifacts` 節の該当行が `- [x] proposal.md` に更新される
- AND 他の artifact 行（例: `- [ ] design.md`）は変更されない

#### Scenario: Delta step marks its specs artifact as done
- GIVEN `readme.md` の `## Artifacts` 節に `- [ ] specs/*/spec.md` が存在する
- WHEN `mspec-delta` スキルが全 capability の `spec.md` を生成し終える
- THEN 対応する行が `- [x] specs/*/spec.md` に更新される

### Requirement: FR-016 — mspec-implement updates tasks.md task checkbox when task reaches GREEN

When a task in `tasks.md` transitions to GREEN (all associated tests pass) during the `mspec-implement` step, the system SHALL update the task's checkbox from `- [ ] TNNN` to `- [x] TNNN` in `tasks.md`, where TNNN is the task's identifier.

#### Scenario: Task goes GREEN, tasks.md checkbox is checked
- GIVEN `tasks.md` に `- [ ] T003: …` というタスク行が存在する
- WHEN `mspec-implement` が T003 に対応するテストスイートを実行し、全テストが GREEN になる
- THEN `tasks.md` の該当行が `- [x] T003: …` に更新される
- AND 他の未完了タスクのチェックボックスは変更されない

#### Scenario: Partial task completion does not mark checkbox
- GIVEN `tasks.md` に `- [ ] T004: …` というタスク行が存在する
- WHEN `mspec-implement` が T004 のテストを実行し、1 件以上のテストが FAIL のままである
- THEN `tasks.md` の T004 行は `- [ ] T004: …` のまま変更されない

### Requirement: FR-017 — Skill files SHALL reference next-step commands in colon format only

The system SHALL use only the colon-separated command format (`/mspec:<step>`) when referring to next-step slash commands inside skill prompt files (`.claude/skills/mspec-*/` and `.claude/agents/mspec-*`). Hyphen-separated references (e.g. `mspec-continue`, `mspec-proposal`) MUST NOT appear in any skill or agent file.

#### Scenario: Skill instructs user to run next step in colon format
- GIVEN `.claude/skills/mspec-proposal/SKILL.md` の手順末尾にユーザーへの指示が記載されている
- WHEN ユーザーがその指示を読む
- THEN 指示に含まれるコマンド名はすべて `/mspec:continue` 等のコロン形式である
- AND `mspec-continue` 等のハイフン形式の文字列は一切含まれない

#### Scenario: grep で残存ゼロを確認
- GIVEN 全スキル・エージェントファイルが修正済みである
- WHEN `grep -r "mspec-" .claude/` を実行する
- THEN ハイフン形式のコマンド参照がヒットしない

### Requirement: FR-018 — mspec:new skill infers mode from request text and stores it in readme.md

`/mspec:new` に渡された説明文からスキルがモード（`typo` / `minor` / `bugfix`）を AI 推定し、ユーザーに確認を取ってから `readme.md` のブロッククォート行として `> Mode: <value>` を追記する SHALL。`--mode <value>` 引数が明示指定された場合は AI 推定をスキップして直接書き込む。

#### Scenario: 説明文からモードが AI 推定され確認後に readme.md に書き込まれる

- GIVEN ユーザーが `/mspec:new コメント内の typo を修正したい` を実行した
- WHEN mspec-new スキルが説明文を解析する
- THEN スキルは「typo モードと判断しました。正しいですか？」と確認する
- AND ユーザーが承認する
- AND `readme.md` のフロントマターに `> Mode: typo` が含まれる

#### Scenario: AI 推定が誤っていた場合にユーザーが訂正できる

- GIVEN スキルが説明文から `minor` と推定した
- WHEN ユーザーが「bugfix が正しい」と訂正する
- THEN `readme.md` に `> Mode: bugfix` が書き込まれる

#### Scenario: --mode 引数で明示指定した場合は AI 推定をスキップする

- GIVEN ユーザーが `/mspec:new --mode bugfix ログ出力が欠落している問題を修正したい` を実行した
- WHEN mspec-new スキルが引数を解析する
- THEN スキルは AI 推定をスキップし、確認なしで `> Mode: bugfix` を readme.md に書き込む

#### Scenario: フルフロー対象の説明文では Mode フィールドを書き込まない

- GIVEN ユーザーが `/mspec:new 新しいダッシュボード機能を追加したい` を実行した
- WHEN スキルが説明文を解析してモードに該当しないと判断した
- THEN `readme.md` に `> Mode:` フィールドは含まれない（フルフロー実行）

### Requirement: FR-019 — ワークフローエンジンはモードに基づいてステップを自動スキップする

`mspec continue` 実行時、システムは `readme.md` の `Mode:` フィールドを読み取り、現在のステップ ID がそのモードのスキップリストに含まれる場合、システム SHALL そのステップを `skipped` 状態として扱い成果物を生成せずに次のステップへ進み、`readme.md` の `## Skipped Steps` セクションにスキップ記録を追記する。スキルは起動されない（lazy engine skip）。

有効なモードとスキップリスト:
- `typo`: `proposal`, `quickstart` をスキップ
- `minor`: `proposal`, `quickstart` をスキップ
- `bugfix`: `proposal`, `quickstart` をスキップ（research は強制、FR-020 参照）

#### Scenario: typo モードで /mspec:proposal が自動スキップされる

- GIVEN `readme.md` に `> Mode: typo` が記録されている
- WHEN `/mspec:proposal` スキルが起動する
- THEN エンジンは proposal ステップを `skipped` として扱い、スキルは起動されない
- AND `proposal.md` は生成されない
- AND `readme.md` の `## Skipped Steps` に `- proposal: typo モードのため自動スキップ` が追記される

#### Scenario: minor モードで /mspec:quickstart が自動スキップされる

- GIVEN `readme.md` に `> Mode: minor` が記録されている
- WHEN `/mspec:quickstart` スキルが起動する
- THEN エンジンは quickstart ステップを `skipped` として扱い、スキルは起動されない
- AND `readme.md` の `## Skipped Steps` にスキップ記録が追記される

#### Scenario: bugfix モードで /mspec:proposal が自動スキップされる

- GIVEN `readme.md` に `> Mode: bugfix` が記録されている
- WHEN `/mspec:proposal` スキルが起動する
- THEN スキルは proposal ステップをスキップすると宣言して終了する
- AND `readme.md` の `## Skipped Steps` にスキップ記録が追記される

#### Scenario: モード未指定チェンジではスキップが発生しない

- GIVEN `readme.md` に `Mode:` フィールドが存在しない
- WHEN `/mspec:proposal` スキルが起動する
- THEN スキルは通常どおり proposal ステップを実行する

### Requirement: FR-020 — bugfix モードは research ステップを強制する

`bugfix` モードのチェンジにおいて、システム SHALL `mspec:research` スキル起動時にモードを確認し、`bugfix` であれば research ステップをスキップ不可として扱い、ユーザーがスキップを試みた場合は拒否してその旨を通知する。

#### Scenario: bugfix モードで /mspec:research がスキップ不可になる

- GIVEN `readme.md` に `> Mode: bugfix` が記録されている
- WHEN ユーザーが research ステップをスキップしようとする
- THEN スキルは「bugfix モードでは research は必須です」と通知してスキップを拒否する
- AND research ステップを通常どおり開始する

#### Scenario: bugfix モードで research が正常完了した場合は次ステップへ進む

- GIVEN `readme.md` に `> Mode: bugfix` が記録されている
- WHEN `/mspec:research` スキルが起動し、`research.md` が正常に生成される
- THEN 次のステップ（delta）へ通常どおり進む

### Requirement: FR-021 — スキルの EARS パターン例示のロケール対応
`mspec-delta` スキルおよび EARS 形式を例示する全スキルは SHALL `mspec status --json` が返す `"locale"` フィールドを読み取り、そのロケールに対応した EARS パターン例示（`locale: ja` の場合は `このシステムは SHALL <振る舞い>.`、`locale: en` の場合は `The system SHALL <response>.`）を LLM への指示に使用する。

#### Scenario: locale=ja 設定時に日本語 EARS 形式で Requirements が生成される
- GIVEN `config.yaml` に `locale: ja` が設定されており、`mspec status --json` が `"locale": "ja"` を返す
- WHEN `mspec:delta` スキルを実行して Requirements を生成する
- THEN 生成された `specs/<capability>/spec.md` の Requirement 本文が `このシステムは SHALL <振る舞い>.` 形式であり、`The system SHALL` の文字列が含まれない

#### Scenario: locale=en 設定時は英語 EARS 形式を維持する
- GIVEN `config.yaml` に `locale: en` が設定されており、`mspec status --json` が `"locale": "en"` を返す
- WHEN `mspec:delta` スキルを実行して Requirements を生成する
- THEN 生成された Requirement 本文が `The system SHALL <response>.` 形式である

### Requirement: FR-022 — `mspec-design` skill は `design.md` と `design-rationale.md` の両方を同時に生成する

`design` ステップが実行されるとき、このシステムは SHALL `mspec-design` skill の `SKILL.md` プロンプトと procedure を更新して、`design.md`（構造・データモデル・API・契約を Reference として記述）と `design-rationale.md`（採用理由・代替案・トレードオフ・破棄した選択肢を Explanation として記述）を **同一ステップ内で両方とも生成完了** させなければならない。両ファイルとも末尾に Constitution Check（Phase 1 列を埋める）を含む。

#### Scenario: design ステップ完了時に両ファイルが揃う
- GIVEN change ディレクトリで proposal/delta/research が完了し design ステップを実行する条件が整っている
- WHEN ユーザーが `/mspec:continue` で design ステップを実行する
- THEN `changes/<id>/design.md` と `changes/<id>/design-rationale.md` の両方が作成されている
- AND `design.md` の YAML frontmatter は `doc_type: Reference` を宣言する
- AND `design-rationale.md` の YAML frontmatter は `doc_type: Explanation` を宣言する
- AND 両ファイルの末尾に `## Constitution Check` セクションが存在する

#### Scenario: design-rationale.md 欠落時は skill が再実行を促す
- GIVEN design ステップで `design.md` のみ生成され `design-rationale.md` が欠落している
- WHEN `mspec validate --change <id>` を実行する
- THEN validate が `design-rationale.md` の欠落を blocker として報告する
- AND `mspec continue` が `validate_failed` を返し、`mspec-design` skill の再実行を要求する

### Requirement: FR-023 — `mspec-archive` skill は `readme.md` 末尾の「まとめ」セクションを AI 記述で埋める

`archive` ステップが実行されるとき、このシステムは SHALL `mspec-archive` skill の procedure を更新して、当該 change 内全成果物の差分と確定した Delta Spec の内容を要約した「Lessons / Next Steps」を AI が生成し、`readme.md` 末尾の `## Summary (Lessons / Next Steps)` セクションに追記しなければならない。生成内容は Tutorial 型読者（次回類似 change を起こす人間または AI）が学べる形で、当該 change で確定した教訓と「次に類似変更を起こす際の入り口」を含む。

#### Scenario: archive 後に readme まとめが埋まる
- GIVEN change の implement と self-review が完了し `/mspec:continue` で archive ステップを実行する
- WHEN archive ステップが完了する
- THEN `readme.md` の `## Summary (Lessons / Next Steps)` セクションがプレースホルダコメントだけでなく振り返り文章で埋められている
- AND 当該文章は当該 change で確定した教訓（Lessons）と「次に同種の変更を起こす際の起点」（Next Steps）を含む

#### Scenario: archive 時に Summary 欠落のままでは validate fail
- GIVEN archive ステップ完了後に `readme.md` の Summary セクションがプレースホルダコメントのままである
- WHEN `mspec validate --change <id>` を実行する
- THEN validate が Summary 未記入を warning または error として報告する







