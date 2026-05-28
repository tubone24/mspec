---
doc_type: How-to
---

# Tasks: dynamic-security-questions

## Phase 1 — Setup / テスト基盤（E2E 先行）

### Task 1.1: E2E — FR-001 固定質問廃止シナリオの手動テスト仕様を作成する

`mspec new` で任意の change を作成し、proposal ステップを実行したとき PRP-SEC-001〜004 が AskUserQuestion で提示されないことを確認するテスト仕様を記述する。

- 実行: `mspec new test-fr001 && /mspec:continue` まで進め、security 質問フェーズで固定質問が出ないことを確認する
- 期待: `proposal.yaml` に PRP-SEC が存在せず、SKILL.md の手順 4 に固定提示ロジックがないこと

```
@mspec-delta 2026-05-27-070619-dynamic-security-questions/specs/mspec-proposal/spec.md
Requirements implemented: FR-001
Change: dynamic-security-questions
```

<!-- verify: fr-001 -->

---

### Task 1.2: E2E — FR-003/004 動的質問生成シナリオの手動テスト仕様を作成する

`mspec-security-analyzer` エージェントが起動し、3〜5 問の変更固有質問が提示されることを確認するテスト仕様を記述する。

- 実行: proposal ステップの security フェーズで、サブエージェント起動ログが現れ、動的質問が AskUserQuestion で 1 問 1 答で出ることを確認する
- 期待: 質問数が 3〜5 問の範囲内、選択肢が最大 4 個、変更コンテキストに固有の内容であること

```
@mspec-delta 2026-05-27-070619-dynamic-security-questions/specs/mspec-proposal/spec.md
Requirements implemented: FR-003, FR-004
Change: dynamic-security-questions
```

<!-- verify: fr-003 --><!-- verify: fr-004 -->

---

## Phase 2 — Foundational（基盤実装）

### Task 2.1: `.claude/agents/mspec-security-analyzer.md` を新規作成する

セキュリティ分析専用サブエージェントの定義ファイルを作成する。

**実装内容:**
- frontmatter: `name: mspec-security-analyzer`, `description: Security analyzer subagent for the mspec proposal step`
- Inputs: `specs/` + `changes/<current>/readme.md` + `changes/<current>/proposal.md`（読み取り専用）
- Job: 変更コンテキストからセキュリティリスクを特定し、3〜5 問の変更固有質問（選択肢 2〜4 個・multi_select フラグ付き）を返す
- Constraints: ファイルの書き込み・削除を行わない（読み取り専用）、「権限境界・アクセス増加・エージェント権限・ロールバック手段」の 4 カテゴリを必ずカバーする
- Output format: `質問テキスト / 選択肢リスト / multi_select` の markdown リスト

```
@mspec-delta 2026-05-27-070619-dynamic-security-questions/specs/mspec-proposal/spec.md
Requirements implemented: FR-003, FR-004
Change: dynamic-security-questions
```

<!-- verify: fr-003 --><!-- verify: fr-004 -->

---

### Task 2.2: `packages/cli/templates/questions/proposal.yaml` から PRP-SEC-001〜004 を削除する

`proposal.yaml` の lines 106–155（security カテゴリの 4 エントリ）を完全削除する。

**確認:** 削除後に `mspec questions --phase proposal --json` を実行し、レスポンスに `category: security` のエントリが含まれないことを確認する。

```
@mspec-delta 2026-05-27-070619-dynamic-security-questions/specs/mspec-proposal/spec.md
Requirements implemented: FR-001
Change: dynamic-security-questions
```

<!-- verify: fr-001 -->

---

### Task 2.3: delta-spec テンプレート 3 種の `## Security Capabilities` スロットを更新する

以下の 3 ファイルの `## Security Capabilities` コメントスロット（lines 5–9）を更新する:
- `packages/cli/templates/artifacts/delta-spec.ja.md`
- `packages/cli/templates/artifacts/delta-spec.en.md`
- `packages/cli/templates/artifacts/delta-spec.md`

**変更内容:** 固定 4 スロット（`PRP-SEC-001〜004` の ID 参照）を「動的生成セキュリティ質問と回答のペアを列挙する」汎用コメントに置き換える。3 ファイル間で内容を一致させる。

```
@mspec-delta 2026-05-27-070619-dynamic-security-questions/specs/mspec-proposal/spec.md
Requirements implemented: FR-002
Change: dynamic-security-questions
```

