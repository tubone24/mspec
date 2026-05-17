# Research: checklist-ai-driven-verification

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| `verify:` アノテーションの物理形式 | インライン末尾 HTML コメント `<!-- verify: fr-NNN -->` または `<!-- verify: human -->` | 別行記述、YAML frontmatter | CommonMark 仕様で HTML インラインコメントはレンダリング非表示。既存 checklist.md フォーマット（箇条書き 1 行）を破壊しない |
| タスク ID 解決タイミング（最重要・ユーザー確定済み） | **FR参照方式**: auditor は `<!-- verify: fr-NNN -->` を付与し、`mspec-implement` が GREEN 時に `tasks.md` の `Requirements implemented: FR-NNN` アンカーから task ID を逆引き | 2-pass方式（tasks生成後にchecklist書き換え） | `checklist.md` は `tasks.md` より前に生成される（workflow 順: checklist → tasks → implement）。FR参照方式なら `mspec-tasks` SKILL.md の変更不要で Non-Goal 違反なし |
| auditor の項目粒度ルール（ユーザー確定済み） | 「Scenario が E2E テストでカバーされる」確認 → `<!-- verify: fr-NNN -->`；「design.md カバレッジ確認・Constitution 準拠・regression なし」→ `<!-- verify: human -->` | 設計フェーズで詳細確定 | checklist 実例（archive/2026-05-14-050811-spec-grep/checklist.md）で両種別が混在。ルール化でauditorの一貫性担保 |
| runtime / template 同期方法 | 両ファイルを手動で同時編集、実装タスク内で内容比較を明示的に確認する | CLI の自動同期スクリプト | CLI TypeScript 変更は Non-Goal |
| `mspec-tasks` SKILL.md 変更要否 | **不要**（FR参照方式採用のため） | 2-pass採用時は必要 | ユーザーがFR参照方式を選択 |

---

## Web References

- [CommonMark Spec §6.6 — HTML inlines](https://spec.commonmark.org/0.31.2/#html-comment) — `<!--` で始まり `-->` で終わる HTML コメントは CommonMark の inline HTML として定義され、ほぼ全レンダラーで非表示。checklist.md の視覚的外観を変えずにメタデータを埋め込む標準的な方法。

- [EARS (Easy Approach to Requirements Syntax) — Mavin et al.](https://ieeexplore.ieee.org/document/5328509) — mspec が採用している要件記述フォーマット。SHALL / MUST の使い分けが本変更の FR 記述スタイルと直結する。

- [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119) — SHALL / MUST / SHOULD の規範的定義。`mspec-delta` SKILL.md (FR-010) で既に参照している。

---

## Codebase Findings

### workflow 順序（checklist が tasks より前に実行される証拠）

- `.claude/skills/mspec-checklist/SKILL.md:9` — `requires` に `specs/*/spec.md` と `design.md` のみ。`tasks.md` は requires に含まない。checklist は tasks.md が存在しない状態で実行される。
- `.mspec/workflow.yaml:67-75` — `checklist` step は `requires: [specs/*/spec.md, design.md]`。`tasks` step は `checklist` の後に定義（ステップ順: checklist → self-review → tasks → implement）。

### 既存 checklist.md の実フォーマット

- `changes/archive/2026-05-14-050811-spec-grep/checklist.md:7-30` — 1 FR につき複数の `- [ ]` 項目が存在する。項目種別:
  1. "MUST/SHALL 節あり" 確認 → `verify: human`対象
  2. "Scenario の GIVEN/WHEN/THEN あり" 確認 → `verify: human`対象
  3. "design.md が対応付け済み" 確認 → `verify: human`対象
  4. "E2E テストで Scenario を検証" 確認 → **`verify: fr-NNN`対象**（パターン4が主たるタスク検証対象）
- `packages/cli/templates/artifacts/checklist.md:8-10` — テンプレートの項目フォーマットは `- [ ] ADDED Requirement <Name> が design.md でカバーされている` 形式。verify アノテーション追加前提の記述はない（変更対象）。

### implement SKILL.md — 変更対象の現状

- `.claude/skills/mspec-implement/SKILL.md` — checklist.md への言及は現在ゼロ。checklist 自動チェックロジックの挿入点:
  - **Step 3 直後**（`mspec test --expect-green` 実行後）: `tasks.md` の `Requirements implemented: FR-NNN` を読んで対応 `<!-- verify: fr-NNN -->` 項目を `- [x]` に更新
  - **全タスク完了後**（Step 5 の後）: 未チェック項目を種別ごとに報告
- `packages/cli/templates/claude/skills/mspec-implement/SKILL.md` — 同一内容。両ファイルが変更対象（FR-014）。

### checklist-auditor agent — 変更対象の現状

- `.claude/agents/mspec-checklist-auditor.md:29` — `Items must be unchecked (- [ ]); humans tick them after verification.` が現在の制約。この行が主要変更箇所（`verify:` アノテーション付与指示に置き換え）。
- `packages/cli/templates/claude/agents/mspec-checklist-auditor.md:29` — 同一内容。両ファイルが変更対象（FR-014）。

### tasks.md のアンカー形式（FR逆引きのキー）

- `changes/archive/2026-05-14-050811-spec-grep/tasks.md:121,144` — `mspec test --expect-green 3.2 --change ...` と `<Phase>.<Sequential>` 形式でタスクを参照。
- タスクアンカーに `Requirements implemented: FR-NNN` が記録されており、GREEN 時に implement スキルがこれを読んで `fr-NNN` アノテーションと照合する。

---

## Open Choices

すべての主要 Open Choice はユーザーとの対話で確定済み：

| 質問 | 決定 |
|------|------|
| verify アノテーションの段階的解決方法 | **FR参照方式**（`<!-- verify: fr-NNN -->`、implement時に逆引き解決） |
| auditor の項目粒度ルール | **デフォルトルール採用**（E2E検証Scenario → fr-NNN、その他 → human） |

残課題（設計フェーズで確定）:
- 未チェック `verify: fr-NNN` 項目の報告トーン（警告 / エラー / 情報提示）

---

## Constitution Check

| 原則 | Phase 0 評価 |
|------|-------------|
| I. ステップ独立性 | ✅ checklist ステップ（auditor が `verify:` を付与）と implement ステップ（`verify:` を読んで自動チェック）は独立して機能する。implement は checklist.md の `verify:` メタデータを読むだけで auditor の生成ロジックに依存しない。`mspec-tasks` SKILL.md は変更しない（FR参照方式採用）。 |
| II. 決定論的マージ | ✅ 変更対象は Skill / Agent の Markdown ファイルのみ。CLI の archive / merge ロジックには触れない。 |
| III. 質問駆動の要件確定 | ✅ verify アノテーション解決方式（FR参照 vs 2-pass）・項目粒度ルールの 2 点を AskUserQuestion で確定した。残課題（報告トーン）は設計フェーズで確定予定。 |
| IV. 双方向アンカー | ✅ 実装フェーズで変更するすべてのファイル（4ファイル: runtime×2 + template×2）に `@mspec-delta` アンカーブロックを付与する。 |
| V. 強制ステップと拡張ステップの分離 | ✅ checklist は引き続き独立したワークフローステップ。implement への自動チェック追加は既存ステップの手順拡張であり新ステップ追加ではない。`mspec-checklist` スキル本体の呼び出し手順は変更しない（Non-Goal）。 |
