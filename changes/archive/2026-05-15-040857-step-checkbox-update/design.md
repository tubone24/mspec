---
doc_type: Explanation
---

# Design: step-checkbox-update

## Summary

ワークフロー各ステップが成果物を生成した後に `readme.md` の `## Artifacts` チェックボックスを `- [x]` に更新し、`mspec-implement` がタスク GREEN 時に `tasks.md` の `- [ ] TNNN` を `- [x] TNNN` に更新し、`mspec-checklist-auditor` が全チェックリスト項目に `verify:` アノテーションを確実に付与するよう強化する。変更対象はランタイムおよびテンプレートの Skill / Agent Markdown ファイル計 18 本のみで、CLI TypeScript は変更しない。

## Technical Context

| コンポーネント | ファイル | 役割 |
|---|---|---|
| mspec-proposal (runtime) | `.claude/skills/mspec-proposal/SKILL.md` | `proposal.md` 生成後に Artifacts 行を更新 |
| mspec-delta (runtime) | `.claude/skills/mspec-delta/SKILL.md` | `specs/*/spec.md` 生成後に Artifacts 行を更新 |
| mspec-research (runtime) | `.claude/skills/mspec-research/SKILL.md` | `research.md` 生成後に Artifacts 行を更新 |
| mspec-design (runtime) | `.claude/skills/mspec-design/SKILL.md` | 両ファイル生成後に Artifacts 行を更新 |
| mspec-quickstart (runtime) | `.claude/skills/mspec-quickstart/SKILL.md` | `quickstart.md` 生成後に Artifacts 行を更新 |
| mspec-checklist (runtime) | `.claude/skills/mspec-checklist/SKILL.md` | `checklist.md` 生成後に Artifacts 行を更新 |
| mspec-tasks (runtime) | `.claude/skills/mspec-tasks/SKILL.md` | `tasks.md` 生成後に Artifacts 行を更新 |
| mspec-implement (runtime) | `.claude/skills/mspec-implement/SKILL.md` | タスク GREEN 後に `tasks.md` の `TNNN` 行を更新 |
| mspec-checklist-auditor (runtime) | `.claude/agents/mspec-checklist-auditor.md` | 全項目アノテーション付与 + 自己検証追加 |
| 上記 9 ファイルの CLI テンプレート対応 | `packages/cli/templates/claude/...` | `mspec init` 時に配布される。runtime と同一内容 |
| readme.md (参照 + 更新) | `changes/<change>/readme.md` | `## Artifacts` 節のチェックボックスが更新対象 |
| tasks.md (参照 + 更新) | `changes/<change>/tasks.md` | `- [ ] TNNN` 行が implement GREEN 後に更新対象 |

## Project Structure

| ファイル | 操作 | 変更内容 |
|---|---|---|
| `.claude/skills/mspec-proposal/SKILL.md` | 修正 | Step 5 後に Artifacts 更新ステップを追加（FR-015） |
| `.claude/skills/mspec-delta/SKILL.md` | 修正 | Step 4 後に Artifacts 更新ステップを追加（FR-015） |
| `.claude/skills/mspec-research/SKILL.md` | 修正 | Step 5 後に Artifacts 更新ステップを追加（FR-015） |
| `.claude/skills/mspec-design/SKILL.md` | 修正 | Step 4 後（両ファイル生成後）に Artifacts 更新ステップを追加（FR-015） |
| `.claude/skills/mspec-quickstart/SKILL.md` | 修正 | artifact 生成後に Artifacts 更新ステップを追加（FR-015） |
| `.claude/skills/mspec-checklist/SKILL.md` | 修正 | checklist.md 生成後に Artifacts 更新ステップを追加（FR-015） |
| `.claude/skills/mspec-tasks/SKILL.md` | 修正 | tasks.md 生成後に Artifacts 更新ステップを追加（FR-015） |
| `.claude/skills/mspec-implement/SKILL.md` | 修正 | Step 3 の `--expect-green` 後に tasks.md 更新ステップを追加（FR-016） |
| `.claude/agents/mspec-checklist-auditor.md` | 修正 | Constraints に自己検証ルール追加（FR-011 強化） |
| `packages/cli/templates/claude/skills/mspec-*/SKILL.md` (7 本) | 修正 | 上記 runtime と同一内容（FR-014 同期要件） |
| `packages/cli/templates/claude/skills/mspec-implement/SKILL.md` | 修正 | 上記 runtime と同一内容（FR-014 同期要件） |
| `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` | 修正 | 上記 runtime と同一内容（FR-014 同期要件） |

