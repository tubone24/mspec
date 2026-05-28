---
doc_type: How-to
---

# Quickstart: dynamic-security-questions

## Prerequisites

- MSpec CLI がインストール済みで `mspec` コマンドが使えること
- `.mspec/config.yaml` で `integrations.claude.subagents: true` が設定されていること
- Claude Code（エージェント起動をサポートする環境）で実行していること

## Setup

この変更は `mspec-proposal` スキル・YAML 質問バンク・エージェント定義への修正であるため、セットアップは不要。変更を適用後（`mspec archive` 実行後）は自動的に新しい動作になる。

## Try it（Golden Path）

### 1. 新しい change を作成する

```bash
mspec new my-feature
```

### 2. proposal ステップを実行する

```
/mspec:continue
```

### 3. 機能質問（3〜5 問）に回答する

従来通り、機能スコープ・NFR・完了条件などの質問に回答する。

### 4. セキュリティ質問フェーズを確認する

機能質問の後、`mspec-security-analyzer` サブエージェントが起動し、今回の変更に固有のセキュリティリスクを分析する。

**期待される動作:**
- PRP-SEC-001（権限境界は？）/ PRP-SEC-002（アクセス増加は？）/ PRP-SEC-003（エージェント権限は？）/ PRP-SEC-004（ロールバック手段は？）という固定質問は**出ない**
- 代わりに、今回の変更内容に基づいた 3〜5 問の変更固有質問が AskUserQuestion で表示される

### 5. 動的質問に回答する

サブエージェントが生成した変更固有のセキュリティ質問に回答する。回答は `proposal.md` の `## Decisions` テーブルに記録される。

## Verify

proposal ステップ完了後、以下を確認する：

```bash
# proposal.md の Decisions テーブルを確認
grep -A 20 "## Decisions" changes/<change>/proposal.md
```

**確認ポイント:**
- `PRP-SEC-001` / `PRP-SEC-002` / `PRP-SEC-003` / `PRP-SEC-004` という行が `## Decisions` テーブルに**ない**こと
- 変更内容に固有の質問テキストと回答が記録されていること

```bash
# proposal.yaml に security カテゴリが残っていないことを確認
grep "PRP-SEC" packages/cli/templates/questions/proposal.yaml
# → 出力なしが正しい
```

## Troubleshooting

**「固定質問（PRP-SEC-001〜004）がまだ出る」:**
- `packages/cli/templates/questions/proposal.yaml` に PRP-SEC-001〜004 が残っていないか確認する
- プロジェクト固有の `questions/proposal.yaml` で同 ID を上書きしていないか確認する（`loadMergedBank` の上書き仕様により復活する）

**「サブエージェントが起動しない」:**
- `.mspec/config.yaml` の `integrations.claude.subagents` が `true` になっているか確認する
- Claude Code 環境で実行しているか確認する（Agent tool が利用可能な環境が必要）

**「質問数が 3〜5 問の範囲外になる」:**
- `mspec-security-analyzer` エージェント定義のプロンプトを確認する（`.claude/agents/mspec-security-analyzer.md`）
- 分析対象（`specs/` + `changes/<current>/`）のファイルが存在するか確認する
