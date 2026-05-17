# Delta Spec: cli-done-log

## ADDED Requirements

### Requirement: FR-001 — mspec done コマンドによる done-log.json へのupsert記録

When the user executes `mspec done <step-id> --change <change-dir>`, the system SHALL upsert an entry (overwrite if exists) in `.mspec/cache/done-log.json` recording the step-id and ISO 8601 timestamp.

#### Scenario: implement ステップを done に記録する
- GIVEN `.mspec/cache/done-log.json` が存在しない、または当該 change の `implement` エントリが存在しない
- WHEN ユーザーが `mspec done implement --change 2026-05-14-XXXXXX-my-feature` を実行する
- THEN `.mspec/cache/done-log.json` に `{ "2026-05-14-XXXXXX-my-feature": { "implement": { "done_at": "<ISO8601>" } } }` エントリが上書き保存される

#### Scenario: 同一ステップへの 2 回目実行（idempotency）
- GIVEN `.mspec/cache/done-log.json` に `implement` エントリがすでに存在する
- WHEN ユーザーが `mspec done implement` を再度実行する
- THEN タイムスタンプが新しい値で上書きされ、エラーは発生しない

### Requirement: FR-002 — done-log.json のスキーマ

The `.mspec/cache/done-log.json` SHALL store a nested object keyed first by change name and then by step-id, with a `done_at` (ISO 8601 string) field. The schema MUST be symmetric with `skip-log.json` for consistent tooling.

#### Scenario: skip-log.json との対称的な構造
- GIVEN `skip-log.json` が `{ changeName: { stepId: { reason, skipped_at } } }` のネストオブジェクト形式を持つ
- WHEN `done-log.json` が生成される
- THEN `{ "2026-05-14-XXXXXX-my-feature": { "implement": { "done_at": "2026-05-14T13:19:06Z" } } }` のようなネストオブジェクト形式になる

### Requirement: FR-003 — 対象ステップが produces レスでない場合のガード

If the user executes `mspec done <step-id>` for a step that has non-empty `produces`, then the system SHALL reject the command with an error message indicating that `mspec done` is only valid for produce-less steps.

#### Scenario: produces を持つステップへの誤用
- GIVEN ユーザーが `mspec done proposal` を実行する（`proposal` は `produces: [proposal.md]`）
- WHEN コマンドが実行される
- THEN エラー `"mspec done は produces が空のステップにのみ使用できます"` が表示され、`done-log.json` は更新されない

### Requirement: FR-004 — implement ステップの done 遷移前バリデーション

When the user executes `mspec done implement`, the system SHALL invoke `mspec validate` internally to verify anchor / E2E / TDD evidence before writing to `done-log.json`. If validation fails, the command SHALL exit with an error and `done-log.json` SHALL NOT be updated.

#### Scenario: implement ステップの done 前バリデーション（正常系）
- GIVEN `mspec validate` がアンカー/E2E/TDD 証跡の検証に成功する
- WHEN ユーザーが `mspec done implement` を実行する
- THEN `done-log.json` に `implement` エントリが保存される

#### Scenario: implement ステップの done 前バリデーション（異常系）
- GIVEN `mspec validate` がアンカー不足等でエラーを返す
- WHEN ユーザーが `mspec done implement` を実行する
- THEN エラーメッセージが表示され、`done-log.json` は更新されない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
