<!-- mspec: gaps in FR numbering are intentional. -->

# cli-constitution Specification

## Purpose

`mspec constitution` capability は、プロジェクトの設計上の原則 (Constitution) を `memory/constitution.md` として宣言・閲覧・運用するための入口を提供する。さらに、各ワークフローステップ成果物 MD の末尾に埋め込まれる `## Constitution Check` 表 (Spec Kit 互換の Phase 0 / Phase 1 二段ゲート) の構造と、`mspec validate --strict` による機械検証ルールを定義する。本 capability は「憲法がどこに置かれ、誰がどう参照し、どの step で何を確認するか」を一元的に責務として持つ。

## Requirements

### Requirement: FR-001 — `mspec constitution init` generates `memory/constitution.md` from template

The system MUST create `memory/constitution.md` from the bundled constitution template when `mspec constitution init` is invoked and the file does not already exist. The generated file MUST contain `## Core Principles`, `## Additional Constraints`, and `## Development Workflow & Governance` sections, as well as a `> Version:` metadata line.

#### Scenario: Fresh constitution scaffold is created
- GIVEN プロジェクトに `memory/constitution.md` が存在しない
- WHEN ユーザーが `mspec constitution init` を実行する
- THEN `memory/constitution.md` が雛形内容で新規作成される
- AND ファイルは `## Core Principles` 節を含む
- AND ファイルは `> Version:` で始まるメタデータ行を含む
- AND コマンドは終了コード 0 で完了する

#### Scenario: Existing constitution is preserved
- GIVEN プロジェクトに `memory/constitution.md` が既に存在する
- WHEN ユーザーが `mspec constitution init` を実行する
- THEN 既存ファイルは変更されない
- AND コマンドは非ゼロの終了コードで中断する

### Requirement: FR-002 — `mspec constitution show` prints the current constitution

The system MUST print the contents of `memory/constitution.md` to standard output when `mspec constitution show` is invoked, exiting with code 0 on success.

#### Scenario: Show current constitution
- GIVEN プロジェクトに `memory/constitution.md` が存在する
- WHEN ユーザーが `mspec constitution show` を実行する
- THEN 標準出力に `memory/constitution.md` の内容がそのまま出力される
- AND 終了コードは 0 である

#### Scenario: Show without constitution fails
- GIVEN プロジェクトに `memory/constitution.md` が存在しない
- WHEN ユーザーが `mspec constitution show` を実行する
- THEN コマンドは非ゼロの終了コードで中断する

### Requirement: FR-003 — Constitution declares principles as `### I.`, `### II.`, ... headings

The system MUST treat each H3 heading under `## Core Principles` that begins with a Roman numeral followed by a period (e.g. `### I. Library-First`, `### II. CLI Interface`) as a single Core Principle. The Roman numeral is the principle's stable identifier, used by Constitution Check tables to refer back to the principle.

#### Scenario: Parser enumerates declared principles
- GIVEN `memory/constitution.md` の `## Core Principles` 節に `### I. Library-First` と `### II. CLI Interface` の見出しが含まれる
- WHEN CLI が constitution を解析する
- THEN `I` と `II` の 2 つの Principle が認識される
- AND それぞれのタイトルは `Library-First` と `CLI Interface` として抽出される

### Requirement: FR-004 — Each artifact MD with `constitution_check: true` MUST embed a `## Constitution Check` section at its end

The system MUST require every step whose workflow definition declares `constitution_check: true` to embed a `## Constitution Check` section at the **end** of each of its produced Markdown artifacts. The section MUST contain a table with the columns `Principle`, `Phase 0`, `Phase 1`, `Notes`, in that order.

#### Scenario: Constitution Check section is present
- GIVEN `proposal` step が `constitution_check: true` で設定されている
- WHEN 生成された `proposal.md` の末尾を確認する
- THEN `## Constitution Check` 見出しが存在する
- AND その配下に `Principle | Phase 0 | Phase 1 | Notes` の列を持つ表が存在する

