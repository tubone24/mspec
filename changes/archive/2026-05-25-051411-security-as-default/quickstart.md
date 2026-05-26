---
doc_type: How-to
change: 2026-05-25-051411-security-as-default
---

# Quickstart: security-as-default

## Prerequisites

- mspecがインストール済みであること（`mspec --version` で確認）
- `packages/cli/templates/questions/proposal.yaml` への書き込み権限があること

## Setup

- `packages/cli/templates/` 以下のファイルへの変更は、次回 `mspec new` + proposal実行から自動的に反映される
- `memory/constitution.md` は **手動編集が必要**（既存プロジェクトに対して自動適用されない）
- 新規プロジェクト（`mspec init`）は `packages/cli/templates/constitution.md` からVI原則を自動継承する

## Try it (Golden Path)

### 1. Security質問が追加されているか確認する

```bash
mspec questions --phase proposal --json | jq '[.questions[] | select(.category == "security")]'
```

期待される出力（4問のsecurityカテゴリ質問）:
```json
[
  { "id": "PRP-SEC-001", "category": "security", "when": "always", ... },
  { "id": "PRP-SEC-002", "category": "security", "when": "always", ... },
  { "id": "PRP-SEC-003", "category": "security", "when": "always", ... },
  { "id": "PRP-SEC-004", "category": "security", "when": "always", ... }
]
```

### 2. 新規changeのproposalステップでsecurity質問が表示されることを確認する

```bash
mspec new my-test-feature
# /mspec:proposal を実行するとsecurity質問が4問表示される
```

### 3. Constitutionに VI. Security by Default が含まれるか確認する

```bash
grep -n "Security by Default" memory/constitution.md
grep "Version" memory/constitution.md
```

期待される出力:
```
<N>:### VI. Security by Default
Version: 1.1.0
```

### 4. delta-specテンプレートにSecurity Capabilitiesセクションがあるか確認する

```bash
grep -n "Security Capabilities" packages/cli/templates/artifacts/delta-spec.ja.md
grep -n "Security Capabilities" packages/cli/templates/artifacts/delta-spec.en.md
grep -n "Security Capabilities" packages/cli/templates/artifacts/delta-spec.md
```

期待される出力: 各ファイルで `## Security Capabilities` が1行ずつヒットする。

## Verify

```bash
# security質問が4問あること
mspec questions --phase proposal --json | jq '[.questions[] | select(.category == "security")] | length'
# → 4

# constitutionのバージョン確認
grep "Version" memory/constitution.md
# → Version: 1.1.0

# VI原則の存在確認
grep -c "Security by Default" memory/constitution.md
# → 1

# SKILL.mdのアンカー確認
grep "security-as-default" packages/cli/templates/claude/skills/mspec-proposal/SKILL.md
# → @mspec-delta アンカー行が表示される
```

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `mspec questions` でsecurity質問が出ない | proposal.yamlへの追記が反映されていない | `packages/cli/templates/questions/proposal.yaml` の末尾にPRP-SEC-001〜004が存在するか確認 |
| constitutionのVersionが1.0.0のまま | memory/constitution.mdの更新漏れ | `Version: 1.1.0` と `Last Amended: 2026-05-25` を手動で確認・修正 |
| delta-specにSecurity Capabilitiesがない | テンプレートの更新漏れ | 3つのdelta-spec テンプレートを確認（ja/en/delta-spec.md） |
