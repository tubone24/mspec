<!-- mspec: gaps in FR numbering are intentional. -->

# cli-workflow-engine Specification

## Purpose

`cli-workflow-engine` capability は、mspec が定義するチェンジ駆動ワークフローのライフサイクルを管理する責務を負う。`.mspec/workflow.yaml` で定義されたステップ系列に対し、各ステップの状態 (`done|ready|blocked|skipped|invalid`) を算出し、次に AI エージェントが実行すべきプロンプトと文脈を組み立て、ユーザーが個々のチェンジを開始・進行・完遂できるようにする。外部から観測可能な主インターフェースは `mspec new`, `mspec status`, `mspec validate`, `mspec continue`, `mspec schema` の 5 つのコマンドであり、それぞれが workflow.yaml の宣言的記述に基づいて動作する。

## Requirements

### Requirement: FR-001 — Load and validate `.mspec/workflow.yaml`

The system MUST load `.mspec/workflow.yaml` at the start of every workflow-engine command and SHALL treat a missing file or unparsable YAML as a fatal error with a non-zero exit code.

#### Scenario: Workflow file is loaded successfully
- GIVEN プロジェクトルートに有効な `.mspec/workflow.yaml` が存在する
- WHEN ユーザーが `mspec status --change <name>` を実行する
- THEN workflow.yaml に定義された全ステップ (`enabled: false` を除く) が処理対象として読み込まれる
- AND コマンドは終了コード 0 で完了する

#### Scenario: Missing workflow file aborts the command
- GIVEN プロジェクトルートに `.mspec/workflow.yaml` が存在しない
- WHEN ユーザーが `mspec status` を実行する
- THEN コマンドは非ゼロの終了コードで中断する

### Requirement: FR-002 — Mandatory steps must be present and non-removable

The system MUST require that the steps `new`, `proposal`, `delta`, `tasks`, `implement`, `archive` are defined in `.mspec/workflow.yaml` with `removable: false`, and SHALL reject any schema that omits or marks them removable.

#### Scenario: Schema validation rejects removal of a mandatory step
- GIVEN ユーザーが `.mspec/workflow.yaml` から `implement` ステップを削除した
- WHEN ユーザーが `mspec schema validate` を実行する
- THEN コマンドは非ゼロの終了コードで中断する
- AND 出力に `implement` が必須ステップである旨のエラーが含まれる

#### Scenario: Schema validation accepts a fully-formed workflow
- GIVEN `.mspec/workflow.yaml` に 6 つの必須ステップが全て `removable: false` で含まれる
- WHEN ユーザーが `mspec schema validate` を実行する
- THEN コマンドは終了コード 0 で完了する

### Requirement: FR-003 — `mspec new` creates a timestamped change directory

The system MUST create a directory named `changes/<YYYY-MM-DD-HHMMSS>-<feature-kebab>/` and a `readme.md` inside it when `mspec new <feature-kebab>` is invoked.

#### Scenario: New change directory is scaffolded
- GIVEN プロジェクトルートに mspec が初期化済みで、未使用の feature 名 `apply-css` を持つ
- WHEN ユーザーが `mspec new apply-css` を実行する
- THEN `changes/<YYYY-MM-DD-HHMMSS>-apply-css/readme.md` が生成される
- AND ディレクトリ名のタイムスタンプは現在時刻に基づく
- AND コマンドは終了コード 0 で完了する

#### Scenario: Invalid feature name is rejected
- GIVEN ユーザーが kebab-case ではない feature 名 `ApplyCSS` を指定する
- WHEN ユーザーが `mspec new ApplyCSS` を実行する
- THEN コマンドは非ゼロの終了コードで中断する
- AND `changes/` 配下に新規ディレクトリは作成されない

### Requirement: FR-004 — `mspec status` reports each step's state as one of five values

The system MUST output, for every step defined in the active workflow, a `state` field whose value is exactly one of `done`, `ready`, `blocked`, `skipped`, or `invalid`.

