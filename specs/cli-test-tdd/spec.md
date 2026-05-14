<!-- mspec: gaps in FR numbering are intentional. -->

# cli-test-tdd Specification

## Purpose

`mspec test` capability は、TDD の red→green 遷移を CLI が能動的に裏付けるための証跡記録機構を提供する。ユーザーは `mspec test --expect-red <task-id>` および `mspec test --expect-green <task-id>` を通じて `.mspec/config.yaml` で宣言された `test.command` を実行し、終了コードが `expect_red_on_exit` / `expect_green_on_exit` のどちらに属するかを判定する。期待通りの結果が観測された場合のみ `.mspec/cache/red-evidence/` または `.mspec/cache/green-evidence/` に証跡 JSON が保存され、`enforce_tdd: true` の step ではこれら証跡の揃いが完了条件として要求される。test runner の自動推定は行わず、`test.command` 未設定時は対話で明示を求める。

## Requirements

### Requirement: FR-001 — `--expect-red` records evidence on observed failure

The system MUST execute `.mspec/config.yaml` の `test.command` when `mspec test --expect-red <task-id>` is invoked, and MUST persist an evidence JSON file to `.mspec/cache/red-evidence/<change>__<task-id>.json` when the process exits with a code contained in `test.expect_red_on_exit`.

#### Scenario: Failing test produces red evidence
- GIVEN `.mspec/config.yaml` の `test.command` に `npm test --` が設定され、`test.expect_red_on_exit` に `[1, 2]` が含まれている
- WHEN ユーザーが change `2026-05-14-093015-apply-css` の文脈で `mspec test --expect-red T001` を実行し、テストが exit code `1` で終了する
- THEN `.mspec/cache/red-evidence/2026-05-14-093015-apply-css__T001.json` が新規作成される
- AND コマンドは終了コード 0 で完了する

### Requirement: FR-002 — `--expect-red` fails when the test passes

The system MUST exit with a non-zero status and MUST NOT persist a red-evidence file when `mspec test --expect-red <task-id>` observes an exit code contained in `test.expect_green_on_exit` (interpreted as a TDD violation).

#### Scenario: Unexpected green during expect-red is rejected
- GIVEN `.mspec/config.yaml` の `test.expect_green_on_exit` に `[0]` が含まれている
- WHEN ユーザーが `mspec test --expect-red T001` を実行し、テストが exit code `0` で終了する
- THEN コマンドは非ゼロの終了コードで失敗する
- AND `.mspec/cache/red-evidence/` 配下に該当 task-id の証跡ファイルは作成されない

### Requirement: FR-003 — `--expect-green` records evidence on observed success

The system MUST execute `.mspec/config.yaml` の `test.command` when `mspec test --expect-green <task-id>` is invoked, and MUST persist an evidence JSON file to `.mspec/cache/green-evidence/<change>__<task-id>.json` when the process exits with a code contained in `test.expect_green_on_exit`.

#### Scenario: Passing test produces green evidence
- GIVEN `.mspec/config.yaml` の `test.command` に `npm test --` が設定されている
- WHEN ユーザーが change `2026-05-14-093015-apply-css` の文脈で `mspec test --expect-green T001` を実行し、テストが exit code `0` で終了する
- THEN `.mspec/cache/green-evidence/2026-05-14-093015-apply-css__T001.json` が新規作成される
- AND コマンドは終了コード 0 で完了する

### Requirement: FR-004 — `--expect-green` fails when the test fails

The system MUST exit with a non-zero status and MUST NOT persist a green-evidence file when `mspec test --expect-green <task-id>` observes an exit code contained in `test.expect_red_on_exit`.

#### Scenario: Unexpected red during expect-green is rejected
- GIVEN `.mspec/config.yaml` の `test.expect_red_on_exit` に `[1, 2]` が含まれている
- WHEN ユーザーが `mspec test --expect-green T001` を実行し、テストが exit code `1` で終了する
- THEN コマンドは非ゼロの終了コードで失敗する
- AND `.mspec/cache/green-evidence/` 配下に該当 task-id の証跡ファイルは作成されない

### Requirement: FR-005 — Evidence path convention under `.mspec/cache/`

