---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: dynamic-security-questions

## Summary

MSpec の `proposal` スキルのセキュリティ質問フェーズを、固定 4 問（PRP-SEC-001〜004）から、新規サブエージェント `mspec-security-analyzer` による動的生成に置き換える。変更対象は SKILL.md の手順テキスト・YAML 質問バンク・delta-spec テンプレート・新規エージェント定義の 4 種類。

## Technical Context

### 現状

`mspec-proposal/SKILL.md` の手順 4 に「Security カテゴリ（PRP-SEC-001〜004）の 4 問を AskUserQuestion で別枠として必ず提示すること」と明記されている。これらの質問は `packages/cli/templates/questions/proposal.yaml`（lines 106–155）に `category: security` / `when: always` としてハードコードされており、変更内容に関係なく毎回同一の質問が出る。

### 変更後

1. SKILL.md の手順 4 から固定 PRP-SEC 提示を削除し、代わりに `mspec-security-analyzer` サブエージェントをインライン呼び出しするステップ（4a）を追加する
2. サブエージェントは `specs/` と `changes/<current>/` を読み取り専用で分析し、3〜5 問の変更固有セキュリティ質問を返す
3. 親スキルがその質問を AskUserQuestion で提示し、回答を `## Decisions` テーブルに記録する
4. `proposal.yaml` の `security` カテゴリエントリを削除し、`mspec questions` コマンドへの固定質問の混入を防ぐ

## Project Structure

| ファイル | 操作 | 変更内容 |
|----------|------|----------|
| `.claude/skills/mspec-proposal/SKILL.md` | 修正 | 手順 4 のセキュリティ質問提示を削除し、手順 4a（サブエージェント起動）と手順 4b（動的質問提示）を追加。手順 5 の line 32「PRP-SEC-001〜004 の回答を記録すること」も動的質問形式に更新 |
| `packages/cli/templates/questions/proposal.yaml` | 修正 | lines 106–155（PRP-SEC-001〜004）を削除 |
| `packages/cli/templates/artifacts/delta-spec.ja.md` | 修正 | `## Security Capabilities` コメントスロットを動的フォーマットに更新 |
| `packages/cli/templates/artifacts/delta-spec.en.md` | 修正 | 同上（英語版） |
| `packages/cli/templates/artifacts/delta-spec.md` | 修正 | 同上（バイリンガル版） |
| `.claude/agents/mspec-security-analyzer.md` | 新規作成 | セキュリティ分析専用サブエージェント定義 |
| `memory/constitution.md` | 修正 | Principle VI の PRP-SEC-001〜004 ID 参照を削除し「変更固有セキュリティ質問（3〜5 問）」への言及に書き換える |

## Decisions

### D-1: サブエージェント呼び出し方式

SKILL.md 内でインラインに Agent tool を使う。`workflow.yaml` の `proposal.subagent: false` は変更しない。

**受け入れ基準（FR-003 Scenario 対応）:**
- GIVEN: proposal スキルが security 質問フェーズに到達したとき
- WHEN: SKILL.md の手順 4a が実行される
- THEN: `mspec-security-analyzer` エージェントが起動し、specs/ + changes/<current>/ を分析してリスクリストを返す

### D-2: mspec-security-analyzer エージェント定義

`.claude/agents/mspec-security-analyzer.md` を新規作成する。Inputs に `specs/` と `changes/<current>/` の内容を指定（OC-3 決定: proposal.md の Goals は「コードベース全体」を含むが、コスト効率を優先してスコープを限定した。詳細は `design-rationale.md` 参照）。出力形式は「質問テキスト・選択肢（2〜4 個）・multi_select フラグ」のリスト。

**受け入れ基準（FR-004 Scenario 対応）:**
- GIVEN: サブエージェントが分析完了している
- WHEN: proposal ステップの security 質問フェーズが実行される
- THEN: 3〜5 問の変更固有質問が AskUserQuestion で提示される

### D-3: proposal.yaml security エントリの削除

`proposal.yaml` の PRP-SEC-001〜004 を完全削除する。`QUESTION_CATEGORIES` の `'security'` 型自体は残す（将来の拡張を妨げない）。