#### Scenario: status returns five-valued state per step
- GIVEN チェンジ `2026-05-14-093015-apply-css` が進行中で、各ステップが多様な状態にある
- WHEN ユーザーが `mspec status --change 2026-05-14-093015-apply-css --json` を実行する
- THEN 出力 JSON の `steps[].state` の値はすべて `done|ready|blocked|skipped|invalid` のいずれかである
- AND `current_step` には最初の `ready` または `invalid` のステップ ID が入る

### Requirement: FR-005 — `done` state requires all produced files to exist and validate

The system MUST mark a step's state as `done` only when every file listed in the step's `produces` field exists under the change directory and passes `mspec validate`.

#### Scenario: Step with all produced files validated is done
- GIVEN チェンジ配下に `proposal.md` が存在し、validate がすべて pass する
- WHEN ユーザーが `mspec status` を実行する
- THEN `proposal` ステップの `state` は `done` である

#### Scenario: Step with a missing produced file is not done
- GIVEN `design` ステップが `produces: [design.md, architecture-overview.md]` を持ち、`architecture-overview.md` が存在しない
- WHEN ユーザーが `mspec status` を実行する
- THEN `design` ステップの `state` は `done` ではない

### Requirement: FR-006 — `ready` and `blocked` are determined by upstream completion

The system MUST mark a step as `ready` only when its upstream step is `done` or `skipped` and the step's own produced files do not yet exist; otherwise, if upstream is not `done` or `skipped`, the step's state MUST be `blocked`.

#### Scenario: Step becomes ready after upstream completes
- GIVEN `proposal` ステップが `done` であり、`delta` ステップの produces ファイルがまだ存在しない
- WHEN ユーザーが `mspec status` を実行する
- THEN `delta` ステップの `state` は `ready` である

#### Scenario: Step is blocked while upstream is not done
- GIVEN `proposal` ステップが `ready` の状態にある (= まだ着手前)
- WHEN ユーザーが `mspec status` を実行する
- THEN `delta` 以降のステップの `state` はいずれも `blocked` である

### Requirement: FR-007 — `invalid` state is reported when produced files fail validation

The system MUST mark a step as `invalid` when the produced files exist but `mspec validate` fails for that step (例: Scenario 見出しが H4 でない、FR-ID 重複、`constitution_check: true` の step で Constitution Check 表が欠落、`enforce_anchor`/`enforce_e2e`/`enforce_tdd` のチェックが fail)。

#### Scenario: Malformed produced file yields invalid state
- GIVEN `research.md` が存在するが、Scenario の見出しレベルが H3 になっている
- WHEN ユーザーが `mspec status` を実行する
- THEN `research` ステップの `state` は `invalid` である
- AND 出力 JSON の `blockers` に fail 理由が記載される

#### Scenario: Missing constitution check table yields invalid state
- GIVEN `design.md` が存在するが、末尾の Constitution Check 表が欠落しており、`design` ステップは `constitution_check: true`
- WHEN ユーザーが `mspec status` を実行する
- THEN `design` ステップの `state` は `invalid` である

### Requirement: FR-008 — `skipped` state is sourced from the skip log

The system MUST mark a step as `skipped` when the step's ID is recorded in `.mspec/cache/skip-log.json`, and SHALL treat such a step as a satisfied upstream for the next step's `ready`/`blocked` evaluation.

#### Scenario: Skipped step does not block the next step
- GIVEN `quickstart` ステップが skip-log に記録され、`design` ステップが `done` である
- WHEN ユーザーが `mspec status` を実行する
- THEN `quickstart` ステップの `state` は `skipped` である
- AND `checklist` ステップは `ready` または `done` に進めるよう評価される

### Requirement: FR-009 — `mspec validate` checks Markdown structure and Constitution Check sections

The system MUST validate produced Markdown artifacts for structural rules including heading levels (Scenario はH4 必須)、FR-ID の連番性と重複の不在、ならびに `constitution_check: true` の step に対する Constitution Check 表の存在、and SHALL exit with a non-zero code when any rule fails.

