# Delta Spec: claude-integration

## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
