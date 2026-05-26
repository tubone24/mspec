---
doc_type: Explanation
change: 2026-05-25-051411-security-as-default
---

# Proposal: Security as Default Capability

## Why

エージェント駆動開発では、エージェントが人間の手を借りずに権限境界・外部API・秘密情報に触れるコードを生成する。現在のmspecには「セキュリティを設計段階で問う」仕組みが存在しない。question-bankにsecurityカテゴリがなく、delta specにsecurity capabilitiesセクションがなく、Constitutionにもsecurityを第一級原則として扱う条文がない。issue.mdが「10テーマ中最も危険な遅れ」と指摘するこの欠落を、テンプレートと質問バンクの拡張によって修正する。

## Goals

- proposal.yamlに `security` カテゴリの質問4問を追加し、全changeで必須表示にする
- delta-spec テンプレート（ja/en/delta-spec.md 3ファイル）に `## Security Capabilities` セクションを追加し、proposalのsecurity回答からエージェントが半自動生成する
- `memory/constitution.md` と `packages/cli/templates/constitution.md` 両方に「VI. Security by Default」原則を追加する（I〜Vの連番を維持）
- mspec-proposalスキル（SKILL.md）にsecurity質問の取り扱い手順を明記する

## Non-Goals

- CLIによるsecurity自動検出（静的解析・SAST）の実装
- セキュリティ原則違反時の自動ブロック（validate errorへの昇格）
- 既存changeのdelta specへの遡及適用
- Constitution改訂手続き以外の governance 変更

## Capabilities (touched)

- `question-bank`
- `delta-spec-template`
- `constitution`
- `mspec-proposal`

## Open Questions

なし（3問の質問で全て確定済み）

## Decisions

| 質問 | 決定 |
|------|------|
| security質問の必須条件 | 全changeで必須（risk_tier問わず） |
| security capabilitiesの生成方法 | proposal回答からエージェントが半自動記述 |
| Constitution VIの適用スコープ | memory/constitution.mdとtemplates両方 |

---

## Constitution Check

| 原則 | Phase 0 評価 | Phase 1 評価 |
|------|-------------|-------------|
| I. ステップ独立性 | ✅ PASS — question-bank追加はproposalステップにのみ影響。既存ステップ間依存を増やさない | — |
| II. 決定論的マージ | ✅ PASS — YAMLとMarkdownへの純粋なテキスト追加。LLM非依存の変更 | — |
| III. 質問駆動の要件確定 | ✅ PASS — security質問をAskUserQuestionで1問1答する仕組みを強化する方向 | — |
| IV. 双方向アンカー | ✅ PASS — 実装対象はテンプレートファイル。アンカー対象の実装コードには@mspec-deltaアンカーを付与する | — |
| V. 強制ステップと拡張ステップの分離 | ✅ PASS — proposalステップの内容拡張のみ。workflow.yamlの強制ステップ定義は変更しない | — |