#### Scenario: Validation passes for well-formed artifacts
- GIVEN チェンジ配下の全成果物 MD が構造ルールを満たす
- WHEN ユーザーが `mspec validate --change <name>` を実行する
- THEN コマンドは終了コード 0 で完了する

#### Scenario: Validation fails on H4 scenario rule violation
- GIVEN `delta-spec.md` の Scenario 見出しが H3 で書かれている
- WHEN ユーザーが `mspec validate --change <name>` を実行する
- THEN コマンドは非ゼロの終了コードで中断する
- AND 出力には Scenario 見出しレベルに関するエラーが含まれる

### Requirement: FR-010 — `mspec continue` returns a JSON envelope with prompts and context

The system MUST output a JSON object containing at minimum the fields `change`, `current_step`, `next_action`, `main_prompt`, `required_artifacts`, `produces`, and `block_after` when `mspec continue` is invoked, and SHALL include `questions_to_ask` when the current step has `ask_questions: true`.

#### Scenario: Continue returns execute prompt for a ready step
- GIVEN チェンジが進行中で、現在のステップ `research` が `ready` 状態にある
- WHEN ユーザーが `mspec continue --change <name> --json` を実行する
- THEN 出力 JSON は `next_action: "execute"`、`main_prompt`、`required_artifacts`、`produces: ["research.md"]` を含む
- AND `research` ステップは `ask_questions: true` であるため `questions_to_ask` 配列が含まれる

### Requirement: FR-011 — `next_action` is one of four enumerated values

The system MUST set the `next_action` field of `mspec continue` output to exactly one of `execute`, `wait_user`, `validate_failed`, or `complete`, corresponding to: ready で続行可能 / ユーザー入力待ち / 直前 step の validate fail / 全 step 完了。

#### Scenario: validate_failed is returned when current step is invalid
- GIVEN 現在のステップが `invalid` 状態にあり、`blockers` が空でない
- WHEN ユーザーが `mspec continue` を実行する
- THEN 出力 JSON の `next_action` は `validate_failed` である
- AND `main_prompt` には次ステップを進める指示は含まれない

#### Scenario: complete is returned when archive is done
- GIVEN チェンジ内の全 step が `done` または `skipped` で、archive まで完了している
- WHEN ユーザーが `mspec continue` を実行する
- THEN 出力 JSON の `next_action` は `complete` である

### Requirement: FR-012 — `mspec continue` provides subagent prompts when required

The system MUST include `subagent_prompt` and `subagent_name` fields in the `mspec continue` output JSON when the current step has `subagent: true`, so that the LLM skill can launch the named subagent with the provided prompt.

#### Scenario: Subagent fields are emitted for subagent-enabled step
- GIVEN 現在のステップが `research` で `subagent: true`
- WHEN ユーザーが `mspec continue` を実行する
- THEN 出力 JSON は `subagent_prompt` と `subagent_name: "mspec-researcher"` を含む

#### Scenario: Subagent fields are omitted for non-subagent step
- GIVEN 現在のステップが `proposal` で `subagent: false`
- WHEN ユーザーが `mspec continue` を実行する
- THEN 出力 JSON には `subagent_prompt` フィールドは含まれない

### Requirement: FR-013 — `mspec continue` treats invocation after a `block: true` step as approval

The system MUST, when invoked after a step with `block: true` has just become `done`, treat the invocation as user approval and return the next executable step's prompt rather than `wait_user`.

#### Scenario: Continue after a blocking step advances to next step
- GIVEN 直前のステップ `proposal` (`block: true`) が `done` になり、ユーザーが続いて `mspec continue` を実行する
- WHEN コマンドが status を取り直す
- THEN 出力 JSON の `next_action` は `execute` であり、`current_step` は次のステップ `delta` を指す

#### Scenario: wait_user is reserved for outstanding inputs
- GIVEN 現在のステップが `ask_questions: true` で、まだユーザーの回答が status 上残っている (未回答状態)
- WHEN ユーザーが `mspec continue` を実行する
- THEN 出力 JSON の `next_action` は `wait_user` である

