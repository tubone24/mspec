---
doc_type: How-to
---

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

# Quickstart: risk-tier-field

## Prerequisites

- `mspec` CLI がインストール済みであること
- プロジェクトで `mspec init` 済みであること
- Delta Spec（`changes/<change>/specs/<capability>/spec.md`）が作成済みであること

## Setup

```bash
# プロジェクトルートで確認
mspec validate --change <change-dir>
```

## Try it (Golden Path)

### 1. Delta Spec に risk_tier / blast_radius を記述する

`changes/<change>/specs/<capability>/spec.md` の FR ブロックに HTML コメントを追加する:

```markdown
### Requirement: FR-001 — 外部 API 連携処理

<!-- risk_tier: critical -->
<!-- blast_radius: external -->

外部 API を呼び出すとき、このシステムは SHALL レスポンスを検証する.

#### Scenario: 正常系
- GIVEN ...
- WHEN ...
- THEN ...
```

> **値の選択肢:**
> - `risk_tier`: `critical` | `standard` | `trivial`
> - `blast_radius`: `local` | `module` | `system` | `external`
> - 省略した場合は `risk_tier: standard` として扱われる

### 2. validate でフィールドを確認する

```bash
mspec validate --change <change-dir>
```

正常時: 警告なし（または Summary 警告のみ）で終了。

### 3. tasks.md 生成時の verify 分岐を確認する

tasks ステップ実行後、tasks.md で以下の分岐を確認する:

| risk_tier | tasks.md の verify アノテーション |
|-----------|----------------------------------|
| `critical` | `<!-- verify: human -->` |
| `standard` | `<!-- verify: fr-NNN -->` |
| `trivial` | アノテーションなし |

### 4. checklist.md の項目生成を確認する

checklist ステップ実行後:

| risk_tier | checklist.md |
|-----------|-------------|
| `critical` | `- [ ] ... <!-- verify: human -->` が生成される |
| `standard` | `- [ ] ... <!-- verify: fr-NNN -->` が生成される |
| `trivial` | 項目が生成されない |

## Verify

- `mspec validate` が exit code 0 で完了する
- 無効な値（例: `<!-- risk_tier: unknown -->`）を記述した場合 → exit code 1 + エラーメッセージが出力される
- tasks.md の critical FR に `<!-- verify: human -->` が付与されている
- checklist.md の trivial FR に対応する行が存在しない
- implement ステップ中に critical FR の `<!-- verify: human -->` が未チェックの場合 → 警告メッセージが出力される

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `Error: invalid risk_tier value "..."` | risk_tier に無効な値を指定した | `critical` / `standard` / `trivial` のいずれかに修正する |
| `Error: invalid blast_radius value "..."` | blast_radius に無効な値を指定した | `local` / `module` / `system` / `external` のいずれかに修正する |
| trivial FR が checklist.md に出現した | mspec-checklist-auditor が指示に従わなかった | checklist.md から該当行を手動で削除し、`mspec validate` で warning が消えることを確認する |
| critical FR に verify: human が付与されない | mspec-tasks/mspec-checklist が古い（risk_tier 未対応） | `mspec init` で skills を再インストールして再実行する |
