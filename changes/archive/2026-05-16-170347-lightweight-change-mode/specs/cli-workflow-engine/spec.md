<!-- @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md -->
<!-- Requirements implemented: FR-019, FR-020, FR-021 -->
<!-- Change: lightweight-change-mode -->

# Delta Spec: cli-workflow-engine

## ADDED Requirements

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
