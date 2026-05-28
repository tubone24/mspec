---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

<!-- @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004 -->
<!-- Change: postmortem-archive-integration -->

<!-- @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/memory-constitution/spec.md -->
<!-- Requirements implemented: FR-001, FR-002 -->
<!-- Change: postmortem-archive-integration -->

<!-- @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-lessons-analyzer/spec.md -->
<!-- Requirements implemented: FR-001, FR-002 -->
<!-- Change: postmortem-archive-integration -->

<!-- @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-nextaction-planner/spec.md -->
<!-- Requirements implemented: FR-001, FR-002 -->
<!-- Change: postmortem-archive-integration -->

# Design: postmortem-archive-integration

## Summary

`mspec archive` スキルに 2 つのポストモーテムフックを追加する。archive 完了後、専用サブエージェントが `### Lessons` と `### Next Steps` を分析し、結果を multi-select の `AskUserQuestion` でユーザーに提案する。承認された Lessons は `memory/constitution.md` に追記され、承認された Next Steps は `mspec new` で新規チェンジに変換される。

## Technical Context

### 変更対象ファイル

| ファイル | 操作 | 説明 |
|---------|------|------|
| `.claude/skills/mspec-archive/SKILL.md` | 修正 | postmortem フック（ステップ 3b〜4 間）を追加 |
| `packages/cli/templates/claude/skills/mspec-archive/SKILL.md` | 修正 | runtime と同期更新 |
| `.claude/skills/mspec-lessons-analyzer/SKILL.md` | 新規作成 | Lessons 分析サブエージェントのスキル定義 |
| `.claude/skills/mspec-nextaction-planner/SKILL.md` | 新規作成 | Next Steps 評価サブエージェントのスキル定義 |
| `packages/cli/templates/claude/skills/mspec-lessons-analyzer/SKILL.md` | 新規作成 | template 版 |
| `packages/cli/templates/claude/skills/mspec-nextaction-planner/SKILL.md` | 新規作成 | template 版 |

### サブエージェント起動パターン

mspec-proposal の security-analyzer と同じインライン Agent tool パターンを採用する。`mspec continue` 経由の `subagent_prompt` は使わず、archive スキル内で直接 `Agent` tool を呼ぶ。

```
archive スキル
  ├── ステップ 3b: readme.md の Summary 生成
  ├── [NEW] ステップ 3c: postmortem フック
  │     ├── mspec-lessons-analyzer サブエージェント起動
  │     ├── AskUserQuestion (multi-select) → constitution.md 追記
  │     ├── mspec-nextaction-planner サブエージェント起動
  │     └── AskUserQuestion (multi-select) → mspec new 実行
  └── ステップ 4: 完了レポート
```

## Project Structure

### 新規サブエージェントスキルファイル

```
.claude/skills/
  mspec-lessons-analyzer/
    SKILL.md        # Lessons 分析・提案生成
  mspec-nextaction-planner/
    SKILL.md        # Next Steps 優先度評価・kebab-case 生成
packages/cli/templates/claude/skills/
  mspec-lessons-analyzer/
    SKILL.md        # template 版（runtime と同期）
  mspec-nextaction-planner/
    SKILL.md        # template 版（runtime と同期）
```

## Decisions

### D-001: サブエージェントの入出力コントラクト

**mspec-lessons-analyzer の戻り値:**

```typescript
type LessonsProposal = {
  text: string;             // constitution.md に追記する本文
  target_section: "Core Principles" | "Additional Constraints";
  source_lesson: string;    // 根拠となる元 Lesson テキスト
};
```

**受け入れ基準 (mspec-lessons-analyzer FR-002 Scenario):**
- GIVEN mspec-lessons-analyzer が分析を完了した
- WHEN 提案リストを archive スキル本体に返す
- THEN 各エントリは `{ text, target_section, source_lesson }` の 3 フィールドを持つ

---

**mspec-nextaction-planner の戻り値:**

```typescript
type NextActionProposal = {
  priority: "high" | "medium" | "low";
  kebab_name: string;       // mspec new の引数（kebab-case、安全文字のみ）
  summary: string;          // ユーザーに表示する日本語サマリ
  source_next_step: string; // 根拠となる元 Next Steps テキスト
};
```

**受け入れ基準 (mspec-nextaction-planner FR-002 Scenario):**
- GIVEN NextActions に日本語テキストがある
- WHEN mspec-nextaction-planner がフィーチャー名を生成する
- THEN kebab-case（小文字英数字とハイフンのみ）の名前を返す

### D-002: AskUserQuestion multi-select 設計

Lessons 提案と Next Steps 提案のそれぞれに対し、1 回の AskUserQuestion で全件を multi-select として提示する。

**Lessons 用の例:**
```
Q: constitution.md に追加する原則・制約を選択してください
Options (multi-select):
  - [text: "...", section: "Additional Constraints", source: "..."]
  - ...
```

**Next Steps 用の例:**
```
Q: 新しいチェンジとして登録する Next Steps を選択してください
Options (multi-select):
  - [HIGH] e2e-coverage-improvement: "E2E テストカバレッジを向上させる"
  - [MEDIUM] docs-update: "ドキュメントを更新する"
  - ...
```

**受け入れ基準 (mspec-archive FR-001 Scenario, FR-002 Scenario):**
- GIVEN Lessons/Next Steps が 1 件以上ある
- WHEN archive 完了後にポストモーテムフローを実行する
- THEN 各グループについて 1 回の AskUserQuestion で全件を multi-select で表示する

### D-003: スキップ条件

