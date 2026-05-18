---
doc_type: Reference
---

# Tasks: fix-locale-spec-language

## Phase 1: Setup

- [x] T001 [P] ベースライン確認 — 既存テストが全てグリーンであることを確認する — files: `packages/cli/src/`, `packages/cli/tests/`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/language-config/spec.md
        Requirements implemented: FR-005
        Change: fix-locale-spec-language

---

## Phase 2: Foundational（D-1/D-2 — CLI コマンドへの locale フィールド追加）

### Tests-first (Unit)

- [x] T010 Unit test: `statusCommand` が `locale: ja` 設定時に JSON 出力に `"locale": "ja"` を含むことを検証 — files: `packages/cli/src/commands/status.test.ts`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/language-config/spec.md
        Requirements implemented: FR-005
        Change: fix-locale-spec-language

- [x] T011 Unit test: `statusCommand` が config.yaml 欠損時に `"locale": "ja"`（DEFAULT_LOCALE）を含むことを検証 — files: `packages/cli/src/commands/status.test.ts`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/language-config/spec.md
        Requirements implemented: FR-005
        Change: fix-locale-spec-language

- [x] T012 Unit test: `continueCommand` が JSON 出力に `"locale": "ja"` を含むことを検証 — files: `packages/cli/src/commands/continue.test.ts`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/language-config/spec.md
        Requirements implemented: FR-006
        Change: fix-locale-spec-language

### Implementation

- [x] T013 D-1: `packages/cli/src/commands/status.ts` に `loadConfig` 呼び出しを追加し、JSON 出力を `{ ...status, locale }` に変更する — files: `packages/cli/src/commands/status.ts`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/language-config/spec.md
        Requirements implemented: FR-005
        Change: fix-locale-spec-language

- [x] T014 D-2: `packages/cli/src/commands/continue.ts` の `ContinueOutput` interface に `locale: string` を追加し、`continueCommand` で `loadConfig` から locale を取得して `buildContinue` に渡す — files: `packages/cli/src/commands/continue.ts`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/language-config/spec.md
        Requirements implemented: FR-006
        Change: fix-locale-spec-language

---

## Phase 3: User Story 1 — artifact-templates-i18n FR-005（テンプレートバリアント追加・レガシー削除）

### Tests-first (E2E)

- [x] T101 E2E for FR-005 "locale=ja で mspec new 実行時に missing template 警告なし" — `mspec new` 実行後の stderr に "missing template" が含まれないことを検証 — files: `packages/cli/tests/e2e/artifact-templates-i18n-ja.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-005
        Change: fix-locale-spec-language

- [x] T102 E2E for FR-005 "locale=en で mspec new 実行時に missing template 警告なし" — files: `packages/cli/tests/e2e/artifact-templates-i18n-en.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-005
        Change: fix-locale-spec-language

### Implementation

- [x] T103 D-3a: 9種アーティファクトの `.ja.md` テンプレートを作成する — `readme.ja.md`, `glossary.ja.md`, `proposal.ja.md`, `research.ja.md`, `design.ja.md`, `architecture-overview.ja.md`, `quickstart.ja.md`, `checklist.ja.md`, `tasks.ja.md` — files: `packages/cli/templates/artifacts/`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-005
        Change: fix-locale-spec-language

- [x] T104 D-3b: 9種アーティファクトの `.en.md` テンプレートを作成する — `readme.en.md`, `glossary.en.md`, `proposal.en.md`, `research.en.md`, `design.en.md`, `architecture-overview.en.md`, `quickstart.en.md`, `checklist.en.md`, `tasks.en.md` — files: `packages/cli/templates/artifacts/`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-005
        Change: fix-locale-spec-language

- [x] T105 D-3c: 9種のレガシー `.md` テンプレートを削除する（T103 と T104 が完了後） — `readme.md`, `glossary.md`, `proposal.md`, `research.md`, `design.md`, `architecture-overview.md`, `quickstart.md`, `checklist.md`, `tasks.md` — files: `packages/cli/templates/artifacts/`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-005
        Change: fix-locale-spec-language

---

## Phase 3: User Story 2 — claude-integration FR-021（SKILL.md EARS パターン locale 対応）

### Tests-first (E2E)

- [x] T201 E2E for FR-021 "mspec-delta SKILL.md に locale=ja 用 EARS パターンが含まれる" — `mspec-delta/SKILL.md` の内容に `このシステムは SHALL` が含まれることを検証 — files: `packages/cli/tests/e2e/claude-integration-skill-ears-locale.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/claude-integration/spec.md
        Requirements implemented: FR-021
        Change: fix-locale-spec-language

- [x] T202 リグレッション確認: 既存 E2E テスト `claude-integration-skill-ears.e2e.test.ts` が SKILL.md 変更後も PASS すること（EARS / SHALL / Scenario の文字列チェック） — files: `packages/cli/tests/e2e/claude-integration-skill-ears.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/claude-integration/spec.md
        Requirements implemented: FR-021
        Change: fix-locale-spec-language

### Implementation

- [x] T203 D-4: `packages/cli/templates/claude/skills/mspec-delta/SKILL.md` の EARS パターン例示セクションを locale 分岐形式に書き換える — `locale=ja` 用日本語パターン5種・`locale=en` 用英語パターン5種 — files: `packages/cli/templates/claude/skills/mspec-delta/SKILL.md`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/claude-integration/spec.md
        Requirements implemented: FR-021
        Change: fix-locale-spec-language

---

## Phase 4: Polish

- [x] T301 `mspec validate --change 2026-05-17-214224-fix-locale-spec-language` を実行してアーカイブ前の最終確認を行う — files: `changes/2026-05-17-214224-fix-locale-spec-language/`
      anchor:
        @mspec-delta 2026-05-17-214224-fix-locale-spec-language/specs/language-config/spec.md
        Requirements implemented: FR-005, FR-006
        Change: fix-locale-spec-language

---

## Dependencies

- T010, T011 blocks T013 (unit tests before D-1 implementation)
- T012 blocks T014 (unit tests before D-2 implementation)
- T101, T102 blocks T103 (E2E before .ja.md creation)
- T101, T102 blocks T104 (E2E before .en.md creation)
- T103, T104 blocks T105 (.ja.md と .en.md が揃った後にレガシー削除)
- T201 blocks T203 (E2E before SKILL.md change)
- T013 blocks T203 (D-1 locale フィールドが必要)

---

## Constitution Check

> Step: tasks | Constitution Version: 1.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | Phase 2（CLI）→ Phase 3 User Story 1（テンプレート）→ Phase 3 User Story 2（SKILL）の順に独立して実装可能 |
| II. 決定論的マージ | ✅ | テンプレート追加・削除は冪等。JSON フィールド追加は additive のみ |
| III. 質問駆動の要件確定 | ✅ | Open Choices 全4件解決済み（research.md・design.md に記録）|
| IV. 双方向アンカー | ✅ | 全実装タスク（T013/T014/T103/T104/T105/T203）にアンカーブロック付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | D-1/D-2（Phase 2）と D-3（Phase 3 US1）と D-4（Phase 3 US2）を別 User Story に分離 |

### Complexity Tracking

None