### Requirement: FR-005 — `design` step MUST fill both Phase 0 and Phase 1 cells

The system MUST require the `design` step's Constitution Check table to fill **both** the `Phase 0` and `Phase 1` cells for every declared principle with one of `✅`, `❌`, or `—` (where `—` means "not evaluable in this phase"). At least one of Phase 0 / Phase 1 MUST be a concrete verdict (`✅` or `❌`) for each principle; both columns being `—` for a single principle MUST cause `mspec validate --strict` to fail.

#### Scenario: design.md provides full two-gate coverage
- GIVEN `design` step が完了し、`design.md` が生成された
- WHEN `mspec validate --strict --change <name>` を実行する
- THEN `design.md` 末尾の Constitution Check 表で全 Principle の `Phase 0` 列と `Phase 1` 列が `✅` / `❌` / `—` のいずれかで埋まっていることが検証される
- AND いずれの Principle も Phase 0 / Phase 1 双方が `—` ではない

#### Scenario: design with empty cell fails strict validation
- GIVEN `design.md` の Constitution Check 表で Principle II の `Phase 1` セルが空である
- WHEN ユーザーが `mspec validate --strict --change <name>` を実行する
- THEN コマンドは非ゼロの終了コードで fail する

### Requirement: FR-006 — Non-`design` steps MAY leave Phase 1 as `—`

The system MUST accept Constitution Check tables whose `Phase 1` column is `—` for **every** principle when the embedding step is not `design` (e.g. `proposal`, `research`, `tasks`, `self-review`). For such steps, `mspec validate --strict` MUST pass as long as all `Phase 0` cells are filled with `✅` / `❌` / `—`.

#### Scenario: Proposal.md with Phase 1 dashes passes
- GIVEN `proposal` step が `constitution_check: true` で完了し、`proposal.md` の Constitution Check 表で全 Principle の `Phase 1` 列が `—` である
- AND 全 Principle の `Phase 0` 列が `✅` / `❌` / `—` のいずれかで埋まっている
- WHEN ユーザーが `mspec validate --strict --change <name>` を実行する
- THEN コマンドは終了コード 0 で完了する

### Requirement: FR-007 — Every declared principle MUST appear as a row in the Constitution Check table

The system MUST require the Constitution Check table to enumerate **every** Core Principle declared in `memory/constitution.md` (matched by its Roman numeral identifier). Missing rows MUST cause `mspec validate --strict` to fail.

#### Scenario: Missing principle row fails validation
- GIVEN `memory/constitution.md` に `### I.` `### II.` `### III.` の 3 原則が宣言されている
- AND `design.md` 末尾の Constitution Check 表に `I` と `II` の 2 行しか存在しない
- WHEN ユーザーが `mspec validate --strict --change <name>` を実行する
- THEN コマンドは非ゼロの終了コードで fail する
- AND 失敗理由として「Principle III が表に列挙されていない」旨が出力される

### Requirement: FR-008 — `❌` verdicts MUST trigger a non-empty `### Complexity Tracking` subsection

The system MUST require any artifact whose Constitution Check table contains at least one `❌` in either the `Phase 0` or `Phase 1` column to also contain a `### Complexity Tracking` H3 subsection directly after the table. The subsection MUST NOT be empty and MUST NOT consist solely of the literal string `None`; it MUST describe why a simpler design is insufficient.

#### Scenario: Violation without Complexity Tracking fails
- GIVEN `design.md` 末尾の Constitution Check 表で Principle I の `Phase 0` が `❌` である
- AND `### Complexity Tracking` 節が存在しないか、本文が `None` のみである
- WHEN ユーザーが `mspec validate --strict --change <name>` を実行する
- THEN コマンドは非ゼロの終了コードで fail する

#### Scenario: All checks passing allows `None`
- GIVEN `design.md` 末尾の Constitution Check 表に `❌` が一切含まれない
- AND `### Complexity Tracking` 節の本文が `None` である
- WHEN ユーザーが `mspec validate --strict --change <name>` を実行する
- THEN コマンドは終了コード 0 で完了する

