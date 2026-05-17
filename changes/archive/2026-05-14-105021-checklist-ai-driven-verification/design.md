# Design: checklist AI-driven verification

## Summary

`mspec-checklist-auditor` が生成する各 `checklist.md` 項目に `<!-- verify: fr-NNN -->` または `<!-- verify: human -->` のアノテーションを付与し、`mspec-implement` スキルがタスク GREEN 時に `fr-NNN` 項目を自動チェックする。全タスク完了後に未チェック項目を種別ごとにユーザーへ報告する。変更対象は runtime の Skill / Agent Markdown ファイル 4 本のみで、CLI TypeScript は変更しない。

## Technical Context

| コンポーネント | ファイル | 役割 |
|---|---|---|
| checklist-auditor (runtime) | `.claude/agents/mspec-checklist-auditor.md` | checklist.md 生成ロジック。`verify:` アノテーション付与ルール追加 |
| checklist-auditor (template) | `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` | `mspec init` 時に配布されるテンプレート。runtime と同一内容 |
| mspec-implement (runtime) | `.claude/skills/mspec-implement/SKILL.md` | implement 手順定義。タスク GREEN 時の自動チェックロジック追加 |
| mspec-implement (template) | `packages/cli/templates/claude/skills/mspec-implement/SKILL.md` | `mspec init` 時に配布されるテンプレート。runtime と同一内容 |
| tasks.md (参照のみ) | `changes/<change>/tasks.md` | `Requirements implemented: FR-NNN` アンカーを逆引き解決に使用 |
| checklist.md (参照 + 更新) | `changes/<change>/checklist.md` | `verify:` アノテーション付きで生成。implement が `- [x]` に更新 |

## Project Structure

| ファイル | 操作 | 変更内容 |
|---|---|---|
| `.claude/agents/mspec-checklist-auditor.md` | 修正 | Constraints 節の書き換え + アノテーション付与手順追加（FR-011） |
| `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` | 修正 | 同上（FR-014 同期要件） |
| `.claude/skills/mspec-implement/SKILL.md` | 修正 | Step 3 直後のアノテーション自動チェック手順 + Step 5 の未チェック報告追加（FR-012, FR-013） |
| `packages/cli/templates/claude/skills/mspec-implement/SKILL.md` | 修正 | 同上（FR-014 同期要件） |

### アンカーパターン（4 ファイル共通、HTML コメント形式）

Markdown ファイルのため、`@mspec-delta` アンカーを YAML frontmatter 直後または本文先頭に HTML コメントとして付与する。

```markdown
<!-- @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-011, FR-012, FR-013, FR-014 -->
<!-- Change: checklist-ai-driven-verification -->
```

`mspec-checklist-auditor.md` は FR-011 のみ実装、`mspec-implement/SKILL.md` は FR-012, FR-013 を実装。両ファイルで FR-014 の sync 要件は satisfy される。

### checklist.md アノテーション形式（FR-011）

```markdown
- [ ] FR-011 の Scenario「AI-verifiable item receives FR reference annotation」が E2E テストでカバーされている <!-- verify: fr-011 -->
- [ ] design.md が FR-011 をカバーしている <!-- verify: human -->
- [ ] Constitution 原則 I — ステップ独立性の Constitution Check が design.md にある <!-- verify: human -->
```

### implement スキルの自動チェックロジック（FR-012）

```
Step 3 完了後（`mspec test --expect-green <task-id>`）:
  1. task-anchor を読む → `Requirements implemented: FR-NNN, FR-MMM`
  2. checklist.md の行を走査
  3. `<!-- verify: fr-NNN -->` または `<!-- verify: fr-MMM -->` を末尾に含む `- [ ]` 行を `- [x]` に置換
  4. 置換は冪等（すでに `- [x]` なら変更なし）
```

1 タスクが複数 FR を実装する場合 → 該当する全 `<!-- verify: fr-NNN -->` 項目を一括更新。同じ FR を複数タスクが実装する場合 → 最初の GREEN で `- [x]` 化し、以降は冪等。

### 未チェック項目報告ロジック（FR-013）

```
全タスク完了後:
  - verify: human の未チェック項目 → 一覧を提示 → 人間レビューを要求 → block
  - verify: fr-NNN の未チェック項目 → 対象 FR 一覧を警告表示 → gap を説明 → block
  - 未チェック項目ゼロ → 実装完了を宣言（block なし）
```

## Decisions

