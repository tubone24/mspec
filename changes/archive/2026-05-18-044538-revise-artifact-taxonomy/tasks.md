---
doc_type: Reference
---

# Tasks: revise-artifact-taxonomy

> Tests-first 原則: 各 Scenario について **E2E タスク → 実装タスク** の順。E2E が red で落ちることを `mspec test` で記録してから実装で green に倒す。
> 関連参照: `design.md` Decisions D1–D6 + Self-Review (Important #1–#3, Minor #4–#5), `checklist.md` Risk Highlights #1–#5。

## Phase 1: Setup

- [x] T001 [P] 既存 E2E ベースラインを green で確認（改訂前の状態を保証） — files: `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts`, `packages/cli/tests/e2e/template-doc-type-invariant.e2e.test.ts`
      実行: `pnpm --filter @mspec/cli test:e2e -t "artifact-taxonomy-doc-type"` および `-t "template-doc-type-invariant"` が共に green。
- [x] T002 本 change の Delta Spec / design Decision 1-6 / Self-Review Important #1-#3 を再読し、影響範囲（4 capability × 9 FR）の対応表をローカルメモ化 — files: `changes/2026-05-18-044538-revise-artifact-taxonomy/{design.md,checklist.md,specs/*/spec.md}`

## Phase 2: Foundational（テンプレ・ワークフロー基盤）

- [x] T010 `workflow.default.yaml` の `design` ステップ `produces` を `[design.md, design-rationale.md, architecture-overview.md]` に拡張 — files: `packages/cli/templates/workflow.default.yaml`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-022
        Change: revise-artifact-taxonomy

- [x] T011 [P] `design-rationale.ja.md` を新規作成（frontmatter `doc_type: Explanation`、章立て: `## Context` / `## Decisions` / `## Alternatives Considered` / `## Trade-offs` / `## Rejected Options` / `## Constitution Check`、冒頭に `<!-- See also: ./design.md -->` コメント） — files: `packages/cli/templates/artifacts/design-rationale.ja.md`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-006
        Change: revise-artifact-taxonomy

- [x] T012 [P] `design-rationale.en.md` を新規作成（T011 の英語版、見出しと本文を locale-invariant に） — files: `packages/cli/templates/artifacts/design-rationale.en.md`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-006
        Change: revise-artifact-taxonomy

- [x] T013 `tasks.{ja,en}.md` の frontmatter を `doc_type: Reference` → `doc_type: AI-Internal` に変更 — files: `packages/cli/templates/artifacts/tasks.ja.md`, `packages/cli/templates/artifacts/tasks.en.md`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-001, FR-004
        Change: revise-artifact-taxonomy

- [x] T014 `readme.{ja,en}.md` の frontmatter を `doc_type: Reference` → `doc_type: Tutorial` に変更、`## Artifacts` リストに `- [ ] design-rationale.md` を追加、ファイル末尾に `## Summary (Lessons / Next Steps)` セクション + プレースホルダコメント `<!-- archive ステップで AI が生成 -->` を追加 — files: `packages/cli/templates/artifacts/readme.ja.md`, `packages/cli/templates/artifacts/readme.en.md`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-005
        Change: revise-artifact-taxonomy

- [x] T015 `design.{ja,en}.md` から `## Decisions` セクションを削除し純 Reference 化、冒頭に `<!-- See also: ./design-rationale.md for採用理由・代替案 -->` コメントを追加（research OC3） — files: `packages/cli/templates/artifacts/design.ja.md`, `packages/cli/templates/artifacts/design.en.md`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-006
        Change: revise-artifact-taxonomy

- [x] T016 `buildReadmeFallback` (`packages/cli/src/commands/new.ts:106-132`) の `## Artifacts` 列挙に `- [ ] design-rationale.md` を追加、fallback readme 末尾に `## Summary (Lessons / Next Steps)` プレースホルダを付与（**checklist Risk #3 / Self-Review 該当**） — files: `packages/cli/src/commands/new.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-005
        Change: revise-artifact-taxonomy

## Phase 3: User Story

> 各 User Story は **Tests-first**。E2E タスクが red で落ちることを `mspec test red` で記録 → 実装タスクで green に倒す → `mspec test green` で記録。

### User Story 1 — doc_type 体系を 5 種に拡張する (P1)

#### Tests-first (E2E)

- [x] T100 E2E for **artifact-taxonomy FR-001 Scenario "design-rationale.md template contains doc_type frontmatter"** — `EXPECTED_DOC_TYPES` 表に `'design-rationale.ja.md': 'Explanation'` / `'design-rationale.en.md': 'Explanation'` を追加し、テンプレ frontmatter が `doc_type: Explanation` であることを assert — files: `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-001
        Change: revise-artifact-taxonomy

- [x] T101 E2E for **artifact-taxonomy FR-001 Scenario "tasks.md template declares AI-Internal"** + **FR-004** — `EXPECTED_DOC_TYPES['tasks.{ja,en}.md']` を `'AI-Internal'` に変更し、テンプレ frontmatter が一致することを assert — files: `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-001, FR-004
        Change: revise-artifact-taxonomy

- [x] T102 E2E for **artifact-taxonomy FR-005 Scenario "新規 change の readme は Tutorial 型で雛型まとめセクションを持つ"** — `EXPECTED_DOC_TYPES['readme.{ja,en}.md']` を `'Tutorial'` に変更、加えて `mspec new <feature>` 直後の readme.md 末尾に `## Summary (Lessons / Next Steps)` セクションとプレースホルダコメント `<!-- archive ステップで AI が生成 -->` が存在することを assert — files: `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts`, 新規 `packages/cli/tests/e2e/readme-tutorial-summary.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-005
        Change: revise-artifact-taxonomy

- [x] T103 E2E for **artifact-taxonomy FR-002 Scenario "Valid doc_type values are the five types defined in FR-001"** — `VALID_DOC_TYPES` 配列に `'AI-Internal'` を追加し、全テンプレが 5 種いずれかに該当することを assert。describe / it 文字列の `"four Diátaxis types"` を `"five doc types (Diátaxis + AI-Internal)"` 系に改訂 — files: `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-002
        Change: revise-artifact-taxonomy

- [x] T104 E2E for **artifact-taxonomy FR-002 Scenario "Invalid doc_type values are rejected by validate"** + **cli-spec-lint FR-015 Scenario "列挙外の doc_type は validate が拒否する"** — テンポラリ change ディレクトリ内に `doc_type: Mixed` を含むテンプレを配置し、`mspec validate --change <id>` が非ゼロ終了し標準出力に `Mixed is not a valid doc_type; allowed: Reference, Explanation, How-to, Tutorial, AI-Internal` を含むことを assert — files: 新規 `packages/cli/tests/e2e/doc-type-enforcement.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-spec-lint/spec.md
        Requirements implemented: FR-015
        Change: revise-artifact-taxonomy

- [x] T105 E2E for **cli-spec-lint FR-015 Scenario "AI-Internal を宣言したテンプレートが validate を通る"** — `doc_type: AI-Internal` を宣言したテンプレで `mspec validate` がエラー報告せず成功（exit 0）することを assert — files: `packages/cli/tests/e2e/doc-type-enforcement.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-spec-lint/spec.md
        Requirements implemented: FR-015
        Change: revise-artifact-taxonomy

- [x] T106 E2E for **cli-spec-lint FR-015 Scenario "doc_type フィールド欠落は引き続きエラー"** — frontmatter に `doc_type:` が無いテンプレで `mspec validate` がエラー報告し非ゼロ終了することを assert（既存挙動の回帰防止） — files: `packages/cli/tests/e2e/doc-type-enforcement.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-spec-lint/spec.md
        Requirements implemented: FR-015
        Change: revise-artifact-taxonomy

- [x] T107 [P] (任意) E2E for `template-doc-type-invariant.e2e.test.ts` に「AI-Internal 識別子も locale-invariant」テストを 1 件追加（research D5 / Self-Review Minor #2） — files: `packages/cli/tests/e2e/template-doc-type-invariant.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-spec-lint/spec.md
        Requirements implemented: FR-015
        Change: revise-artifact-taxonomy

#### Implementation

- [x] T110 **Self-Review Important #1 対応** — `packages/cli/src/lib/artifact-validator.ts`（または必要に応じて `packages/cli/src/commands/validate.ts`）に **doc_type 値 enforcement ルールを新規追加**。許容値集合 `['Reference', 'Explanation', 'How-to', 'Tutorial', 'AI-Internal']` を単一定数として export し、artifact / template の frontmatter `doc_type` がこの集合に含まれない場合、`<value> is not a valid doc_type; allowed: Reference, Explanation, How-to, Tutorial, AI-Internal` 形式で error 報告し非ゼロ終了。T104/T105/T106 が green に倒れる — files: `packages/cli/src/lib/artifact-validator.ts`, `packages/cli/src/commands/validate.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-spec-lint/spec.md
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: cli-spec-lint/FR-015, artifact-taxonomy/FR-001, artifact-taxonomy/FR-002
        Change: revise-artifact-taxonomy

- [x] T111 T100–T103 を green にする — Phase 2 の T011–T015 のテンプレ更新で `EXPECTED_DOC_TYPES` / `VALID_DOC_TYPES` の新マッピングが green になることを確認 — files: テンプレ群（変更済み）, テスト群（T100-T103）
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-001, FR-002, FR-004, FR-005
        Change: revise-artifact-taxonomy

### User Story 2 — design ステップで 2 ファイル必須生成する (P1)

#### Tests-first (E2E)

- [x] T120 E2E for **cli-workflow-engine/FR-022 Scenario "design ステップの produces は両ファイルを列挙する"** — テンポラリ change ディレクトリで `mspec status --change <id> --json` を実行し、`steps[].id === 'design'` の `produces` 配列に `design.md` と `design-rationale.md` の両方が含まれることを assert — files: 新規 `packages/cli/tests/e2e/design-two-files.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-022
        Change: revise-artifact-taxonomy

- [x] T121 E2E for **cli-workflow-engine/FR-022 Scenario "design-rationale.md 欠落で validate が fail する"** + **claude-integration/FR-022 Scenario "design-rationale.md 欠落時は skill が再実行を促す"** — `design.md` のみ生成された change で `mspec validate` が blocker（design-rationale.md 欠落）を報告し非ゼロ終了、加えて `mspec continue --json` の `next_action` が `validate_failed` を返すことを assert — files: `packages/cli/tests/e2e/design-two-files.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-workflow-engine/spec.md
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/claude-integration/spec.md
        Requirements implemented: cli-workflow-engine/FR-022, claude-integration/FR-022
        Change: revise-artifact-taxonomy

- [x] T122 E2E for **cli-workflow-engine/FR-022 Scenario "design ステップ完了判定は両ファイル存在が必要"** — `design.md` のみで `mspec continue --json` の `current_step` が `design` のままで `next_action` が `validate_failed` または `execute` を返すことを assert — files: `packages/cli/tests/e2e/design-two-files.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-022
        Change: revise-artifact-taxonomy

- [x] T123 E2E for **claude-integration/FR-022 Scenario "design ステップ完了時に両ファイルが揃う"** — design ステップ完了状態（両ファイル + Constitution Check）の change で `mspec validate` が green、`mspec status` が `design` を `done` と判定することを assert — files: `packages/cli/tests/e2e/design-two-files.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/claude-integration/spec.md
        Requirements implemented: FR-022
        Change: revise-artifact-taxonomy

#### Implementation

- [x] T130 `mspec-design` SKILL.md を改訂（template + runtime の **両方**）。Procedure step 3 を 2 ステップに分割: (3) `design.md` を Reference として書く、(3a) `design-rationale.md` を Explanation として書く。step 5 で両ファイルに Constitution Check（Phase 0/1 両列）を埋める。step 7a の readme 更新を `design.md / design-rationale.md / architecture-overview.md` の 3 ファイル対応に — files: `packages/cli/templates/claude/skills/mspec-design/SKILL.md`, `.claude/skills/mspec-design/SKILL.md`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/claude-integration/spec.md
        Requirements implemented: FR-022
        Change: revise-artifact-taxonomy

### User Story 3 — archive ステップで readme Summary を AI 記述する (P1)

#### Tests-first (E2E)

- [x] T140 E2E for **claude-integration/FR-023 Scenario "archive 後に readme まとめが埋まる"** — archive 完了状態をシミュレートした change で `readme.md` 末尾の `## Summary (Lessons / Next Steps)` の下に `### Lessons` と `### Next Steps` の両見出し + 本文 bullet が存在することを assert（Lessons 3-5 bullet / Next Steps 2-4 bullet / 全体 30 行・1,500 字以内、Decision 3 の制約） — files: 新規 `packages/cli/tests/e2e/archive-summary.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/claude-integration/spec.md
        Requirements implemented: FR-023
        Change: revise-artifact-taxonomy

- [x] T141 E2E for **claude-integration/FR-023 Scenario "archive 時に Summary 欠落のままでは validate fail"** — `## Summary (Lessons / Next Steps)` セクションがプレースホルダコメント `<!-- archive ステップで AI が生成 -->` のみの状態で `mspec validate --change <id>` が warning（既定）または `--strict` 時 error を報告することを assert（research OC1 / OC2、Self-Review Important #2） — files: `packages/cli/tests/e2e/archive-summary.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/claude-integration/spec.md
        Requirements implemented: FR-023
        Change: revise-artifact-taxonomy

#### Implementation

- [x] T150 `mspec-archive` SKILL.md を改訂（template + runtime の **両方**）。既存 step 3（マージ検証）と step 4（archive 移動 `mv`）の間に **step 3b**「当該 change の diff・確定 Delta Spec・research D1-D6 を読み、`readme.md` 末尾の `## Summary (Lessons / Next Steps)` を `### Lessons`（3-5 bullet, 1-2 行/bullet）+ `### Next Steps`（2-4 bullet, 1 行 + 関連 FR-ID）で埋める（全体 30 行・1,500 字以内）。プレースホルダコメントを削除」を **正しい順序で挿入**（Self-Review Minor #5 / checklist Risk #4 — `mv` 前に readme 更新を完了させる） — files: `packages/cli/templates/claude/skills/mspec-archive/SKILL.md`, `.claude/skills/mspec-archive/SKILL.md`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/claude-integration/spec.md
        Requirements implemented: FR-023
        Change: revise-artifact-taxonomy

- [x] T151 **Self-Review Important #2 対応** — `packages/cli/src/lib/artifact-validator.ts` に `readme.md` 末尾 Summary プレースホルダ残存検知ルールを追加（**warning 既定**、`--strict` 指定時に error 昇格）。実装パスとして既存 `--strict` フラグの取り回しを確認し、無ければ T110 と同時に最小実装。T141 が green に倒れる — files: `packages/cli/src/lib/artifact-validator.ts`, `packages/cli/src/commands/validate.ts`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/claude-integration/spec.md
        Requirements implemented: FR-023
        Change: revise-artifact-taxonomy

## Phase 4: Polish

- [x] T200 **Self-Review Important #3 対応** — `checklist.md` の `<!-- verify: fr-022 -->` を `<!-- verify: claude-integration/fr-022 -->` および `<!-- verify: cli-workflow-engine/fr-022 -->` のように **capability prefix 付き** に正規化する。`mspec-implement` 側のアノテーション parser が `/` を許容しない場合は片方 FR を再採番（例: `cli-workflow-engine` 側を `FR-023` に振り直し、Delta Spec spec.md も同時改訂）して衝突解消 — files: `changes/2026-05-18-044538-revise-artifact-taxonomy/checklist.md`, （必要なら）`changes/2026-05-18-044538-revise-artifact-taxonomy/specs/cli-workflow-engine/spec.md`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-022
        Change: revise-artifact-taxonomy

- [x] T201 **Self-Review Minor #4 対応** — `checklist.md:21` の `<!-- verify: human -->` 確認対象を「design.md Decision 6 / design-rationale.md（後続 change で生成）」と明示するコメントを追加。bootstrap paradox により本 change では `design-rationale.md` が不在のため Decision 6 への verify アンカーが代替であることを明文化 — files: `changes/2026-05-18-044538-revise-artifact-taxonomy/checklist.md`
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-002
        Change: revise-artifact-taxonomy

- [x] T202 全 E2E テスト一括実行で green 確認 — `pnpm --filter @mspec/cli test:e2e` 全件 green、特に `artifact-taxonomy-doc-type` / `template-doc-type-invariant` / 新規 `doc-type-enforcement` / `design-two-files` / `archive-summary` / `readme-tutorial-summary` の 6 系統 — files: 全 E2E
      anchor:
        @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/cli-spec-lint/spec.md
        Requirements implemented: FR-015
        Change: revise-artifact-taxonomy

- [x] T203 TDD red→green 証拠を記録 — 各 E2E タスク（T100-T107, T120-T123, T140-T141）について `mspec test red <task-id>` と `mspec test green <task-id>` を実行し、red→green 遷移を記録 — files: なし（CLI コマンドのみ）

- [x] T204 archive 完了直後に起票するための **後続 change メモ** をローカルに残す（research OC5 / Decision 6）— `mspec new rename-fr-002-doc-type-title` を実行する旨を本 change の archive 後 readme Summary に Next Steps として記述 — files: 後続 change のみ（本 change の readme は archive 時に自動更新）

## Dependencies

- T001 / T002 は Phase 1 で完了、以降に block を作らない。
- T010 (workflow.yaml 改訂) は T120-T123 (cli-workflow-engine FR-022 関連 E2E) の前提。
- T011, T012 (design-rationale テンプレ新規) は T100 (FR-001 design-rationale E2E) の前提。
- T013, T014, T015 (テンプレ frontmatter 改訂) は T100-T103 (artifact-taxonomy FR-001/002/004/005 E2E) の前提。
- T016 (buildReadmeFallback 改訂) は T102 (readme-tutorial-summary E2E) の前提。
- T100-T107 (E2E) は T110, T111 (implement) の前。
- T120-T123 (E2E) は T130 (mspec-design SKILL 改訂) の前。
- T140-T141 (E2E) は T150 (mspec-archive SKILL 改訂) と T151 (validator ルール) の前。
- T200 (verify アノテーション正規化) と T201 (Decision 6 アンカー明示) は他全タスクと独立 [P]。
- T202 (全 E2E green) は T110, T111, T130, T150, T151, T200, T201 完了後。
- T203 (TDD 証拠記録) は各 E2E タスクと並走（red 記録 → 実装 → green 記録）。

## Constitution Check

> Step: tasks | Constitution Version: current

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ⚠️ | — | `archive` の readme.md 編集（T150）と Phase 2 のテンプレ改訂は同一 change 内に閉じている。design.md Phase 1 で ✅ 格上げ済み（同一観点を tasks でも保持）。 |
| II. 決定論的マージ | ✅ | — | Delta Spec マージ仕様は無変更。T200 で FR 番号衝突解消を行うのみで、マージ仕様自体には触らない。 |
| III. 質問駆動の要件確定 | ✅ | — | tasks 段階で新たな質問は不要。Self-Review Important #1-#3 / Minor #4-#5 を明示タスク化し、design Decisions D1-D6 を直接アンカー。 |
| IV. 双方向アンカー | ✅ | — | 全実装/E2E タスクに 3 行 anchor ブロックを付与、`@mspec-delta` で Delta Spec spec.md を参照、`Requirements implemented:` で FR-ID を列挙、`Change:` で change kebab を明示。capability 衝突回避は T200 で実施。 |
| V. 強制ステップと拡張ステップの分離 | ⚠️ | — | T130（design 2 ファイル強制）と T150（archive Summary 強制）は強制ステップ範囲を拡大する。design.md Phase 1 で ⚠️ 保持と整合。軽量モード時の自動スキップに依存。 |

### Complexity Tracking

⚠️ 2 件（原則 I, V）はいずれも design.md Phase 0/1 評価を踏襲。tasks 段階での追加 complexity は次の 2 点:

- T110 / T151 で `artifact-validator.ts` に CLI 側 enforcement ルールを **2 種追加**（doc_type 値検査 + readme Summary プレースホルダ検査）。これは Self-Review Important #1/#2 で「design Decision 5 / Project Structure の test-only 範囲を超える」と判定された追加実装で、Delta Spec FR-015 Scenario 2 と FR-023 Scenario 2 の文言要求を満たすために不可避。
- T200 で `verify:` アノテーションの capability prefix 化または FR 再採番を選択する分岐があり、`mspec-implement` parser の仕様確認が前提となる。parser が prefix 非対応の場合は cli-workflow-engine FR-022 を FR-023 に再採番する作業（Delta Spec spec.md + checklist の同時改訂）が追加発生する。
