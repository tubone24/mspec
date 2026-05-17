---
doc_type: Reference
---

# Checklist: step-checkbox-update

## Delta Spec Coverage

### FR-015 — Each mspec skill step updates readme.md Artifacts checkbox on completion

- [x] `mspec-proposal` が `proposal.md` を書き込んだ後、`readme.md` の `- [ ] proposal.md` が `- [x] proposal.md` に更新される <!-- verify: fr-015 -->
- [x] `mspec-delta` が全 capability の `spec.md` を生成した後、`readme.md` の `- [ ] specs/*/spec.md (Delta Spec)` が `- [x] specs/*/spec.md (Delta Spec)` に更新される <!-- verify: fr-015 -->
- [x] `mspec-research` が `research.md` を書き込んだ後、`readme.md` の `- [ ] research.md` が `- [x] research.md` に更新される <!-- verify: fr-015 -->
- [x] `mspec-design` が `design.md` および `architecture-overview.md` の**両方**を書き込んだ後に限り、`readme.md` の `- [ ] design.md / architecture-overview.md` が `- [x] design.md / architecture-overview.md` に更新される（片方のみ完了時は更新されない） <!-- verify: fr-015 -->
- [x] `mspec-quickstart` が `quickstart.md` を書き込んだ後、`readme.md` の `- [ ] quickstart.md` が `- [x] quickstart.md` に更新される <!-- verify: fr-015 -->
- [x] `mspec-checklist` が `checklist.md` を書き込んだ後、`readme.md` の `- [ ] checklist.md` が `- [x] checklist.md` に更新される <!-- verify: fr-015 -->
- [x] `mspec-tasks` が `tasks.md` を書き込んだ後、`readme.md` の `- [ ] tasks.md` が `- [x] tasks.md` に更新される <!-- verify: fr-015 -->
- [x] `mspec validate` が失敗した場合、直前に `- [x]` に更新された Artifacts 行が `- [ ]` にロールバックされる <!-- verify: fr-015 -->
- [x] Artifacts 行の更新は対応する 1 行のみに適用され、他の artifact 行（未完了の `- [ ]` 行）は変更されない <!-- verify: fr-015 -->

### FR-016 — mspec-implement updates tasks.md task checkbox when task reaches GREEN

- [x] `--expect-green` が成功した後（全テスト GREEN）、`tasks.md` の対応する `- [ ] TNNN: …` 行が `- [x] TNNN: …` に更新される（TNNN は `T\d{3}` 形式） <!-- verify: fr-016 -->
- [x] 1 件以上のテストが FAIL のままである場合、`tasks.md` の対応する `- [ ] TNNN: …` 行は変更されない <!-- verify: fr-016 -->
- [x] 対象タスクのチェックボックス更新は冪等である（すでに `- [x]` の行は変更されない） <!-- verify: fr-016 -->
- [x] 対象タスク以外の未完了タスク行（`- [ ] TNNN: …`）は変更されない <!-- verify: fr-016 -->

### FR-011 — checklist-auditor annotates each item with verify metadata

- [x] AI 検証可能なチェックリスト項目（対応する FR の E2E シナリオで検証できるもの）には `<!-- verify: fr-NNN -->` アノテーションが付与される <!-- verify: fr-011 -->
- [x] Constitution 準拠・設計判断・外部観察など自動検証できない項目には `<!-- verify: human -->` アノテーションが付与される <!-- verify: fr-011 -->
- [x] 1 つのチェックリスト項目に付与される `verify:` アノテーションはちょうど 1 つである（重複なし） <!-- verify: fr-011 -->
- [x] `checklist.md` の全項目書き込み完了後、auditor が自己検証ステップを実行し、`verify:` アノテーションを持たないチェックボックス行が 0 件であることを確認する <!-- verify: fr-011 -->
- [x] 自己検証でアノテーションなし行が検出された場合、`<!-- verify: human -->` を付与してから完了を宣言する <!-- verify: fr-011 -->

## Source-of-Truth Regression

- [ ] FR-002: 修正された全 SKILL.md（7 step skills + implement）が、YAML frontmatter（`name`, `when_to_use`）と `## Procedure` 見出しを依然として保持している <!-- verify: human -->
- [ ] FR-003: Artifacts 更新ステップが `mspec status --json` より**後**、かつ validate より前の位置に挿入されており、`## Procedure` 最初のステップが `mspec status --change <name> --json` のままである <!-- verify: human -->
- [ ] FR-006: 追加された Artifacts 更新ステップは exact-string 置換の指示として記述されており、CLI のバリデーションロジックを Skill 内で再実装していない（`mspec validate` は引き続き CLI に委譲される） <!-- verify: human -->
- [ ] FR-010: `mspec-delta`、`mspec-proposal`、`mspec-design` の SKILL.md に記述された EARS 形式・RFC 2119 キーワード・Scenario 必須の指示が、Artifacts 更新ステップ追加後も変更されていない <!-- verify: human -->
- [x] FR-011 (既存 Scenario): AI 検証可能項目への `fr-NNN` 付与・human 項目への `human` 付与という既存の 2 シナリオが、FR-011 強化（自己検証追加）後も引き続き満足される <!-- verify: fr-011 -->
- [ ] FR-012: `mspec-implement` が tasks.md チェックボックス更新（FR-016）を実行した後も、`checklist.md` の `<!-- verify: fr-NNN -->` 付き項目を `- [x]` に自動更新するロジック（FR-012）が干渉なく動作する <!-- verify: fr-012 -->
- [ ] FR-013: 全タスク GREEN 後に `checklist.md` の未チェック項目をアノテーション種別ごとに報告するロジック（FR-013）が、tasks.md チェックボックス更新（FR-016）の追加後も正常に動作する <!-- verify: fr-013 -->
- [ ] FR-014: 修正される 9 ペア（7 step skills + implement + checklist-auditor）すべてで、runtime ファイルと CLI テンプレートファイルの内容が一致している <!-- verify: fr-014 -->

## Constitution

- [ ] I. ステップ独立性: 各スキルが自ステップの Artifacts 行のみを更新し、他ステップの行には触れない。`tasks.md` 更新は `mspec-implement` のみが行い、他ステップは関与しない。checklist-auditor の自己検証は checklist ステップ内で完結する <!-- verify: human -->
- [ ] II. 決定論的マージ: readme.md / tasks.md の更新は exact-string `- [ ]` → `- [x]` 置換であり決定論的である。CLI の archive / merge ロジックへの変更はない <!-- verify: human -->
- [ ] III. 質問駆動の要件確定: proposal および research ステップで行われた Q&A（スコープ、対象ファイル、validate 失敗時の扱い、design 2 ファイルのタイミング等）の決定根拠が design.md の Decisions 節に記録されている <!-- verify: human -->
- [ ] IV. 双方向アンカー: 実装対象の全 18 ファイル（7 step skills + implement + auditor + 9 CLI テンプレート）に `@mspec-delta` HTML コメント形式のアンカーブロックが付与されている <!-- verify: human -->
- [ ] V. 強制ステップと拡張ステップの分離: `workflow.yaml` は変更されておらず、新ステップ・新スキルは追加されていない。既存の強制ステップ内 Procedure への手順追加のみである <!-- verify: human -->
