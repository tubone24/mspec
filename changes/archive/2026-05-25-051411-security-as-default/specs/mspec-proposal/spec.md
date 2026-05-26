# Delta Spec: mspec-proposal

## ADDED Requirements

### Requirement: FR-001 — Security質問の実施義務

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

mspec-proposalスキル（SKILL.md）にsecurity質問フェーズの手順を追記し、このシステムは SHALL proposalステップでPRP-SEC-001・PRP-SEC-002・PRP-SEC-003・PRP-SEC-004の4問全てをAskUserQuestionで提示する。security質問はfunctional scope等の通常質問とは別枠で必ず提示し、3〜5問の上限に含まれない。

#### Scenario: mspec-proposal SKILLがsecurity質問を全問実施する
- GIVEN mspec-proposalスキルの手順に従いproposalステップを実行する
- WHEN AskUserQuestion呼び出しのログを確認する
- THEN PRP-SEC-001・PRP-SEC-002・PRP-SEC-003・PRP-SEC-004の4問全てがAskUserQuestionで呼び出されている

### Requirement: FR-002 — Security質問回答のproposal.md反映

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

security質問（PRP-SEC-001〜PRP-SEC-004）の回答を収集した後、このシステムは SHALL その内容を `proposal.md` の `## Decisions` テーブルまたは専用セクションに記録する。

#### Scenario: security質問回答がproposal.mdに記録される
- GIVEN proposalステップでPRP-SEC-001〜PRP-SEC-004に回答済みのchange
- WHEN `changes/<change>/proposal.md` を読み込む
- THEN security質問の回答が `## Decisions` テーブルまたは `## Security` セクションに記述されている

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