The system MUST write red/green evidence files exclusively under `.mspec/cache/red-evidence/` and `.mspec/cache/green-evidence/` so that the existing project-wide `.gitignore` entry for `.mspec/cache/` covers them, and the system MUST NOT create evidence files outside `.mspec/cache/`.

#### Scenario: Evidence is contained under cache root
- GIVEN `.gitignore` に `.mspec/cache/` 行が含まれている (cli-init で投入済み)
- WHEN ユーザーが `mspec test --expect-red T001` および `mspec test --expect-green T001` を成功裏に実行する
- THEN 生成された証跡ファイルはいずれも `.mspec/cache/red-evidence/` または `.mspec/cache/green-evidence/` の直下に位置する
- AND これらファイルは Git の追跡対象に追加されない

### Requirement: FR-006 — Re-prompt when `test.command` is empty

The system MUST interactively re-prompt the user for `test.command` when `mspec test` is invoked while `.mspec/config.yaml` の `test.command` フィールドが空である, and MUST persist the answered value back into `.mspec/config.yaml` before proceeding.

#### Scenario: Empty test.command triggers interactive re-prompt
- GIVEN `.mspec/config.yaml` の `test.command` が空文字である
- WHEN ユーザーが `mspec test --expect-red T001` を実行する
- THEN CLI は `test.command` の入力を対話で求める
- AND ユーザーが `pytest -x` と入力すると、`.mspec/config.yaml` の `test.command` が `pytest -x` に更新される
- AND その後実際のテスト実行に進む

### Requirement: FR-007 — No automatic detection of test runner

The system MUST NOT attempt to auto-detect or infer the project's test runner (e.g., scanning for `package.json`, `pyproject.toml`, `Cargo.toml`, etc.) when `test.command` is missing; the only supported resolution is the interactive prompt defined in FR-006.

#### Scenario: Missing test.command is not silently guessed
- GIVEN `.mspec/config.yaml` の `test.command` が空であり、プロジェクトルートに `package.json` が存在する
- WHEN ユーザーが `mspec test --expect-red T001` を実行する
- THEN CLI は `package.json` を根拠に `npm test` を勝手に採用してテストを実行することは無い
- AND CLI は FR-006 の対話プロンプトを経由して値を取得する

### Requirement: FR-008 — `enforce_tdd: true` requires paired red and green evidence

The system MUST cause `mspec validate` to fail when the active workflow step has `enforce_tdd: true` and at least one task declared in `tasks.md` is missing either its `.mspec/cache/red-evidence/<change>__<task-id>.json` or its `.mspec/cache/green-evidence/<change>__<task-id>.json` file.

#### Scenario: Missing green evidence blocks implement completion
- GIVEN `workflow.yaml` の `implement` step に `enforce_tdd: true` が設定されている
- AND change の `tasks.md` に `T001` と `T002` の 2 task が宣言されている
- AND `.mspec/cache/red-evidence/<change>__T001.json` と `.mspec/cache/red-evidence/<change>__T002.json` は存在する
- AND `.mspec/cache/green-evidence/<change>__T001.json` のみ存在し、`T002` の green 証跡が欠落している
- WHEN ユーザーが `mspec validate --change <change>` を実行する
- THEN コマンドは非ゼロの終了コードで失敗する
- AND エラーメッセージに不足している証跡として `T002` の green-evidence が示される

#### Scenario: All evidence present allows validate to pass
- GIVEN `enforce_tdd: true` の step に対して、全 task の red-evidence と green-evidence が `.mspec/cache/` 配下に揃っている
- WHEN ユーザーが `mspec validate --change <change>` を実行する
- THEN TDD 証跡に関する検証は pass する

### Requirement: FR-009 — Evidence file payload identifies the run

The system MUST include in each evidence JSON at minimum the fields identifying the change name, the task id, the executed command string, the observed exit code, and the timestamp at which the run completed.

#### Scenario: Evidence captures execution metadata
- GIVEN `mspec test --expect-red T001` が `change=2026-05-14-093015-apply-css` の文脈で成功裏に証跡を保存した
- WHEN 生成された `.mspec/cache/red-evidence/2026-05-14-093015-apply-css__T001.json` を読み込む
- THEN JSON は `change`, `task_id`, `command`, `exit_code`, `recorded_at` のフィールドを含む
- AND `task_id` の値は `T001` である