### Requirement: FR-009 — Constitution Check verification is skipped for `state == skipped` steps

The system MUST skip all Constitution Check verifications for any step whose `mspec status` state is `skipped`. The skip placeholder MD (carrying the `<!-- mspec: skipped step -->` header at the top of the file) MUST NOT be required to contain a `## Constitution Check` section, and the absence of that section MUST NOT cause `mspec validate --strict` to fail.

#### Scenario: Skipped step placeholder is exempt
- GIVEN `research` step が `mspec skip research --reason "typo fix only"` でスキップされている
- AND `changes/<name>/research.md` の先頭に `<!-- mspec: skipped step -->` ヘッダが付いたプレースホルダ MD が存在する
- AND そのファイルには `## Constitution Check` 節が含まれない
- WHEN ユーザーが `mspec validate --strict --change <name>` を実行する
- THEN `research.md` に対する Constitution Check 検証はスキップされる
- AND 当該理由ではコマンドが fail しない

### Requirement: FR-010 — Per-step default ON/OFF for `constitution_check`

The system MUST default the `constitution_check` flag in the bundled `workflow.yaml` to the following values per step: `new=false`, `proposal=true`, `delta=false`, `research=true`, `design=true`, `quickstart=false`, `checklist=false`, `self-review=true`, `tasks=true`, `implement=false`, `archive=false`. Users MUST be allowed to override any of these defaults by editing `.mspec/workflow.yaml`; the system MUST honor the user-defined value regardless of the step identifier.

#### Scenario: Default workflow applies documented defaults
- GIVEN `mspec init` で配置されたままの `.mspec/workflow.yaml` が使用されている
- WHEN CLI が各 step の `constitution_check` フラグを読み込む
- THEN `design` step の値は `true` である
- AND `implement` step の値は `false` である
- AND `proposal` / `research` / `self-review` / `tasks` の各 step の値は `true` である

#### Scenario: User enables constitution_check for implement step
- GIVEN ユーザーが `.mspec/workflow.yaml` で `implement` step の `constitution_check` を `true` に変更した
- WHEN ユーザーが `implement` step を進めて生成成果物に対し `mspec validate --strict --change <name>` を実行する
- THEN その step の成果物に対しても Constitution Check 表の有無・全 Principle の列挙・`❌` 時の Complexity Tracking 有無が機械検証される

### Requirement: FR-011 — `mspec validate --strict` performs the four mechanical checks

The system MUST, when `mspec validate --strict` is invoked, perform exactly the following four mechanical checks against every step whose `constitution_check` is `true` and whose state is not `skipped`:

1. The step's produced Markdown artifacts each contain a `## Constitution Check` section.
2. The Constitution Check table has the four columns `Principle`, `Phase 0`, `Phase 1`, `Notes`, in that order.
3. Every Core Principle declared in `memory/constitution.md` is present as a row in the table (matched by Roman numeral).
4. If any cell in the `Phase 0` or `Phase 1` column is `❌`, the artifact contains a non-empty `### Complexity Tracking` subsection whose body is not solely `None`.

Semantic validity (i.e. whether the verdicts are actually correct) MUST NOT be evaluated by `mspec validate --strict`; that judgment is delegated to the `self-review` step.

#### Scenario: All four mechanical checks pass
- GIVEN `design.md` 末尾に正しい `## Constitution Check` 節 (4 列、全 Principle 列挙、❌ 無し) が含まれる
- WHEN ユーザーが `mspec validate --strict --change <name>` を実行する
- THEN 4 つの機械検査すべてが pass する
- AND コマンドは終了コード 0 で完了する

#### Scenario: Column order mismatch fails
- GIVEN `design.md` の Constitution Check 表の列順が `Principle | Phase 1 | Phase 0 | Notes` (Phase 0/1 が逆) である
- WHEN ユーザーが `mspec validate --strict --change <name>` を実行する
- THEN コマンドは非ゼロの終了コードで fail する
- AND 失敗理由として列順違反が出力される
