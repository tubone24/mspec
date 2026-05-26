---
doc_type: How-to
change: 2026-05-25-051411-security-as-default
---

# Tasks: security-as-default

## Phase 1: Setup

- [ ] design.md・checklist.md・research.mdを再読してスコープを確認する（実装ファイル7つ）

## Phase 2: Foundational — question-bank

### E2E: security質問が mspec questions に現れることを確認する（RED）

- [ ] `mspec questions --phase proposal --json` を実行し、現状でsecurityカテゴリが存在しないことを確認する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/question-bank/spec.md
  Requirements implemented: FR-001, FR-002, FR-003
  Change: security-as-default
  ```
  <!-- verify: fr-001 -->

### IMPL: proposal.yaml に security カテゴリ4問を追加する（GREEN）

- [ ] `packages/cli/templates/questions/proposal.yaml` の末尾に PRP-SEC-001〜004を追加する（YAMLインデント・boolean型・multi_selectに注意）
  - PRP-SEC-001: 権限境界（multi_select: true）
  - PRP-SEC-002: アクセス増加（multi_select: true）
  - PRP-SEC-003: エージェント権限付与（multi_select: false）
  - PRP-SEC-004: ロールバック手段（multi_select: false）

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/question-bank/spec.md
  Requirements implemented: FR-001, FR-002, FR-003
  Change: security-as-default
  ```
  <!-- verify: fr-001 -->

### E2E: security質問が mspec questions に現れることを確認する（GREEN 検証）

- [ ] `mspec questions --phase proposal --json | jq '[.questions[] | select(.category == "security")] | length'` が `4` を返すことを確認する
- [ ] 各質問に `when: always` が設定されていることを確認する
- [ ] PRP-SEC-001・002の `multi_select` が `true`、003・004が `false` であることを確認する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/question-bank/spec.md
  Requirements implemented: FR-001, FR-002, FR-003
  Change: security-as-default
  ```
  <!-- verify: fr-003 -->

## Phase 2: Foundational — delta-spec-template

### E2E: delta-spec テンプレートに Security Capabilities がないことを確認する（RED）

- [ ] `grep "Security Capabilities" packages/cli/templates/artifacts/delta-spec.ja.md` がヒットしないことを確認する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/delta-spec-template/spec.md
  Requirements implemented: FR-001
  Change: security-as-default
  ```
  <!-- verify: fr-001 -->

### IMPL: delta-spec 3テンプレートに Security Capabilities セクションを追加する（GREEN）

- [ ] `packages/cli/templates/artifacts/delta-spec.ja.md` の `## ADDED Requirements` 直前に `## Security Capabilities` セクション（HTMLコメントのみ）を挿入する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/delta-spec-template/spec.md
  Requirements implemented: FR-001
  Change: security-as-default
  ```
  <!-- verify: fr-001 -->

- [ ] `packages/cli/templates/artifacts/delta-spec.en.md` に同様のセクションを挿入する（英語版プレースホルダーで）

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/delta-spec-template/spec.md
  Requirements implemented: FR-001
  Change: security-as-default
  ```
  <!-- verify: fr-001 -->

- [ ] `packages/cli/templates/artifacts/delta-spec.md`（バイリンガル混在版）に同様のセクションを挿入する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/delta-spec-template/spec.md
  Requirements implemented: FR-001
  Change: security-as-default
  ```
  <!-- verify: fr-001 -->

### E2E: Security Capabilities セクションが3テンプレート全てに存在することを確認する（GREEN 検証）

- [ ] `grep -c "Security Capabilities" packages/cli/templates/artifacts/delta-spec.ja.md packages/cli/templates/artifacts/delta-spec.en.md packages/cli/templates/artifacts/delta-spec.md` が各ファイルで `1` を返すことを確認する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/delta-spec-template/spec.md
  Requirements implemented: FR-001, FR-002
  Change: security-as-default
  ```
  <!-- verify: fr-002 -->

## Phase 2: Foundational — constitution

### E2E: constitution に VI 原則が存在しないことを確認する（RED）