### Requirement: FR-014 — `mspec schema` shows and validates the workflow YAML

The system MUST provide `mspec schema show` to render the loaded workflow definition for inspection, and `mspec schema validate` to verify schema correctness (必須 step の存在、フィールド型、`removable: false` 違反などを含む)、exiting non-zero on any violation.

#### Scenario: schema show prints the active workflow
- GIVEN プロジェクトに有効な `.mspec/workflow.yaml` がある
- WHEN ユーザーが `mspec schema show` を実行する
- THEN 標準出力に workflow のステップ系列が読みやすい形式で出力される
- AND コマンドは終了コード 0 で完了する

#### Scenario: schema validate rejects malformed workflow
- GIVEN `.mspec/workflow.yaml` の `block` フィールドが boolean 以外の値を持つ
- WHEN ユーザーが `mspec schema validate` を実行する
- THEN コマンドは非ゼロの終了コードで中断する

### Requirement: FR-015 — `mspec continue` エンベロープに `upstream_skipped[]` を含める
<!-- 注: `upstream_skipped` フィールドは現行 CLI に実装済み。本 FR はその挙動を Delta Spec として正式化し、リグレッション固定の E2E を追加するもの。実装変更は伴わない。 -->
システムは `mspec continue` が返す JSON エンベロープに `upstream_skipped` 配列を含め、当該 change で skip 記録されている workflow ステップのうち現在のステップよりも順序上前にあるステップの ID を列挙 MUST。これにより下流のエージェントが欠落を加味してプロンプトとコンテキストを調整できる。

#### Scenario: skip 済みの research ステップが upstream リストに現れる
- GIVEN `research` ステップが skip 記録されている change で、現在のステップが `design` に解決される
- WHEN ユーザーが `mspec continue --change <name> --json` を実行する
- THEN 出力エンベロープには `"upstream_skipped": ["research"]` が含まれる

#### Scenario: skip が無い場合は空配列が返る
- GIVEN skip ステップが存在しない change
- WHEN ユーザーが `mspec continue --change <name> --json` を実行する
- THEN 出力エンベロープには `"upstream_skipped": []` が含まれる

### Requirement: FR-016 — `mspec continue` エンベロープに `constitution_principles[]` を含める
システムは `mspec continue` が返す JSON エンベロープに `constitution_principles` 配列を含め、現在のステップの workflow 宣言で Constitution Check が有効化されている場合、各エントリは原則の ID・名称・評価対象フェーズを公開 MUST。これによりエージェントが憲法ファイルを再読込せずに Constitution Check 表をレンダリングできる。

#### Scenario: design ステップが全宣言原則を列挙する
- GIVEN テスト用フィクスチャの憲法ファイルが H3 見出し形式で 2 つの原則 (`### I. <名称A>` と `### II. <名称B>`) を宣言し、workflow の `design` ステップで Constitution Check が有効化されている
- WHEN 現在のステップが `design` の状態で `mspec continue --change <name> --json` を実行する
- THEN エンベロープは 2 エントリの `constitution_principles` 配列を持ち、各エントリの `id` は `I` と `II`、`name` はフィクスチャ憲法の H3 見出しと一致する

#### Scenario: Constitution Check が無効なステップでは空配列が返る
- GIVEN workflow の `new` ステップで Constitution Check が無効化されている
- WHEN 現在のステップが `new` の状態で `mspec continue --change <name> --json` を実行する
- THEN エンベロープは `"constitution_principles": []` を含む

### Requirement: FR-017 — `architecture-overview.md` での Mermaid 図の必須化
システムは、`mermaid` タグ付きのフェンス付きコードブロックが少なくとも 1 つ存在しない `architecture-overview.md` に対して validate エラーを報告 MUST。これにより design ステップのアーキテクチャ図要件が機械的に強制される。

