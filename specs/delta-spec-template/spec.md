<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# delta-spec-template Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Security Capabilitiesセクションの追加

<!-- risk_tier: standard -->
<!-- blast_radius: system -->

`packages/cli/templates/artifacts/delta-spec.ja.md`・`delta-spec.en.md`・`delta-spec.md`（バイリンガル混在版）の3ファイルに `## Security Capabilities` セクションを追加し、このシステムは SHALL mspec-proposalスキルがsecurity質問回答を基に当セクションを半自動記述する。

#### Scenario: delta-spec.ja.mdにSecurity Capabilitiesセクションが存在する
- GIVEN `packages/cli/templates/artifacts/delta-spec.ja.md` を読み込む
- WHEN ファイル内容を確認する
- THEN `## Security Capabilities` という見出しが存在し、権限境界・外部API・秘密情報アクセス・ロールバック手段のプレースホルダーが含まれる

### Requirement: FR-002 — Security Capabilitiesの半自動生成

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

mspec-proposalスキルがsecurity質問（PRP-SEC-001〜PRP-SEC-004）の回答を取得した後、このシステムは SHALL その回答内容を `## Security Capabilities` セクションに反映したdelta specを生成する。

#### Scenario: proposal回答がdelta specのSecurity Capabilitiesに反映される
- GIVEN proposalステップでPRP-SEC-001〜PRP-SEC-004の全問に回答済みのchange
- WHEN mspec-deltaステップで `changes/<change>/specs/<capability>/spec.md` が生成される
- THEN `## Security Capabilities` セクションにsecurity質問の回答が記述されている