| 論点 | 採用案 | 受け入れ基準（Scenario） | 根拠 |
|------|--------|--------------------------|------|
| アノテーション形式 | `<!-- verify: fr-NNN -->` (FR参照方式) | FR-011: "AI-verifiable item receives FR reference annotation" — THEN 末尾に `<!-- verify: fr-011 -->` が付与される | checklist は tasks.md より前に生成されるため task-ID は未確定。FR-ID は Delta Spec ステップで確定済みで安定 |
| 解決タイミング | implement の GREEN 時に tasks.md アンカーで逆引き | FR-012: "Test suite goes GREEN" — AND task-003 アンカーに `Requirements implemented: FR-011` — THEN `<!-- verify: fr-011 -->` 項目が `- [x]` に更新 | 2-pass 方式（tasks 後に checklist 書き換え）はワークフロー変更が必要。FR参照方式なら `mspec-tasks` 変更不要 |
| 冪等性 | 既に `- [x]` の項目への再更新は skip | FR-012: "other verify annotations are unchanged" — AND 他の `verify:` アノテーションは変更されない | 1 FR が複数タスクにまたがる場合にダブルチェックが起きないよう保証 |
| auditor 粒度ルール | E2E Scenario → `fr-NNN`、それ以外 → `human` | FR-011: "Human-review item receives human annotation" — THEN `<!-- verify: human -->` が付与される | 既存 checklist.md 実例（archive/spec-grep/checklist.md）で両種別が混在。ルール化で auditor の一貫性を担保 |
| 報告トーン（gap） | 警告 + ブロック（verify: fr-NNN ギャップ） | FR-013: "Unchecked fr-annotated items trigger gap warning" — THEN 対象 FR 番号を報告 — AND ユーザーの確認を待つ | ギャップは checklist とタスクの設計不整合を示す。情報提示のみでは見逃される可能性がある |
| 報告トーン（human） | 人間レビュー要求 + ブロック（verify: human） | FR-013: "Unchecked human items reported at end of implement" — AND 人間によるレビューを求め確認を待つ | Constitution 準拠・設計判断は AI が代替できない。必ず人間が確認した上で完了とする |
| 全項目チェック済み時の宣言 | 未チェック項目ゼロ → 実装完了を宣言（ブロックなし） | FR-013: "All items checked — implementation declared complete" — THEN 未チェック項目の報告を行わず実装完了を宣言する | 人間に不要な確認を強いるべきでない。全項目が自動または手動で確認済みなら即時完了が適切 |
| runtime / template 同期 | 手動同時編集、実装タスクで内容比較を明示確認 | FR-014: "Template and runtime skill contain identical verify procedure" — THEN ランタイムとテンプレートの内容に差異がない | CLI TypeScript 変更は Non-Goal。手動確認を tasks.md の実装注意事項として明記することで担保 |

## Constitution Check

> Step: design | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | checklist ステップ（auditor が `verify:` を付与）と implement ステップ（`verify:` を読んで自動チェック）は独立して機能する。implement は checklist.md の `verify:` メタデータを読むだけで auditor の生成ロジックに依存しない。`mspec-tasks` SKILL.md は変更しない（FR参照方式採用）。 |
| II. 決定論的マージ | ✅ | ✅ | 変更対象は Skill / Agent の Markdown ファイル 4 本のみ。CLI の archive / merge ロジックには触れない。`mspec archive` のマージ対象は `specs/claude-integration/spec.md` のみ。 |
| III. 質問駆動の要件確定 | ✅ | ✅ | アノテーション形式（fr-NNN vs task-NNN）→ research で確定。粒度ルール → research で確定。報告トーン（警告+ブロック）→ design で AskUserQuestion で確定。Delta Spec 修正 → design で AskUserQuestion で確定。残未確定事項なし。 |
| IV. 双方向アンカー | ✅ | ✅ (条件付き) | 実装対象の 4 ファイルに `@mspec-delta` アンカーを HTML コメント形式で付与する（本ファイルの「アンカーパターン」節参照）。**前提**: `mspec anchor check` が `.md` ファイルの HTML コメント形式 `<!-- ... -->` を認識できること。cli-anchor SoT に HTML コメント形式の Scenario が存在しないため、tasks.md で「cli-anchor スキャナーの `.md` ファイル対応確認」タスクを追加し、実装後に検証する。未対応の場合は fallback として anchor チェックを `.md` ファイルに対して無効化するか、スキャナー拡張タスクを追加する。 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `workflow.yaml` は変更しない。`mspec-checklist` スキル本体の呼び出し手順は変更しない（Non-Goal）。implement への自動チェック追加は既存ステップの手順拡張であり新ステップ追加ではない。 |

