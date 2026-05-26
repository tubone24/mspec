<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# skill-observability Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Skill Observation Obligation

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

subagent を呼び出すステップの SKILL.md が存在するとき、このシステムは SHALL `.agent-runs.jsonl` へのログ記録手順を SKILL.md の手順内に明記する.

#### Scenario: SKILL.md への観測義務記述
- GIVEN `skills/mspec-proposal/SKILL.md` が存在する
- WHEN SKILL.md を参照した subagent が proposal ステップを実行する
- THEN SKILL.md の手順に「subagent 完了後に `.agent-runs.jsonl` へ実行メタデータを追記すること」が明記されている

#### Scenario: subagent フラグ付き 3 スキルへの適用
- GIVEN `workflow.yaml` で `subagent: true` が設定されているステップ（research / checklist / self-review）
- WHEN delta ステップで変更対象を確認する
- THEN mspec-research, mspec-checklist, mspec-review の 3 SKILL.md に観測義務セクション（`## Observation`）が追記されている

---

### Requirement: FR-002 — Observation Instruction Format

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

観測義務を SKILL.md に追記するとき、このシステムは SHALL ログ記録のタイミング（subagent 完了後）と記録先パス（`changes/<change>/.agent-runs.jsonl`）を明示する.

#### Scenario: 観測手順の最小構成
- GIVEN `skills/mspec-checklist/SKILL.md` が更新される
- WHEN 観測義務セクションを確認する
- THEN 「subagent 呼び出し完了後に `.agent-runs.jsonl` に追記する」旨と、記録する項目（step 名・開始時刻・context size・前提 artifact・修正指摘数）が記載されている