- [ ] `grep "Security by Default" memory/constitution.md` がヒットしないことを確認する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/constitution/spec.md
  Requirements implemented: FR-001
  Change: security-as-default
  ```
  <!-- verify: human -->

### IMPL: memory/constitution.md に VI 原則を追加する（GREEN）

- [ ] `memory/constitution.md` の `### V. 強制ステップと拡張ステップの分離` 直後・`## Additional Constraints` 直前に `### VI. Security by Default` 原則を挿入する
- [ ] `Version: 1.0.0 → 1.1.0`・`Last Amended: 2026-05-25` を更新する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/constitution/spec.md
  Requirements implemented: FR-001
  Change: security-as-default
  ```
  <!-- verify: human -->

### IMPL: packages/cli/templates/constitution.md に III〜VI 原則を追加する（GREEN）

- [ ] `packages/cli/templates/constitution.md` の `### II.` プレースホルダー直後に `### III.`・`### IV.`・`### V.` プレースホルダーを追加する
- [ ] `### VI. Security by Default` 実文（memory/constitution.mdと同一テキスト）を追加する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/constitution/spec.md
  Requirements implemented: FR-002
  Change: security-as-default
  ```
  <!-- verify: fr-002 -->

### E2E: constitution に VI 原則・バージョン更新が存在することを確認する（GREEN 検証）

- [ ] `grep -n "Security by Default" memory/constitution.md` がヒットすることを確認する
- [ ] `grep "Version" memory/constitution.md` が `Version: 1.1.0` を返すことを確認する
- [ ] `grep "Security by Default" packages/cli/templates/constitution.md` がヒットすることを確認する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/constitution/spec.md
  Requirements implemented: FR-001, FR-002
  Change: security-as-default
  ```
  <!-- verify: human -->

## Phase 2: Foundational — mspec-proposal SKILL

### E2E: SKILL.md に security 質問手順がないことを確認する（RED）

- [ ] `grep "PRP-SEC" packages/cli/templates/claude/skills/mspec-proposal/SKILL.md` がヒットしないことを確認する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/mspec-proposal/spec.md
  Requirements implemented: FR-001
  Change: security-as-default
  ```
  <!-- verify: fr-001 -->

### IMPL: SKILL.md に security 質問手順と @mspec-delta アンカーを追加する（GREEN）

- [ ] 手順4の説明文に「PRP-SEC-001〜004の4問をAskUserQuestionで別枠として必ず提示すること（3〜5問の上限に含まれない）」を追加する
- [ ] 手順5（proposal.md生成）に「`## Decisions` テーブルにPRP-SEC-001〜004の回答を記録する」を追加する
- [ ] PRP-SEC-003の選択肢「あり」を選んだ場合にOpen Questionsへの転記を手順で明示する
- [ ] ファイル先頭の `@mspec-delta` アンカーブロックを追記する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/mspec-proposal/spec.md
  Requirements implemented: FR-001, FR-002
  Change: security-as-default
  ```
  <!-- verify: fr-001 -->

### E2E: SKILL.md に PRP-SEC 言及とアンカーが存在することを確認する（GREEN 検証）

- [ ] `grep "PRP-SEC" packages/cli/templates/claude/skills/mspec-proposal/SKILL.md` がヒットすることを確認する
- [ ] `grep "security-as-default" packages/cli/templates/claude/skills/mspec-proposal/SKILL.md` がアンカー行を返すことを確認する

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/mspec-proposal/spec.md
  Requirements implemented: FR-001, FR-002
  Change: security-as-default
  ```
  <!-- verify: fr-002 -->

## Phase 3: User Story — ゴールデンパス確認

- [ ] `mspec new test-security-flow` で新規changeを作成し、proposalステップでPRP-SEC-001〜004の4問が全て表示されることを確認する（手動実行）

  ```
  anchor: @mspec-delta 2026-05-25-051411-security-as-default/specs/mspec-proposal/spec.md
  Requirements implemented: FR-001, FR-002
  Change: security-as-default
  ```
  <!-- verify: fr-002 -->

## Phase 4: Polish

- [ ] `mspec anchor check --change 2026-05-25-051411-security-as-default` でアンカー整合性を確認する
- [ ] `mspec validate --change 2026-05-25-051411-security-as-default` でchange全体を確認する
- [ ] checklist.mdの全項目を順番に確認し、完了した項目をチェックする
- [ ] `mspec archive --change 2026-05-25-051411-security-as-default` を実行してchangeをアーカイブする

---

## Constitution Check

| 原則 | Phase 0 評価 | Phase 1 評価 |
|------|-------------|-------------|
| I. ステップ独立性 | ✅ PASS — tasksは前ステップ成果物を入力として独立して処理する | — |
| II. 決定論的マージ | ✅ PASS — タスクリストはLLM依存なく確定的に実行可能 | — |
| III. 質問駆動の要件確定 | ✅ PASS — 全要件はproposal/designの質問回答から導出済み | — |
| IV. 双方向アンカー | ✅ PASS — 全実装・E2Eタスクに@mspec-deltaアンカーを付与 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ PASS — tasksステップはworkflow.yamlの強制ステップ定義を変更しない | — |