**受け入れ基準（FR-001 Scenario 対応）:**
- GIVEN: 任意の change で mspec-proposal スキルを実行する
- WHEN: security 質問フェーズが完了する
- THEN: PRP-SEC-001〜004 のいずれも AskUserQuestion で呼び出されていない

### D-4: delta-spec テンプレートの Security Capabilities スロット更新

`## Security Capabilities` セクションのコメントを「動的生成セキュリティ質問と回答のペアをここに列挙する」汎用フォーマットに変更する。

**受け入れ基準（FR-002 Scenario 対応）:**
- GIVEN: 動的質問に回答済みの change
- WHEN: proposal.md の `## Decisions` テーブルを読む
- THEN: 動的生成質問と回答ペアが記述されている

### D-5: memory/constitution.md Principle VI の改訂

`memory/constitution.md` の Principle VI（Security by Default）を以下のように改訂する：

**改訂前:**
```
すべてのchangeのproposalステップにおいて、権限境界・外部API・メール/通知・秘密情報・認証に関するセキュリティ質問（PRP-SEC-001〜004）への回答を必須とする。
```

**改訂後:**
```
すべてのchangeのproposalステップにおいて、変更内容に固有のセキュリティ質問（3〜5問）への回答を必須とする。質問はmspec-security-analyzerサブエージェントが変更コンテキスト（specs/・changes/<current>/）を分析して動的に生成し、権限境界・アクセス増加・エージェント権限・ロールバック手段の4カテゴリを必ずカバーする。
```

**受け入れ基準:**
- GIVEN: `memory/constitution.md` を読む
- WHEN: Principle VI の本文を確認する
- THEN: `PRP-SEC-001〜004` という固定 ID への言及がなく、「動的生成」・「3〜5 問」・「4 カテゴリ」の記述がある

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK | OK — 変更は SKILL.md / YAML / エージェント定義のみ。他ステップの produced artifacts に影響しない |
| II 決定論的マージ | OK | OK — 各ファイルは単一箇所の変更。git revert で完全に元に戻せる |
| III 質問駆動の要件確定 | OK | OK — OC-1/3/4/5 を AskUserQuestion で確定。AskUserQuestion の 4 選択肢上限はサブエージェントが質問生成時に遵守する |
| IV 双方向アンカー | OK | OK — `@mspec-delta` アンカーを SKILL.md の変更箇所に付与する |
| V 強制ステップと拡張ステップの分離 | OK | OK — workflow.yaml の step 定義は不変。security フェーズは proposal ステップ内部の実装変更のみ |
| VI Security by Default | CAUTION | OK — サブエージェントへの権限付与はプロンプトで読み取り専用を明記。specs/ + changes/<current>/ に限定（OC-3 決定済み） |

### Complexity Tracking

None

## Self-Review

> Reviewer: mspec-self-reviewer subagent
> Date: 2026-05-27

### Findings

- [ok] FR-003 の受け入れ基準シナリオが design.md D-1・D-2 と architecture-overview.md シーケンス図に対応している
- [ok] FR-004 の 3〜5 問制約・AskUserQuestion 選択肢 4 個上限がクラス図に記載されている
- [ok] FR-001 (MODIFIED) の受け入れ基準シナリオが D-3 に記載されている
- [ok] FR-002 (MODIFIED) の受け入れ基準シナリオが D-4 に記載されている
- [ok] `memory/constitution.md` が Project Structure テーブルに追加されている
- [ok] architecture-overview.md に Mermaid System Diagram が存在する
- [ok] Quickstart の Golden Path・Verify ステップが論理的に完結している
- [warn] proposal.md のスコープ（「コードベース全体」含む）と design.md D-2 のスコープ（`specs/ + changes/<current>/`）の不一致 → D-2 に OC-3 決定の根拠注記を追加して解消（本セクション作成前に対応済み）
- [warn] SKILL.md line 32 の `## Decisions` 記録指示の更新が Project Structure テーブルに明示されていなかった → SKILL.md 行の変更内容列に追記して解消（本セクション作成前に対応済み）
- [warn] `memory/constitution.md` 改訂文言のドラフトが設計文書に存在しなかった → D-5 として改訂前後テキストを追記して解消（本セクション作成前に対応済み）

### Verdict

PASS-WITH-WARNINGS（警告はすべて解消済み）— 実装を妨げるブロッカーなし。
