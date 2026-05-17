<!-- @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-018, FR-019, FR-020 -->
<!-- Change: lightweight-change-mode -->

# Delta Spec: claude-integration

## ADDED Requirements

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
