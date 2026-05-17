---
doc_type: Reference
---

# Tasks: Diátaxis Artifact Structure

## Phase 1: Setup

- [ ] T001 [P] 既存テストスナップショットの事前確認 — `mspec delta init` が `MUST` を出力することをアサートするテストを特定する — files: `packages/cli/tests/`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/cli-delta-spec/spec.md
        Requirements implemented: FR-011
        Change: diataxis-artifact-structure

- [ ] T002 [P] `mspec new` の E2E テストが `readme.md` のみを検証しているか確認 — `continue-envelope.e2e.test.ts` を調査し、`glossary.md` 追加による破損リスクを把握する — files: `packages/cli/tests/`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-003
        Change: diataxis-artifact-structure

## Phase 2: Foundational

- [ ] T010 [P] 全成果物テンプレートに `doc_type:` フロントマターを追加 — 各ファイルの冒頭に `---\ndoc_type: <type>\n---` ブロックを追加する — files: `packages/cli/templates/artifacts/proposal.md`, `packages/cli/templates/artifacts/research.md`, `packages/cli/templates/artifacts/design.md`, `packages/cli/templates/artifacts/tasks.md`, `packages/cli/templates/artifacts/checklist.md`, `packages/cli/templates/artifacts/quickstart.md`, `packages/cli/templates/artifacts/architecture-overview.md`, `packages/cli/templates/artifacts/readme.md`, `packages/cli/templates/artifacts/delta-spec.md`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-001, FR-002
        Change: diataxis-artifact-structure

- [ ] T011 [P] `glossary.md` テンプレートを新規作成 — `doc_type: Reference`・`## Terms` セクションを含む雛形を作成する — files: `packages/cli/templates/artifacts/glossary.md`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-001, FR-003
        Change: diataxis-artifact-structure

- [ ] T012 [P] `memory/constitution.md` に RFC 2119 キーワードセマンティクスを追記 — `## Additional Constraints` 配下に「SHALL = 機能要件、MUST = 制約/安全要件、SHOULD = 推奨」の判定基準を追加する — files: `memory/constitution.md`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/claude-integration/spec.md
        Requirements implemented: FR-010
        Change: diataxis-artifact-structure

## Phase 3: User Story 1 — artifact-taxonomy FR-001/FR-002 (doc_type frontmatter)

### Tests-first (E2E)

- [ ] T101 E2E for FR-001 "proposal.md template contains doc_type frontmatter" — `packages/cli/templates/artifacts/` 配下の全テンプレートが有効な `doc_type:` フロントマターを持つことを検証するテスト — files: `packages/cli/tests/artifact-taxonomy/doc-type-frontmatter.test.ts`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-001, FR-002
        Change: diataxis-artifact-structure

### Implementation

- [ ] T102 T010 の完了を確認 — T010 が全テンプレートに doc_type を追加済みであることを検証する（T101 E2E が green になることを確認） — files: `packages/cli/templates/artifacts/`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-001, FR-002
        Change: diataxis-artifact-structure

## Phase 3: User Story 2 — artifact-taxonomy FR-003 (glossary.md auto-generation)

### Tests-first (E2E)

- [ ] T110 E2E for FR-003 "glossary.md is present in a newly created change directory" — `mspec new <feature>` を実行して `changes/<name>/glossary.md` が生成され、`## Terms` セクションと `doc_type: Reference` フロントマターを持つことを検証する — files: `packages/cli/tests/artifact-taxonomy/glossary-auto-gen.test.ts`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-003
        Change: diataxis-artifact-structure

- [ ] T111 E2E for FR-003 Scenario 2 "research.md template refers to glossary.md" — `research.md` テンプレートに `glossary.md` への参照が含まれることを検証する — files: `packages/cli/tests/artifact-taxonomy/glossary-auto-gen.test.ts`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-003
        Change: diataxis-artifact-structure

### Implementation

- [ ] T112 `new.ts` に `glossary.md` 自動生成を追加 — `buildGlossary()` 関数を追加し、`newCommand()` から呼び出す — files: `packages/cli/src/commands/new.ts`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-003
        Change: diataxis-artifact-structure

- [ ] T113 `buildReadme()` の `## Artifacts` リストに `glossary.md` を追加 — `new.ts` の `buildReadme()` のチェックリストに `- [ ] glossary.md` を追記する — files: `packages/cli/src/commands/new.ts`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-003
        Change: diataxis-artifact-structure

- [ ] T114 `research.md` テンプレートに `glossary.md` 参照コメントを追加 — FR-003 Scenario 2 対応。テンプレート本文に「用語定義は `glossary.md` を参照」旨のコメントまたはリンクを追加する — files: `packages/cli/templates/artifacts/research.md`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-003
        Change: diataxis-artifact-structure