<!-- verify: fr-002 -->

---

### Task 2.4: `memory/constitution.md` の Principle VI を改訂する

`memory/constitution.md` の Principle VI（Security by Default）のテキストを `design.md` D-5 の改訂案に従い書き換える。

**改訂前の対象行（line 31）:**
> すべてのchangeのproposalステップにおいて、権限境界・外部API・メール/通知・秘密情報・認証に関するセキュリティ質問（PRP-SEC-001〜004）への回答を必須とする。

**改訂後:**
> すべてのchangeのproposalステップにおいて、変更内容に固有のセキュリティ質問（3〜5問）への回答を必須とする。質問はmspec-security-analyzerサブエージェントが変更コンテキスト（specs/・changes/<current>/）を分析して動的に生成し、権限境界・アクセス増加・エージェント権限・ロールバック手段の4カテゴリを必ずカバーする。

（アンカーなし — constitution.md は Delta Spec の外部ファイルのため）

---

## Phase 3 — User Story（スキル本体の実装）

### Task 3.1: `.claude/skills/mspec-proposal/SKILL.md` の手順 4 を修正する

**削除する内容（手順 4 末尾）:**
```
**その後、Securityカテゴリ（PRP-SEC-001〜004）の4問をAskUserQuestionで別枠として必ず提示すること（3〜5問の上限に含まれない）。** PRP-SEC-003で「あり」を選択した場合は、その内容を `## Open Questions` に記録すること。
```

**追加する内容（手順 4 の後に 4a・4b として挿入）:**
```
4a. サブエージェント `mspec-security-analyzer` を Agent tool でインライン起動する。
    - 分析スコープ: `specs/` + `changes/<current>/readme.md` + `changes/<current>/proposal.md`（読み取り専用）
    - 返却物: 変更固有のセキュリティリスクリスト + 3〜5 問の質問（各質問: テキスト・選択肢 2〜4 個・multi_select フラグ）
4b. サブエージェントが返した質問を AskUserQuestion で 1 問 1 答（1 per call）で提示する。回答を `proposal.md` の `## Decisions` テーブルに質問テキスト/回答ペアで記録する。
```

**更新する内容（手順 5 内 line 32 相当）:**
```
## Decisions テーブルに動的生成セキュリティ質問と回答のペアを記録すること。
```
（旧: `PRP-SEC-001〜004のsecurity質問の回答を記録すること`）

また、SKILL.md 冒頭の `@mspec-delta` アンカーブロックを追加する:
```
<!-- @mspec-delta 2026-05-27-070619-dynamic-security-questions/specs/mspec-proposal/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004 -->
<!-- Change: dynamic-security-questions -->
```

```
@mspec-delta 2026-05-27-070619-dynamic-security-questions/specs/mspec-proposal/spec.md
Requirements implemented: FR-001, FR-002, FR-003, FR-004
Change: dynamic-security-questions
```

<!-- verify: fr-001 --><!-- verify: fr-002 --><!-- verify: fr-003 --><!-- verify: fr-004 -->

---

## Phase 4 — Polish / 検証

### Task 4.1: `mspec validate` と `mspec anchor check` を実行して整合性を確認する

```bash
mspec validate --change 2026-05-27-070619-dynamic-security-questions
mspec anchor check --change 2026-05-27-070619-dynamic-security-questions
```

- anchor check が全アンカーを解決し、FR-001〜FR-004 が双方向にリンクされていることを確認する
- validate が warning のみで error がないことを確認する

### Task 4.2: quickstart の Golden Path を実行して動作確認する

`quickstart.md` の手順に従い、実際に `mspec new` → proposal ステップを実行し、固定質問が出ず動的質問が提示されることを実地確認する。

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK — 変更ファイルはすべて proposal スキルのスコープ内 | — |
| II 決定論的マージ | OK — 各タスクは単一ファイル・単一箇所の変更 | — |
| III 質問駆動の要件確定 | OK — E2E タスクが実装タスクの前に配置されている | — |
| IV 双方向アンカー | OK — 全実装タスクに `@mspec-delta` アンカーブロックを付与 | — |
| V 強制ステップと拡張ステップの分離 | OK — workflow.yaml は不変 | — |
| VI Security by Default | OK — Task 2.4 で constitution.md Principle VI を改訂する | — |
