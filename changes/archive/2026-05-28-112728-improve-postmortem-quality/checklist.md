# Checklist: improve-postmortem-quality

## Delta Spec Coverage

### mspec-lessons-analyzer

- [x] FR-003 (Lessons の抽象化と本質課題への昇華) — concreteness-signal ロジックが mspec-lessons-analyzer step 5 に追加され、ツール名・ファイル名を含む Lesson が抽象原則テキストに変換されること（設計 Decision 1 の受け入れ基準 3 Scenario すべてをカバー） <!-- verify: fr-003 -->

### mspec-nextaction-planner

- [x] FR-003 (mspec:new 提案時の概略テキスト生成) — nextaction-planner の出力スキーマに `request_summary` フィールドが追加され、archive スキルが `mspec new <kebab_name> --request "<request_summary>"` を呼び出すことで新規チェンジの readme.md `## Request` セクションに概略テキストが記載されること（設計 Decision 2 の受け入れ基準 3 Scenario すべてをカバー） <!-- verify: fr-003 -->

## Source-of-Truth Regression

### mspec-lessons-analyzer

- [x] SoT FR-001 (Lessons 全件分析と提案生成) — 本変更は step 5 の前に抽象化判定ステップを挿入するのみで、Lessons セクションの読み取り・constitution.md との重複照合・提案リスト返却のフローは変更されない。regression リスク: 抽象化ロジックが誤って pass-through 判定を下し、本来は constitution.md に重複するエントリが提案リストに含まれる可能性。影響: 軽微（ユーザーが AskUserQuestion で却下可能） <!-- verify: fr-001 -->

  ※ SoT FR-002 (提案エントリのフォーマット) は `risk_tier: trivial` のため regression チェック項目を生成しない。

### mspec-nextaction-planner

- [x] SoT FR-001 (Next Steps 優先度評価) — `request_summary` は出力スキーマへの optional フィールド追加であり、priority・kebab_name・summary・source_next_step の既存フィールドは変更されない。regression リスク: request_summary 生成ロジックが summary フィールドを上書きするコードパスが意図せず混入した場合、優先度評価結果が変化する可能性。影響: 軽微（optional フィールドで後方互換） <!-- verify: fr-001 -->
- [x] SoT FR-002 (kebab-case フィーチャー名の正規化) — 本変更は kebab_name 生成ロジックに触れない。regression リスク: request_summary 生成のために source_next_step を加工するコードパスが kebab_name 正規化ロジックと干渉し、特殊文字がフィーチャー名に混入する可能性（特に Scenario: 注入リスクのある特殊文字を含むテキスト）。影響: 中（kebab_name が正規表現 `^[a-z0-9][a-z0-9-]*[a-z0-9]$` に適合しなくなる） <!-- verify: fr-002 -->

## Constitution

- [ ] I. ステップ独立性 — 3ファイルの変更は相互独立で archive→planner が一方向依存のみ。`mspec continue` エンベロープへの変更なし（設計判断の妥当性は機械検証不可） <!-- verify: human -->
  - `.claude/agents/mspec-lessons-analyzer.md`・`.claude/agents/mspec-nextaction-planner.md`・`SKILL.md:72` の変更が互いに独立して動作し、前段の会話文脈に依存しないことを確認する
  - `mspec continue` のエンベロープ定義（`workflow.yaml` 等）が変更されていないことを確認する
- [ ] II. 決定論的マージ — Delta Spec は FR-003 ADDED のみ。既存 FR は MODIFIED/REMOVED/RENAMED なし（Delta Spec の ADDED 項目が既存 FR に意図せず影響していないことは機械検証不可） <!-- verify: human -->
  - `mspec archive <change-dir> --dry-run` の出力に ADDED 以外の変更（MODIFIED/REMOVED/RENAMED）が含まれていないことを確認する
  - archive スキル SKILL.md:72 の diff が line 72 の1箇所に閉じており、他行への意図しない変更がないことを確認する
- [ ] III. 質問駆動の要件確定 — design.md の Constitution Check Phase 0 に「research で4つの設計判断を確認済み」と記録されている（AskUserQuestion 使用の実績は会話ログの目視確認が必要で機械検証不可） <!-- verify: human -->
  - `changes/2026-05-28-112728-improve-postmortem-quality/research.md` に4つの設計判断が追跡可能な形で記録されていることを確認する
  - design.md の Decision 1〜2 に根拠テキストが記載されており、後から検証できる状態であることを確認する
- [x] IV. 双方向アンカー — `mspec anchor check` 実行済み: 548 アンカー、エラー 0 件 <!-- verify: cmd:mspec anchor check -->
- [ ] V. 強制ステップと拡張ステップの分離 — 本変更は archive スキルの手順テキストのみを修正し、`workflow.yaml` の強制ステップ定義を変更しない（SKILL.md の手順変更が workflow.yaml の removable フラグ等に影響しないことは機械検証不可） <!-- verify: human -->
  - `workflow.yaml` に変更差分がないことを `git diff workflow.yaml` で確認する
  - SKILL.md:72 の変更が `mspec archive` の必須ステップ（validate / git mv / anchor check）をスキップしていないことを確認する
- [x] VI. Security by Default — 両 Delta Spec に `## Security Capabilities` セクションが存在する <!-- verify: cmd:grep "## Security Capabilities" changes/2026-05-28-112728-improve-postmortem-quality/specs/mspec-lessons-analyzer/spec.md changes/2026-05-28-112728-improve-postmortem-quality/specs/mspec-nextaction-planner/spec.md -->