### Complexity Tracking

None — 違反 0 件。Skill / Agent Markdown の手順追加のみで新規ファイル・CLI 変更なし。

## Self-Review

> Reviewer: mspec-self-reviewer | Pass: 2 | Overall: PASS WITH NOTES — PRIOR FINDINGS CONFIRMED, ONE NEW NIT

### Findings

| Severity | Artifact | Finding | Action |
|----------|----------|---------|--------|
| nit (修正済み) | `architecture-overview.md` L19–22 | "Annotation Types" サブグラフが `ANN_FR`・`ANN_H` ノードを宣言しているが、System Diagram 内でいずれのエッジも接続されていない。サブグラフが孤立して浮いている。 | `AUD` から `ANN_FR`・`ANN_H` へのエッジを追加し、さらに `CL` へ接続。`architecture-overview.md` を修正済み |
| confirmed-resolved | `design.md` Constitution IV | 前回 WARNING — Constitution IV が無条件 ✅ だったが、`mspec anchor check` の HTML コメント対応未確認と矛盾。「✅ (条件付き)」に修正済み。tasks.md で確認タスクを追加する旨を明記。 | 対応済み |
| confirmed-resolved | `spec.md` FR-013 要件本文 | 前回 NOTE — EARS "If" 節。現在 "Where no unchecked items remain" に修正済み。 | 対応済み |
| confirmed-resolved | `design.md` Decisions テーブル | 前回 NOTE — FR-013「All items checked」行が欠落。行を追加済み。 | 対応済み |
| confirmed-resolved | `quickstart.md` Verify ステップ 2 | 前回 NOTE — `grep -c "verify:"` が同一行重複を検出できない。`grep -E "verify:.*verify:"` に修正済み。 | 対応済み |
| confirmed-no-action | `proposal.md` L11–13 | 歴史的文書に `task-NNN` 表記が残る。動作への影響なし。 | 対応不要 — 歴史的文書 |

### Constitution 再確認（レビュアー評価）

| Principle | Phase 0 | Phase 1 | Verdict |
|-----------|---------|---------|---------|
| I. ステップ独立性 | ✅ | ✅ | AGREE — checklist auditor は `verify:` 付与ロジックを保持し、implement は `checklist.md` の静的メタデータを読むのみ。`mspec-tasks` SKILL.md は非変更。孤立サブグラフ nit は図の表示問題であり、ロジックへの影響なし。 |
| II. 決定論的マージ | ✅ | ✅ | AGREE — 変更対象は Markdown ファイル 4 本のみ。CLI archive / merge ロジックへの変更なし。`mspec archive` のマージ対象は `specs/claude-integration/spec.md` のみ。 |
| III. 質問駆動の要件確定 | ✅ | ✅ | AGREE — アノテーション形式（FR参照 vs task-ID）は research.md に確定記録あり。報告トーン（警告+ブロック）は design.md Decisions テーブルに根拠記載あり。残課題ゼロ。 |
| IV. 双方向アンカー | ✅ (条件付き) | ✅ (条件付き) | PARTIAL AGREE — アンカー配置戦略と HTML コメント形式は design.md・architecture-overview.md に明示。`mspec anchor check` の `.md` HTML コメント対応確認が tasks.md で実装前確認タスクとして明示済み。条件は前回レビューから変更なし。 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | AGREE — `workflow.yaml` 不変。`mspec-checklist` 呼び出し手順不変。implement への追加は手順拡張であり新規 mandatory step の追加なし。 |

### Delta Spec → アーティファクト カバレッジ確認

FR-011〜FR-014 の全 ADDED 要件に Scenario が存在。各 FR が design.md（Decisions テーブル + ロジック節）と architecture-overview.md（System Diagram・Sequence Diagram・Anchor Placement）に反映済み。カバレッジ完全。

### Quickstart 実行可能性確認

Golden Path（ステップ 1–3）完備。Verify ステップは決定論的シェルコマンド（`grep`・`diff`・`wc -l`）で構成。`<change-dir>` プレースホルダーは一貫使用。Troubleshooting テーブルが設計書記載の全失敗モードをカバー。Quickstart は記述通りに実行可能。
