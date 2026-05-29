---
doc_type: Tutorial
---

# Tasks: fix-existing-purpose-placeholders

## Phase 1: Setup

### T-001: プレースホルダーを持つ spec ファイルを特定

`specs/` 配下の全 spec.md を検索し、`## Purpose` セクションがテンプレートプレースホルダー（`<このスペックがカバーする外部から観測可能な振る舞いの概要>`）のままになっているファイルを一覧化する。

```bash
grep -rl "<このスペックがカバーする外部から観測可能な振る舞いの概要>" specs/ | sort
```

期待: 37 件が表示されること（実行時点で残存している件数と一致すること）。

---

## Phase 2: Foundational — 検証基準定義

### T-002: [検証基準] Scenario 1 — プレースホルダー置換の成功確認コマンドを準備

FR-006 Scenario 1「プレースホルダーの Purpose を持つ spec が修正される」に対応。バックフィル完了後に下記コマンドで 0 件になることが成功基準であることを確認する。

```bash
grep -rl "<このスペックがカバーする外部から観測可能な振る舞いの概要>" specs/ | wc -l
# → 0 件であること
```

<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->
<!-- verify: fr-006 -->

### T-003: [検証基準] Scenario 2 — スキップ動作の確認方法を定義

FR-006 Scenario 2「記述済みの Purpose を持つ spec はスキップされる」に対応。Purpose が既に記述されているファイルを特定し、バックフィル前後でファイルが変更されていないことを確認するコマンドを定義する。

```bash
# 事前: Purpose が記述済みのファイルを特定
grep -rL "<このスペックがカバーする外部から観測可能な振る舞いの概要>" specs/*/spec.md

# 事後: バックフィル前後の diff が対象外ファイルに存在しないことを確認
git diff --name-only specs/ | grep -v <対象ファイル一覧>
```

<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->
<!-- verify: fr-006 -->

### T-004: [検証基準] Scenario 3 — 部分失敗時の継続確認方法を定義

FR-006 Scenario 3「一部失敗時も処理は継続される」に対応。バックフィル中に一部ファイルで失敗が発生した場合、その旨をサマリーとして記録して残りのファイルを処理し続けることを確認する。完了後に `grep` で残存プレースホルダー件数を確認し、失敗件数として記録する。

<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->
<!-- verify: fr-006 -->

---

## Phase 3: User Story — バックフィル実装

各タスクでは、対象ファイルの `## Requirements` セクションを読み取り、1〜2 文の外部観測可能な振る舞いの概要を生成し、Edit ツールで `## Purpose` セクションのプレースホルダー行のみを置換する。記述済みのファイルはスキップする（冪等性確保）。

### T-005: CLI 関連 spec バックフィル (8 ファイル)

以下 8 ファイルの `## Purpose` プレースホルダーを置換する：

- `specs/cli-core/spec.md`
- `specs/cli-done-log/spec.md`
- `specs/cli-init-command/spec.md`
- `specs/cli-integration/spec.md`
- `specs/cli-spec-lint/spec.md`
- `specs/cli-state-engine/spec.md`
- `specs/cli-upgrade/spec.md`
- `specs/cli-distribution/spec.md`

<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->
<!-- verify: fr-006 -->

### T-006: Delta Spec / Artifact 関連 spec バックフィル (4 ファイル)

以下 4 ファイルの `## Purpose` プレースホルダーを置換する：

- `specs/delta-spec/spec.md`
- `specs/delta-spec-template/spec.md`
- `specs/artifact-taxonomy/spec.md`
- `specs/artifact-templates-i18n/spec.md`

<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->
<!-- verify: fr-006 -->

### T-007: Archive / Proposal 関連 spec バックフィル (2 ファイル)

以下 2 ファイルの `## Purpose` プレースホルダーを置換する：

- `specs/mspec-archive/spec.md`
- `specs/mspec-proposal/spec.md`

<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->
<!-- verify: fr-006 -->

### T-008: UI / Dashboard 関連 spec バックフィル (8 ファイル)

以下 8 ファイルの `## Purpose` プレースホルダーを置換する：

- `specs/change-dashboard/spec.md`
- `specs/visual-mock/spec.md`
- `specs/web-ui-search/spec.md`
- `specs/web-ui-themes/spec.md`
- `specs/code-syntax-highlight/spec.md`
- `specs/quick-access-palette/spec.md`
- `specs/spec-viewer-search/spec.md`
- `specs/test-result-viewer/spec.md`

<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->
<!-- verify: fr-006 -->

### T-009: Search / Full-text 関連 spec バックフィル (2 ファイル)

以下 2 ファイルの `## Purpose` プレースホルダーを置換する：

- `specs/full-text-search/spec.md`
- `specs/search-index/spec.md`

<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->
<!-- verify: fr-006 -->

### T-010: i18n / 言語設定 関連 spec バックフィル (4 ファイル)

以下 4 ファイルの `## Purpose` プレースホルダーを置換する：

- `specs/ears-validation-i18n/spec.md`
- `specs/question-bank-i18n/spec.md`
- `specs/question-bank/spec.md`
- `specs/language-config/spec.md`

<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->
<!-- verify: fr-006 -->

### T-011: インフラ / その他 spec バックフィル (9 ファイル)

以下 9 ファイルの `## Purpose` プレースホルダーを置換する：

- `specs/agent-runner/spec.md`
- `specs/ci-cd/spec.md`
- `specs/docs-site/spec.md`
- `specs/constitution/spec.md`
- `specs/memory-constitution/spec.md`
- `specs/skill-observability/spec.md`
- `specs/verify-routing/spec.md`
- `specs/version-check/spec.md`
- `specs/upgrade-command/spec.md`

<!-- @mspec-delta 2026-05-28-134307-fix-existing-purpose-placeholders/specs/mspec-archive/spec.md
Requirements implemented: FR-006
Change: fix-existing-purpose-placeholders -->
<!-- verify: fr-006 -->

---

## Phase 4: Polish

### T-012: 全プレースホルダー残存ゼロを確認

```bash
grep -rl "<このスペックがカバーする外部から観測可能な振る舞いの概要>" specs/ | wc -l
# → 0 件であること
```

残存があれば該当ファイルを特定して再処理する。失敗件数がある場合はここでサマリーとして記録する（Scenario 3 対応）。

### T-013: git commit で変更を記録

全ファイルのプレースホルダーが 0 件になったことを確認後、変更を git commit する：

```bash
git add specs/
git commit -m "chore: backfill Purpose sections in all capability specs (FR-006)"
```

---

## Constitution Check

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 | ✅ | tasks.md の各タスクは他ステップへの副作用なし |
| II. 決定論的マージ | ✅ | CLI マージロジックへの変更なし |
| III. 質問駆動の要件確定 | ✅ | 全決定事項が proposal.md に記録済み |
| IV. 双方向アンカー | N/A | アドホック実行のためアンカー対象外（design.md で合意済み） |
| V. 強制ステップと拡張ステップの分離 | ✅ | SKILL.md・workflow.yaml 変更なし |
| VI. Security by Default | ✅ | ローカル書き込みのみ、外部 API・秘密情報アクセスなし |
| VII. 設計意図と実装の対応確認 | ✅ | FR-006 の 3 シナリオすべてに対応する検証基準タスク（T-002〜T-004）を実装タスクより先に配置 |
