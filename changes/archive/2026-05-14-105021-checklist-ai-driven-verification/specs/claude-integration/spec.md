# Delta Spec: claude-integration

## ADDED Requirements

### Requirement: FR-011 — checklist-auditor annotates each item with verify metadata

When the `mspec-checklist-auditor` subagent generates `checklist.md`, the system SHALL annotate each checklist item with exactly one of: `<!-- verify: fr-NNN -->` when the item is automatically verifiable by the E2E tests that implement the corresponding FR, or `<!-- verify: human -->` when the item requires human judgment (e.g., Constitution compliance, design assessment, or external observation).

#### Scenario: AI-verifiable item receives FR reference annotation
- GIVEN `mspec-checklist-auditor` が `checklist.md` を生成している
- WHEN あるチェックリスト項目が Delta Spec の特定の FR（例: `fr-011`）の E2E シナリオによって検証可能である
- THEN その項目の末尾に `<!-- verify: fr-011 -->` というインラインコメントが付与される
- AND 1 項目に付与される `verify:` アノテーションは 1 つである

#### Scenario: Human-review item receives human annotation
- GIVEN `mspec-checklist-auditor` が `checklist.md` を生成している
- WHEN あるチェックリスト項目が Constitution 準拠・設計判断・外部観察など自動検証できない性質のものである
- THEN その項目の末尾に `<!-- verify: human -->` というインラインコメントが付与される

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