#### Scenario: Mermaid ブロック欠落で validate が失敗する
- GIVEN `architecture-overview.md` が散文と `text` タグの単一フェンス付きコードブロックのみを含む change
- WHEN ユーザーが `mspec validate --change <name>` を実行する
- THEN コマンドは `architecture-overview.md` を Mermaid フェンス欠落として報告し、プロセスは非ゼロで終了する

#### Scenario: Mermaid ブロックがあれば要件を満たす
- GIVEN `architecture-overview.md` が info string が `mermaid` で始まるフェンス付きコードブロックを 1 つ含む change
- WHEN ユーザーが `mspec validate --change <name>` を実行する
- THEN 当該 artifact の validation は Mermaid 関連の問題を一切報告しない

### Requirement: FR-018 — produces レスステップからの skippable 除去

The `workflow.yaml` MUST NOT carry `skippable: true` on steps where `produces: []` and `removable: false` (mandatory produce-less steps: `self-review`, `implement`, `archive`). Done transition for these steps SHALL be handled exclusively by `.mspec/cache/done-log.json` via `mspec done`.

#### Scenario: workflow.yaml の skippable フラグ削除
- GIVEN `implement`・`archive`・`self-review` ステップに `skippable: true` が設定されている
- WHEN 本チェンジが archive される
- THEN これらのステップの `skippable: true` が削除され、done への遷移は `mspec done` コマンドのみで行われる

### Requirement: FR-019 — workflow.yaml に modes セクションを追加

システムは `.mspec/workflow.yaml` において `modes` キーを受け付け、モード名をスキップするステップ ID の配列にマップする定義を SHALL 受け入れる。アクティブなチェンジの `Mode:` フィールドがモード名と一致するとき、システムはそのモードのスキップリストに含まれるステップを `skipped` 状態として扱う。

#### Scenario: workflow.yaml の modes 定義が typo モードのスキップを制御する

- GIVEN `.mspec/workflow.yaml` に以下が定義されている:
  ```yaml
  modes:
    typo:
      skip: [proposal, quickstart]
    minor:
      skip: [proposal, quickstart]
    bugfix:
      skip: [proposal, quickstart]
      force: [research]
  ```
- WHEN `mspec continue` が `> Mode: typo` を持つ `readme.md` のチェンジを処理する
- THEN `proposal` ステップと `quickstart` ステップは `skipped` 状態として扱われる
- AND それ以外のステップは通常どおり実行される

#### Scenario: modes 未定義のモード値は全ステップを実行する

- GIVEN `.mspec/workflow.yaml` に `modes.foobar` が定義されていない
- WHEN `readme.md` に `> Mode: foobar` が記載されている
- THEN システムは警告を出力し、全ステップをスキップなしで実行する

### Requirement: FR-020 — Mode フィールドなしの既存チェンジは後方互換のままフルフローを実行

システムは `readme.md` に `Mode:` フィールドが存在しないチェンジを `mode: full`（全ステップ実行）と同等に MUST 扱い、既存の動作を変更してはならない。

#### Scenario: Mode フィールドなしで全ステップが実行される

- GIVEN `readme.md` に `Mode:` フィールドが存在しない
- WHEN `mspec continue` がチェンジを処理する
- THEN 全ワークフローステップがスキップなしで順番に実行される
- AND 既存チェンジの動作に変化はない

### Requirement: FR-021 — workflow.yaml の modes は force リストを受け付ける

システムは `.mspec/workflow.yaml` の各モード定義において `force` キー（ステップ ID の配列）を SHALL 受け付け、`force` リストに含まれるステップを当該モードのチェンジでスキップ不可として扱う。`skip` リストと `force` リストに同一ステップが含まれる場合は `force` を優先する。

#### Scenario: bugfix モードで force リストの research がスキップ不可になる

- GIVEN `.mspec/workflow.yaml` の `modes.bugfix.force` に `research` が含まれている
- AND `readme.md` に `> Mode: bugfix` が記録されている
- WHEN `mspec continue` が research ステップを処理する
- THEN システムは research ステップへの skip コマンドをランタイムに拒否し、エラーを返す

#### Scenario: force と skip に同じステップが指定された場合は force が優先される

