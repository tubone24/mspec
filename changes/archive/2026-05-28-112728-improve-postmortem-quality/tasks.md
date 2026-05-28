---
doc_type: Tutorial
---

# Tasks: improve-postmortem-quality

## Phase 1: Setup

- [x] 変更対象ファイル3件が git で追跡済みであることを確認する
  - `.claude/agents/mspec-lessons-analyzer.md`
  - `.claude/agents/mspec-nextaction-planner.md`
  - `.claude/skills/mspec-archive/SKILL.md`

## Phase 2: Foundational

### mspec-lessons-analyzer — FR-003 抽象化ロジック

- [x] **[E2E]** concreteness detection の3 Scenario を手動テスト用サンプルデータとして準備する（実装前に期待値を確認する）
  - Scenario 1: ツール名を含む Lesson (例: "mspec validate を実行し忘れた") → 抽象原則テキストに変換されること
  - Scenario 2: ファイル名を含む Lesson (例: "spec.md のプレースホルダーを埋め忘れた") → ファイル名を除去した原則になること
  - Scenario 3: 抽象語彙のみの Lesson (例: "確認なしに不可逆な操作を行ってはならない") → そのまま pass-through されること
  <!-- verify: fr-003 -->

  ```
  @mspec-delta 2026-05-28-112728-improve-postmortem-quality/specs/mspec-lessons-analyzer/spec.md
  Requirements implemented: FR-003
  Change: improve-postmortem-quality
  ```

- [x] **[実装]** `.claude/agents/mspec-lessons-analyzer.md` を編集し、step 5 の前に concreteness detection ステップ（step 5-pre）を追加する
  - concreteness signal の定義: ツール名（mspec, git, npm 等）・コマンド名・ファイル名（拡張子を含む文字列）・ファイルパス（`/` や `.` を含む文字列）
  - signal あり → 抽象化必須（signal を除去してプロセス原則テキストに変換、最大1段階）
  - signal なし → pass-through（変換しない）
  - step 5 の `text` 生成ルールを `design.md` の仕様に合わせて更新する
  <!-- verify: fr-003 -->

  ```
  @mspec-delta 2026-05-28-112728-improve-postmortem-quality/specs/mspec-lessons-analyzer/spec.md
  Requirements implemented: FR-003
  Change: improve-postmortem-quality
  ```

### mspec-nextaction-planner — FR-003 request_summary フィールド

- [x] **[E2E]** nextaction-planner 出力の3 Scenario を手動テスト用サンプルデータとして準備する
  - Scenario 1: Next Steps エントリから `request_summary` が生成され、改行なし1行（100文字以内）であること
  - Scenario 2: `request_summary` なしで `mspec new` が呼ばれても（optional）archive スキルがクラッシュしないこと（後方互換性）
  - Scenario 3: 長文 Next Steps から request_summary が100文字以内に収まること
  <!-- verify: fr-003 -->

  ```
  @mspec-delta 2026-05-28-112728-improve-postmortem-quality/specs/mspec-nextaction-planner/spec.md
  Requirements implemented: FR-003
  Change: improve-postmortem-quality
  ```

- [x] **[実装]** `.claude/agents/mspec-nextaction-planner.md` を編集し、出力スキーマに `request_summary` フィールドを追加する
  - `request_summary?: string` — optional フィールド（100文字以内の1行テキスト）
  - 生成ルール: `source_next_step` から「何を・なぜ変更するか」を1文で要約
  - 禁止文字: 改行・`"`・`$`・バックティック・`\`（シェルインジェクション防止）
  - Output Contract の JSON サンプルに `request_summary` フィールドを追記する
  - Constraints セクションに `request_summary` の禁止文字ルールを追記する
  <!-- verify: fr-003 -->

  ```
  @mspec-delta 2026-05-28-112728-improve-postmortem-quality/specs/mspec-nextaction-planner/spec.md
  Requirements implemented: FR-003
  Change: improve-postmortem-quality
  ```

### mspec-archive SKILL.md — --request フラグ追加

- [x] **[実装]** `.claude/skills/mspec-archive/SKILL.md` の step 6（line 72 付近）を更新する
  - `mspec new <kebab_name>` → `mspec new <kebab_name> --request "<request_summary>"（changes/ 配下のみ）`
  - `request_summary` が空または未存在の場合は `mspec new <kebab_name>` にフォールバックする旨を明記する
  <!-- verify: fr-003 -->

  ```
  @mspec-delta 2026-05-28-112728-improve-postmortem-quality/specs/mspec-nextaction-planner/spec.md
  Requirements implemented: FR-003
  Change: improve-postmortem-quality
  ```

## Phase 3: User Story

- [x] **[E2E 統合]** archive フロー全体を手動シミュレーションして動作を確認する
  - 架空の readme.md（Lessons セクション + Next Steps セクション付き）を用意する
  - mspec-lessons-analyzer を起動し、Lessons が適切に抽象化されること（具体事象 → プロセス原則）を確認する
  - mspec-nextaction-planner を起動し、出力 JSON に `request_summary` が含まれること・1行制限を確認する
  - archive スキルが `mspec new <kebab_name> --request "..."` を呼び出し、生成チェンジの `readme.md` の `## Request` に概略が記載されることを確認する
  <!-- verify: fr-003 -->

  ```
  @mspec-delta 2026-05-28-112728-improve-postmortem-quality/specs/mspec-lessons-analyzer/spec.md
  Requirements implemented: FR-003
  Change: improve-postmortem-quality
  ```

  ```
  @mspec-delta 2026-05-28-112728-improve-postmortem-quality/specs/mspec-nextaction-planner/spec.md
  Requirements implemented: FR-003
  Change: improve-postmortem-quality
  ```

## Phase 4: Polish

- [ ] checklist.md の `## Delta Spec Coverage` 項目を全て `[x]` にチェックする
- [ ] checklist.md の `## Source-of-Truth Regression` 項目（FR-001, FR-002）を確認し、regression がないことを確認する
- [ ] `mspec validate --change 2026-05-28-112728-improve-postmortem-quality` でエラーなしを確認する
- [ ] `mspec anchor check --change 2026-05-28-112728-improve-postmortem-quality` でアンカー解決エラーなしを確認する

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I. ステップ独立性 | ✅ Phase 2 の3タスクは独立して実行可能。相互依存なし（archive タスクは planner 変更後に実行すると統合テストが容易だが、依存は任意） |
| II. 決定論的マージ | ✅ 各タスクは1ファイル1変更に閉じている。SKILL.md の変更は line 72 の1箇所のみ |
| III. 質問駆動の要件確定 | ✅ 全設計判断は research/design フェーズで確定済み。追加の判断不要 |
| IV. 双方向アンカー | ✅ 各タスクのアンカーブロックが Delta Spec の FR-003 と対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ tasks.md は実装手順のみ。workflow.yaml への変更なし |
| VI. Security by Default | ✅ E2E タスクに禁止文字（`"`, `$`, バックティック, `\`）の検証を明示的に含める |