| 条件 | 動作 |
|------|------|
| `### Lessons` セクションが空 | Lessons 分析フローをスキップ、通知のみ |
| `### Next Steps` セクションが空 | Next Steps 評価フローをスキップ、通知のみ |
| サブエージェントが空リストを返す | そのフローをスキップ、通知のみ |

**受け入れ基準 (mspec-archive FR-001 Scenario "Lessons なし"):**
- GIVEN Lessons が記載されていない
- WHEN archive 完了後にポストモーテムフローを実行する
- THEN Lessons 分析フローをスキップし、Next Steps 評価フローのみ実行する

### D-004: constitution.md 追記フォーマット

`target_section = "Core Principles"` の場合: 番号付き原則として末尾に追記。
`target_section = "Additional Constraints"` の場合: 箇条書きリストの末尾に追記。

どちらも既存のフォーマットを踏襲する（最小差分の追記）。

## Constitution Check

### Phase 0

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | OK — archive スキルがアーカイブ済み readme.md を独立して読み込む | — |
| II. 決定論的マージ | OK — constitution.md への追記はテキスト追加のみ。マージサマリ生成ロジックを変更しない | — |
| III. 質問駆動の要件確定 | OK — Lessons/Next Steps ともに AskUserQuestion を経由する | — |
| IV. 双方向アンカー | OK — 各 SKILL.md に @mspec-delta アンカーを打つ | — |
| V. 強制ステップと拡張ステップの分離 | OK — workflow.yaml のステップ定義を変更しない。postmortem は archive 内の後続動作 | — |
| VI. Security by Default | OK — constitution.md 書き込みはユーザー承認後のみ、mspec new は changes/ 配下のみ、Next Steps テキストは LLM が kebab-case に正規化 | — |

### Phase 1

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | OK | OK — サブエージェントはそれぞれ独立したコンテキストで動作し、前段の会話に依存しない |
| II. 決定論的マージ | OK | OK — 追記位置は固定 enum で決まり、LLM の非決定的な判断に依存しない |
| III. 質問駆動の要件確定 | OK | OK — multi-select で全提案を一覧表示し、ユーザーが選択した項目のみを実行する |
| IV. 双方向アンカー | OK | OK — 各 SKILL.md に @mspec-delta アンカーを付与し、FR-001〜FR-004 へのトレーサビリティを確保する |
| V. 強制ステップと拡張ステップの分離 | OK | OK — workflow.yaml の archive ステップ定義に変更なし。postmortem ロジックは SKILL.md 内に完結 |
| VI. Security by Default | OK | OK — コマンドインジェクション対策（kebab-case 正規化）、最小権限（changes/ のみ）、承認ゲート（AskUserQuestion）がすべて設計に組み込まれている |

### Complexity Tracking

None

<!-- LEARNING: 設計ステップで AskUserQuestion UX パターン（per-item vs multi-select）を決定することで、tasks.md のタスク粒度が明確になる | source: D-002 | confidence: medium -->

## Self-Review

> Reviewed: 2026-05-27
> Reviewer: mspec-self-reviewer subagent
> Blockers: 2（修正済み）

### Findings

#### [blocker — 修正済み] FR-003 (mspec-archive) NextAction 却下シナリオ欠如

`specs/mspec-archive/spec.md` FR-003 の要件本文は「constitution.md への書き込みも `mspec new` の実行も MUST NOT」としていたが、シナリオが constitution.md 側のみを検証していた。NextAction 却下時に `mspec new` が実行されないことを確認するシナリオが欠落。

**対応**: FR-003 に「ユーザーが NextAction 提案を却下する」シナリオを追加（修正済み）。

---

#### [blocker — 修正済み] `architecture-overview.md` に `@mspec-delta` アンカーなし

`architecture-overview.md` に Principle IV（双方向アンカー）が求めるアンカーが存在しなかった。また `design.md` のアンカーが mspec-archive/spec.md 1 本のみで、残り 3 spec へのトレーサビリティが設計文書レベルで欠落していた。

**対応**: `architecture-overview.md` に全 4 spec のアンカーを追加。`design.md` にも残り 3 spec のアンカーを追加（修正済み）。

---

#### [warning — 修正済み] D-003 空リスト返却時のシナリオ欠如

`mspec-lessons-analyzer` FR-001 に「全 Lessons が既存原則と重複して空リストを返す」シナリオが欠落していた。

**対応**: `specs/mspec-lessons-analyzer/spec.md` FR-001 にシナリオ「全 Lessons が既存原則と重複する」を追加（修正済み）。

---

#### [warning — 修正済み] FR-002 kebab-case 安全性の正規表現パターン未定義

`specs/mspec-nextaction-planner/spec.md` FR-002 のシナリオに安全性の判定条件（正規表現）が未記載だった。

**対応**: THEN 節に `^[a-z0-9][a-z0-9-]*[a-z0-9]$` を明記（修正済み）。

---

#### [suggestion] D-001 サブエージェントへの入力コントラクト未定義

archive スキルがサブエージェントに渡す入力形式（readme.md の絶対パスか相対パスか）が設計上で未定義。tasks.md 作成時に実装者が判断することになる。優先度は低く、tasks.md で明示的なタスクとして追加することで解消できる。

---

#### [suggestion] D-004 番号付き原則追記のインクリメント方式未定義

`target_section = "Core Principles"` への追記時の番号算出ロジック（既存最終番号 + 1）が明示されていない。tasks.md で実装タスクとして補足する。

---

### Summary

2 blocker・2 warning を修正済み。`architecture-overview.md` と `design.md` のアンカー欠如（Principle IV 違反）と FR-003 のシナリオ不完全（Security by Default への影響）がいずれも解消されたため、tasks.md ステップへ進める状態にある。