## Phase 3: User Story 3 — cli-delta-spec FR-011 (SHALL keyword default)

### Tests-first (E2E)

- [ ] T120 E2E for FR-011 "Default stub uses SHALL keyword" — `mspec delta init --capability <name>` の出力で ADDED スタブが `The system SHALL <behavior>.` になることを検証する（既存テストが `MUST` をアサートしている場合は先に修正） — files: `packages/cli/tests/cli-delta-spec/delta-init-shall.test.ts`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/cli-delta-spec/spec.md
        Requirements implemented: FR-011
        Change: diataxis-artifact-structure

### Implementation

- [ ] T121 `delta-init.ts` の `buildDeltaSkeleton()` を修正 — 行 69 の `The system MUST <behavior>.` を `The system SHALL <behavior>.` に変更する — files: `packages/cli/src/commands/delta-init.ts`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/cli-delta-spec/spec.md
        Requirements implemented: FR-011
        Change: diataxis-artifact-structure

- [ ] T122 `delta-spec.md` テンプレートの ADDED スタブも `SHALL` に更新 — 参照用テンプレートを実装と一致させる — files: `packages/cli/templates/artifacts/delta-spec.md`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/cli-delta-spec/spec.md
        Requirements implemented: FR-011
        Change: diataxis-artifact-structure

## Phase 3: User Story 4 — claude-integration FR-010 (SKILL.md EARS+Scenario updates)

### Tests-first (E2E)

- [ ] T130 E2E for FR-010 "mspec-delta skill prompt references EARS format and keyword semantics" — `.claude/skills/mspec-delta/SKILL.md` の Procedure 節に `SHALL`/`MUST`/`SHOULD` の使い分けと Scenario 必須の記述が含まれることを検証する — files: `packages/cli/tests/claude-integration/skill-ears-guidance.test.ts`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/claude-integration/spec.md
        Requirements implemented: FR-010
        Change: diataxis-artifact-structure

### Implementation

- [ ] T131 `.claude/skills/mspec-delta/SKILL.md` を更新 — Procedure step 4 に EARS 5 パターン・SHALL/MUST/SHOULD 使い分けの明示的指示と Scenario 必須要件を追加する — files: `.claude/skills/mspec-delta/SKILL.md`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/claude-integration/spec.md
        Requirements implemented: FR-010
        Change: diataxis-artifact-structure

- [ ] T132 `.claude/skills/mspec-proposal/SKILL.md` を更新 — Capabilities 記述ステップに「後続 delta ステップで EARS+Scenario 形式が適用される」注記を追加する — files: `.claude/skills/mspec-proposal/SKILL.md`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/claude-integration/spec.md
        Requirements implemented: FR-010
        Change: diataxis-artifact-structure

- [ ] T133 `.claude/skills/mspec-design/SKILL.md` を更新 — Procedure step 3 に「design.md の受け入れ基準を Delta Spec の Scenario と対応付ける」指示を追加する — files: `.claude/skills/mspec-design/SKILL.md`
      anchor:
        @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/claude-integration/spec.md
        Requirements implemented: FR-010
        Change: diataxis-artifact-structure

## Phase 4: Polish

- [ ] T201 [P] 全テストスイートを実行してリグレッションがないことを確認 — `npm test` を実行し、T001/T002 で特定したリスクが顕在化していないことを検証する — files: `packages/cli/`

- [ ] T202 [P] `mspec validate --change` が全成果物に対してパスすることを確認 — files: `changes/2026-05-14-063708-diataxis-artifact-structure/`

- [ ] T203 [P] `mspec anchor check --change 2026-05-14-063708-diataxis-artifact-structure` を実行 — FR-001〜FR-003、FR-010、FR-011 の全 FR が少なくとも 1 つのアンカーブロックに紐付くことを検証する

## Dependencies

- T101 blocks T102
- T110 blocks T112, T113, T114
- T111 blocks T112, T113, T114
- T120 blocks T121, T122
- T001 must be done before T120 (snapshot fix が先)
- T002 must be done before T112 (workflow engine regression の把握が先)
- T130 blocks T131, T132, T133

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | tasks.md は design.md・checklist.md のみを入力とし、他ステップと独立している |
| II. 決定論的マージ | ✅ | anchor ブロックは実装ファイルのコメントとして書かれ、archive パーサーに影響しない |
| III. 質問駆動の要件確定 | ✅ | 全 Open Questions は research/design で解決済み。tasks に未解決事項なし |
| IV. 双方向アンカー | ✅ | 全実装・E2E タスクに `@mspec-delta` アンカーブロックを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | `workflow.yaml` の強制ステップ定義に触れない |

### Complexity Tracking

None
