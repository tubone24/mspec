<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# mspec-proposal Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — セキュリティ質問の動的生成への置き換え

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

proposal ステップにおいて、このシステムは SHALL PRP-SEC-001〜004 の固定質問を廃止し、代わりに FR-003 で規定されるサブエージェント分析と FR-004 で規定される動的質問生成フローを実行する。固定の PRP-SEC-001〜004 はスキル手順から完全に削除される。

#### Scenario: 固定質問が廃止されている

- GIVEN mspec-proposal スキルを任意の change で実行する
- WHEN security 質問フェーズが完了する
- THEN PRP-SEC-001・PRP-SEC-002・PRP-SEC-003・PRP-SEC-004 のいずれも AskUserQuestion で呼び出されていない

### Requirement: FR-002 — 動的セキュリティ質問回答の proposal.md 反映

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

動的生成されたセキュリティ質問（FR-004）への回答を収集した後、このシステムは SHALL その内容を `proposal.md` の `## Decisions` テーブルに、質問テキストと回答のペアで記録する。

#### Scenario: 動的質問の回答が proposal.md に記録される

- GIVEN proposal ステップで動的生成された security 質問に回答済みの change
- WHEN `changes/<change>/proposal.md` を読み込む
- THEN 動的生成された質問と回答のペアが `## Decisions` テーブルに記述されている

### Requirement: FR-003 — セキュリティサブエージェントによるコンテキスト分析

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

proposal ステップでセキュリティ質問を生成するとき、このシステムは SHALL サブエージェントを起動し、`readme.md`・`proposal.md`（草稿）・`specs/` 配下の全 spec.md・コードベース全体を読み取り専用で分析してセキュリティリスクを特定する。

#### Scenario: サブエージェントがコンテキストを分析する

- GIVEN mspec-proposal スキルが security 質問フェーズに到達したとき
- WHEN サブエージェントが起動される
- THEN サブエージェントは readme.md / proposal.md / specs/**/*.md / コードベースを読み取り、変更固有のセキュリティリスクリストを生成する

### Requirement: FR-004 — 動的セキュリティ質問の生成と提示

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

FR-003 の分析完了後、このシステムは SHALL サブエージェントが特定したリスクに基づいて 3〜5 問の変更固有セキュリティ質問を生成し、AskUserQuestion で提示する。

#### Scenario: 動的質問が提示される

- GIVEN サブエージェントがセキュリティリスク分析を完了している
- WHEN proposal ステップの security 質問フェーズが実行される
- THEN 変更内容に固有の質問が 3〜5 問 AskUserQuestion で提示され、PRP-SEC-001〜004 のハードコード質問は表示されない