### readme.md Artifacts 更新パターン（FR-015）

各スキルの Procedure に以下の手順を挿入する（成果物書き込みの直後、`mspec validate` の直前）：

```
- 成果物を書き込んだ後、`readme.md` の `## Artifacts` 節を更新する:
  1. `- [ ] <artifact-name>` 行を `- [x] <artifact-name>` に置換する
  2. `mspec validate` を実行する（次ステップ）
  3. validate が失敗した場合: `- [x] <artifact-name>` を `- [ ] <artifact-name>` にロールバックする
```

各スキルで置換するリテラル文字列：

| スキル | 対象行 |
|--------|--------|
| mspec-proposal | `- [ ] proposal.md` |
| mspec-delta | `- [ ] specs/*/spec.md (Delta Spec)` |
| mspec-research | `- [ ] research.md` |
| mspec-design | `- [ ] design.md / architecture-overview.md` |
| mspec-quickstart | `- [ ] quickstart.md` |
| mspec-checklist | `- [ ] checklist.md` |
| mspec-tasks | `- [ ] tasks.md` |

### tasks.md タスクチェックボックス更新パターン（FR-016）

`mspec-implement` の Step 3 の `--expect-green` 直後に以下を追加する：

```
- `--expect-green` が成功したら、`tasks.md` で `- [ ] TNNN` を `- [x] TNNN` に置換する
  （TNNN は当該タスクの識別子。例: T001, T023）
  （冪等: すでに `- [x]` なら変更なし）
```

### アンカーパターン（18 ファイル共通、HTML コメント形式）

```markdown
<!-- @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-015 -->
<!-- Change: step-checkbox-update -->
```

または FR-016 を実装するファイル（`mspec-implement`）:

```markdown
<!-- @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-016 -->
<!-- Change: step-checkbox-update -->
```

または FR-011 強化を実装するファイル（`mspec-checklist-auditor`）:

```markdown
<!-- @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-011 -->
<!-- Change: step-checkbox-update -->
```

### checklist-auditor 自己検証ルール（FR-011 強化）

`mspec-checklist-auditor.md` の `## Constraints` 末尾に以下を追加する：

```
- 全項目の書き込みが完了した後、`checklist.md` を再スキャンし `verify:` アノテーションがない行を検出すること。
  - アノテーションなし行が存在する場合: 該当行に `<!-- verify: human -->` を付与してから完了を宣言する
  - アノテーションなし行がゼロの場合: そのまま完了を宣言する
```

## Decisions

| 論点 | 採用案 | 受け入れ基準（Scenario） | 根拠 |
|------|--------|--------------------------|------|
| Artifacts 行更新のタイミング | 成果物書き込み直後、`mspec validate` 前 | FR-015: "Proposal step marks its artifact as done" — WHEN proposal.md 書き込み完了 — THEN `## Artifacts` の対応行が `- [x]` に更新される | 成果物は書かれたという事実を validate 前に反映するのが自然 |
| validate 失敗時の扱い | ロールバック（`- [x]` → `- [ ]`）| FR-015 Scenario 1 の否定: validate 失敗時は `- [x]` を `- [ ]` に戻す — THEN readme.md が validate 前の状態に戻る | 無効な成果物を「完了」として表示しない |
| 複数 capability 時の delta 行 | 1 行のまま更新 | FR-015: "Delta step marks its specs artifact as done" — THEN `- [x] specs/*/spec.md` に更新される（1 行） | readme テンプレートが 1 行で表現。capability ごとに行を展開する変更は Non-Goal（CLI 変更不要） |
| design の 2 ファイル更新タイミング | 両ファイル書き込み後に 1 回更新 | FR-015 を design に適用: WHEN `design.md / architecture-overview.md` 両方の書き込みが完了 — THEN `- [ ] design.md / architecture-overview.md` を `- [x]` に更新 | readme は 1 行で表現しているため、両成果物が揃った時点で更新するのが整合的 |
| tasks.md TNNN フォーマット | `T\d{3}` 固定（T001〜T999） | FR-016: "Task goes GREEN, tasks.md checkbox is checked" — THEN `- [x] T003: …` に更新される | archived tasks.md の全行が T001〜T203 の 3 桁ゼロパディング形式 |
| tasks.md 更新の冪等性 | すでに `- [x]` の行は変更なし | FR-016: "Partial task completion does not mark checkbox" — THEN `- [ ] TNNN` のまま変更されない（失敗時） | 複数回実行しても状態が崩れない |
| auditor 自己検証の fallback | アノテーション漏れ行に `<!-- verify: human -->` を付与 | FR-011 Scenario 3: "Auditor self-validates that no item is left unannotated" — THEN アノテーションなし行が 0 件であることを確認し、残存する場合は付与してから完了宣言 | 自動分類できない場合の最も安全な default は human レビューを要求すること |
| runtime / template 同期 | 手動同時編集、タスクで内容比較確認を明示 | FR-014: "Template and runtime skill contain identical verify procedure" — THEN ランタイムとテンプレートの内容に差異がない | CLI TypeScript 変更は Non-Goal。手動確認を tasks.md に明記して担保 |

## Constitution Check

> Step: design | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 各スキルが自ステップの Artifacts 行のみを更新。他ステップの行には触れない。tasks.md 更新は implement のみ。checklist-auditor の自己検証は checklist ステップ内で完結 |
| II. 決定論的マージ | ✅ | ✅ | `- [ ]` → `- [x]` は exact-string 置換で決定論的。CLI archive / merge ロジックへの変更なし。アーカイブ対象は `specs/claude-integration/spec.md` のみ |
| III. 質問駆動の要件確定 | ✅ | ✅ | proposal で 3 問（スコープ・対象ファイル・修正範囲）、research で 3 問（specs 行更新方法・validate 失敗時の扱い・design 2 ファイルタイミング）を Q&A で解決。残未確定事項なし |
| IV. 双方向アンカー | ✅ | ✅ | 実装対象の全 18 ファイルに HTML コメント形式の `@mspec-delta` アンカーを付与する（本ファイルの「アンカーパターン」節参照）。前変更で `mspec anchor check` の `.md` HTML コメント対応は確認済み（2026-05-14-105021-checklist-ai-driven-verification の design.md IV 条件付き ✅ は既に解消） |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `workflow.yaml` 不変。既存の強制ステップ内 Procedure への手順追加のみ。新ステップ・新スキル不要（Non-Goal と整合） |

### Complexity Tracking

None — 違反 0 件。Skill / Agent Markdown ファイルへの手順追加のみで新規ファイル・CLI 変更なし。

## Self-Review

> Reviewer: mspec-self-reviewer | Pass: 1 | Overall: PASS WITH NOTES

### Findings

| Severity | Artifact | Finding | Action |
|----------|----------|---------|--------|
| nit (修正済み) | `quickstart.md` Step 4 期待出力 | `チェックボックス行: 12` とハードコードされていたが実際の checklist.md は 31 項目あり誤解を招く | 固定値を削除し「数値はチェンジにより異なる」の注記に変更済み |
| nit (修正済み) | `quickstart.md` Step 4 `COUNT` | `grep -c "^- \[ \]"`（未チェックのみ）で Verify セクションの `"^- \[ \]\|^- \[x\]"`（全行）と集計ロジックが不統一 | Step 4 の COUNT も全チェックボックスを対象とする正規表現に統一済み |
| nit (修正済み) | `quickstart.md` Prerequisites | 「8 本」の内訳が不明確 | 「`mspec-proposal` 〜 `mspec-tasks` の 7 step skills + `mspec-implement`」と内訳を明示済み |
| nit (no action) | `design.md` Technical Context | CLI テンプレート 9 本が 1 行にまとめられており個別ファイルパスが不可視 | Project Structure テーブルで補完済み。変更不要 |
| nit (no action) | `design.md` Decisions | 「Artifacts 行更新タイミング」と「validate 失敗時」が同一 Scenario（FR-015 Scenario 1）を参照し重複 | 両決定とも FR-015 Scenario 1 から正確に導出されており正確。変更不要 |
| ok | `specs/claude-integration/spec.md` | FR-015 / FR-016 は EARS 形式 + RFC 2119 `SHALL` キーワード使用。各 FR に Scenario 2 件以上あり。FR-011 MODIFIED は 3 シナリオ（自己検証含む）あり | no action |
| ok | `specs/claude-integration/spec.md` | FR-015 / FR-016 の FR ID は既存 SoT spec（FR-001〜FR-014）と重複なし | no action |
| ok | `checklist.md` | 全 31 チェックボックス行に `verify:` アノテーションが 1 つずつ付与されており漏れゼロを確認 | no action |
| ok | `architecture-overview.md` | Mermaid System Diagram・Sequence Diagram × 3・File Change Map の計 5 図あり。Constitution Check セクション（Phase 0 + Phase 1）あり | no action |
| ok | `design.md` | Summary が「スキルファイル計 18 本のみ、CLI TypeScript は変更しない」と proposal スコープと一致。Complexity Tracking セクションあり（違反 0 件）。Constitution Check Phase 0 / Phase 1 両列が記入済み | no action |

### Constitution 再確認（レビュアー評価）

| Principle | Phase 0 | Phase 1 | Verdict |
|-----------|---------|---------|---------|
| I. ステップ独立性 | ✅ | ✅ | AGREE — 各スキルが自ステップの Artifacts 行のみを更新し、他スキルの行に触れない設計は design.md・architecture-overview.md の Sequence Diagram で明示されている。mspec-implement のみが tasks.md を更新し、checklist-auditor の自己検証は checklist ステップ内で完結する点も確認 |
| II. 決定論的マージ | ✅ | ✅ | AGREE — `- [ ]` → `- [x]` は exact-string 置換であり入力が同一なら出力は常に同一。CLI archive / merge ロジックへの変更なし。ロールバックも同様の exact-string 逆置換 |
| III. 質問駆動の要件確定 | ✅ | ✅ | AGREE — proposal で 3 問、research で 3 問を Q&A 解決済み。design.md Decisions テーブルに 8 件の決定と根拠が記録されている |
| IV. 双方向アンカー | ✅ | ✅ | AGREE — design.md にアンカーパターン（HTML コメント形式 `@mspec-delta`）が全 18 ファイル共通仕様として明示されている。前変更（2026-05-14-105021）で `.md` ファイルの HTML コメントアンカー対応が解消済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | AGREE — `workflow.yaml` は不変。新ステップ・新スキルの追加なし。既存強制ステップ内の Procedure への手順追加のみであり、proposal Non-Goals と完全に整合している |

### Delta Spec → アーティファクト カバレッジ確認

**FR-015**: 2 シナリオ（Proposal / Delta）あり。design.md で 7 step skills 全て対応付け済み。architecture-overview.md の System Diagram で 7 ステップ → readme.md の矢印と Sequence Diagram でロールバックフロー図示。checklist.md に 9 件の検証項目あり。カバレッジ完全。

**FR-016**: 2 シナリオ（GREEN / FAIL 分岐）あり。design.md の implement 行に FR-016 明記。architecture-overview.md の Sequence Diagram で GREEN/FAIL 分岐図示。checklist.md に 4 件の検証項目（冪等性・他タスク行不変を含む）あり。カバレッジ完全。

**FR-011 MODIFIED**: 3 シナリオ（AI-verifiable / Human-review / Auditor self-validates）あり。SoT spec の既存 2 シナリオを正しく拡張。design.md の自己検証ルール節・architecture-overview.md の Sequence Diagram でカバー。checklist.md に 5 件の検証項目あり。カバレッジ完全。

### Quickstart 実行可能性確認

Golden Path（ステップ 1–4）は論理的に正しく実行可能。Verify セクションはすべて決定論的なシェルコマンド（`grep` / `diff` / `wc -l`）で構成されており、手動検証（ロールバック）のみ注記付きで明示されている。Troubleshooting テーブルが設計書記載の全失敗モード 5 件をカバー。nit 3 件は修正済み。Quickstart は記述通りに実行可能。