- GIVEN `.mspec/workflow.yaml` のモード定義で `skip: [research]` と `force: [research]` が両方指定されている
- WHEN `mspec continue` が該当モードのチェンジを処理する
- THEN `force` が優先され research ステップはスキップ不可となる

### Requirement: FR-022 — `design` ステップの `produces` に `design.md` と `design-rationale.md` の両方を含める

このシステムは SHALL ワークフロー定義（`workflow.yaml` 相当の組み込みステップ定義）における `design` ステップの `produces` リストに `design.md` と `design-rationale.md` の **両方** を含め、`mspec status --json` および `mspec continue --json` の `produces` フィールドにも両ファイル名が返るよう構成しなければならない。`mspec validate` はどちらか一方の欠落を blocker として報告し、`mspec continue` は当該ステップを `validate_failed` 状態として扱う。

#### Scenario: design ステップの produces は両ファイルを列挙する
- GIVEN `mspec status --change <id> --json` を実行する
- WHEN steps 配列内の `design` ステップを確認する
- THEN `produces` に `design.md` と `design-rationale.md` の両方が含まれる

#### Scenario: design-rationale.md 欠落で validate が fail する
- GIVEN change ディレクトリに `design.md` のみ存在し `design-rationale.md` が存在しない
- WHEN `mspec validate --change <id>` を実行する
- THEN validate が `design-rationale.md` の欠落を blocker として報告する
- AND 終了コード非ゼロで終了する

#### Scenario: design ステップ完了判定は両ファイル存在が必要
- GIVEN `design.md` のみ存在する状態で `mspec continue --change <id> --json` を実行する
- WHEN レスポンスを確認する
- THEN `current_step` は `design` のままで、`next_action` は `validate_failed` または `execute`（design 再実行を要求）となる

### Requirement: FR-023 — visual-mock の任意ステップ定義

このシステムは SHALL ワークフロー定義に `visual-mock` を任意（skip 可能）ステップとして proposal ステップの直後に追加し、`block_after: true` で停止して次ステップへの進行はユーザー確認後とする。

#### Scenario: visual-mock ステップがワークフローに出現する

- GIVEN change が `proposal` ステップを完了している
- WHEN `mspec continue --change <change> --json` を実行する
- THEN `current_step: "visual-mock"` が返り、`block_after: true` が設定されている

#### Scenario: visual-mock を skip する

- GIVEN ユーザーが visual-mock ステップを不要と判断している
- WHEN `mspec skip visual-mock --change <change> --reason "..."` を実行する
- THEN visual-mock ステップが `skipped` 状態となり次ステップへ進める

### Requirement: FR-024 — implement ステップの max_iterations 設定

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL implement ステップの `max_iterations` フィールドを workflow.yaml で設定可能にする。

#### Scenario: max_iterations フィールドの schema 検証
- GIVEN workflow.yaml の implement ステップに `max_iterations: 3` が設定されている
- WHEN `mspec schema validate` を実行する
- THEN バリデーションエラーなしで通過する

#### Scenario: max_iterations 未設定の場合のデフォルト
- GIVEN workflow.yaml の implement ステップに `max_iterations` が設定されていない
- WHEN workflow を読み込む
- THEN `max_iterations` は `undefined`（制限なし）として扱われる

### Requirement: FR-025 — implement スキルのエスカレーション手順

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL implement スキルが `max_iterations` 回の TDD 失敗後にエスカレーション手順を実行する。

#### Scenario: max_iterations 到達時のエスカレーション
- GIVEN tasks.md のタスクで TDD red→green が `max_iterations` 回連続して失敗した
- WHEN エスカレーション条件が満たされる
- THEN design.md の末尾に `## Escalation Summary` セクションが追記される

#### Scenario: エスカレーションサマリの内容
- GIVEN TDD が max_iterations 回失敗した
- WHEN `## Escalation Summary` が追記される
- THEN タスクID、失敗回数、失敗理由の要約、推奨アクション（設計変更 or 仕様見直し）が含まれる






