# Delta Spec: cli-test-tdd

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: なし -->
<!-- アクセス増加: 増加なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-010 — `test.runners` 配列を含む設定スキーマの受け入れ

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

`.mspec/config.yaml` の `test` セクションに `runners:` 配列が宣言されているとき、このシステムは SHALL 各配列要素を `name`（文字列）・`command`（文字列）・`expect_red_on_exit`（整数配列）・`expect_green_on_exit`（整数配列）を持つ独立したランナー定義として解釈する。

#### Scenario: runners 配列の正常解釈
- GIVEN `.mspec/config.yaml` の `test.runners` に `[{name: "backend", command: "pytest -x", expect_red_on_exit: [1,2], expect_green_on_exit: [0]}, {name: "frontend", command: "pnpm exec playwright test", expect_red_on_exit: [1,2], expect_green_on_exit: [0]}]` が定義されている
- WHEN `mspec test --expect-green T001` を実行する
- THEN CLI は `backend` と `frontend` の 2 つのランナーをそれぞれ独立したコマンド実行単位として認識する
- AND 各ランナーは宣言されたコマンドと終了コード期待値を個別に保持する

### Requirement: FR-011 — `runners` 有効時における全ランナーの逐次実行と証跡記録

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

`test.runners` 配列が宣言されているとき、このシステムは SHALL 各ランナーを宣言順に逐次実行し、全ランナーが期待通りの終了コードを返した場合のみ `.mspec/cache/<red|green>-evidence/<change>__<task-id>.json` に証跡を保存する。保存する証跡 JSON の `command` フィールドは SHALL 実行した全ランナーのコマンド文字列を配列で保持し、`runners` フィールドに各ランナーの `name`・`exit_code` を含めなければならない。

#### Scenario: 全ランナー成功時に証跡が保存される
- GIVEN `test.runners` に `backend`（exit_green_on_exit: [0]）と `frontend`（expect_green_on_exit: [0]）の 2 ランナーが定義されている
- WHEN `mspec test --expect-green T001` を実行し、両ランナーが exit code 0 で終了する
- THEN `.mspec/cache/green-evidence/<change>__T001.json` が作成される
- AND 証跡 JSON の `command` フィールドは `["pytest -x", "pnpm exec playwright test"]` のように全コマンドを含む
- AND 証跡 JSON に `runners: [{name: "backend", exit_code: 0}, {name: "frontend", exit_code: 0}]` フィールドが存在する

### Requirement: FR-012 — いずれかのランナー失敗時の即時中断とエラー出力

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

`test.runners` 配列が宣言されているとき、いずれかのランナーが期待しない終了コードを返した場合、このシステムは SHALL 後続ランナーの実行を即時中断し、失敗したランナーの `name` を含むエラーメッセージを stderr に出力し、非ゼロの終了コードで終了する。このとき証跡ファイルは MUST NOT 保存する。

#### Scenario: 先行ランナー失敗時に後続ランナーは実行されない
- GIVEN `test.runners` に宣言順で `[{name: "backend", ...}, {name: "frontend", ...}]` が定義されている
- WHEN `mspec test --expect-green T001` を実行し、`backend` ランナーが expect_red_on_exit に含まれる exit code で終了する
- THEN CLI は `frontend` ランナーを実行しない
- AND stderr に `runner "backend" failed with exit code <N>` 相当のメッセージが出力される
- AND `.mspec/cache/green-evidence/` に証跡ファイルは作成されない

### Requirement: FR-013 — `test.runners` 未指定時の後方互換フォールバック

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

`test.runners` 配列が `.mspec/config.yaml` の `test` セクションに存在しない場合、このシステムは SHALL 既存の `test.command` を単一ランナーとして扱い、FR-001〜FR-009 と同一の挙動を維持する。`runners` キーが存在しないことによるエラーや警告を出力してはならない。

#### Scenario: runners 未設定のプロジェクトで既存動作が維持される
- GIVEN `.mspec/config.yaml` に `test.runners` が存在せず `test.command: "npm test"` のみ設定されている
- WHEN `mspec test --expect-red T001` を実行する
- THEN FR-001 と同一の挙動を示す（単一コマンドを実行し red 証跡を保存する）
- AND `runners` 不在に起因するエラーや警告は出力されない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->

<!-- LEARNING: runners 配列導入時は既存証跡命名規則（FR-008依存）を壊さないよう、per-runner証跡ではなく単一ファイル+payload拡張で対応するパターンが有効 | source: FR-011 | confidence: high -->
