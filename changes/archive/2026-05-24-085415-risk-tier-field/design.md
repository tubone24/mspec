---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

# Design: risk-tier-field

## Summary

Delta Spec の各 FR-NNN に `risk_tier`（critical / standard / trivial）と `blast_radius`（local / module / system / external）フィールドを追加する。パーサーレイヤでフィールドを抽出・検証し、エージェントプロンプト（SKILL.md / mspec-checklist-auditor.md）側で verify アノテーション生成ルールを更新する。

**実装の中心は2層**:
1. **TypeScript CLI 層**: スキーマ定義・パース・バリデーション（エラー出力と警告出力を分離）
2. **エージェントプロンプト層**: verify アノテーション付与・checklist 項目生成有無のルール更新

> 変更は `templates/claude/` 側（SoT）に行い、`.claude/` 側は直接編集しない（`mspec init` の冪等性を守る）。

## Technical Context

- **パーサー**: `packages/cli/src/parser/delta-spec.ts` — `collectRequirements()` が FR ブロックの `raw_block` 全体を文字列として保持している
- **型定義**: `packages/cli/src/types/delta-spec.ts` — Zod スキーマで `RequirementSchema` を定義
- **バリデーション**: `packages/cli/src/lib/artifact-validator.ts` — `parseDeltaSpec()` の結果を使い `warnings[]` を表面化
- **verify 生成**: `templates/claude/agents/mspec-checklist-auditor.md` — サブエージェントプロンプトで verify アノテーションを動的付与
- **tasks 生成**: `templates/claude/skills/mspec-tasks/SKILL.md` — スキルプロンプトで tasks.md を生成

## Project Structure

変更対象ファイル:

| ファイル | 変更種別 | 担当 FR |
|---------|---------|---------|
| `packages/cli/src/types/delta-spec.ts` | 修正 | delta-spec FR-001〜FR-005 |
| `packages/cli/src/parser/delta-spec.ts` | 修正 | delta-spec FR-001〜FR-003 |
| `packages/cli/src/lib/artifact-validator.ts` | 修正 | delta-spec FR-004〜FR-005、verify-routing FR-003 |
| `templates/artifacts/delta-spec.ja.md` | 修正 | verify-routing FR-001 |
| `templates/claude/agents/mspec-checklist-auditor.md` | 修正 | verify-routing FR-003 |
| `templates/claude/skills/mspec-tasks/SKILL.md` | 修正 | verify-routing FR-002 |
| `templates/claude/skills/mspec-implement/SKILL.md` | 修正 | verify-routing FR-004 |

## Decisions

### D-01: フィールド表現形式 — HTML コメント

**決定**: `<!-- risk_tier: critical | standard | trivial -->` を FR ブロック本文内（H3 直後・EARS 本文より前）に配置する。

**受け入れ基準 → delta-spec FR-001/FR-002 Scenario**:
- `mspec validate --change <change>` が `risk_tier: critical` を正常に認識し、エラーを出さない
- `mspec validate --change <change>` が `blast_radius: external` を正常に認識し、エラーを出さない

### D-02: パース方法 — raw_block 正規表現

**決定**: `collectRequirements()` 内で `raw_block` 文字列に以下の正規表現を適用する:
```
RISK_TIER_RE  = /<!--\s*risk_tier:\s*(critical|standard|trivial)\s*-->/
BLAST_RADIUS_RE = /<!--\s*blast_radius:\s*(local|module|system|external)\s*-->/
```

**受け入れ基準 → delta-spec FR-003 Scenario**:
- `risk_tier` 未記載の既存 FR を読み込んだとき、`risk_tier: 'standard'` として返す

### D-03: バリデーション — errors / warnings の2層分離

**決定**:
- **スキーマ違反**（無効な risk_tier / blast_radius 値）→ `parseDeltaSpec` に `errors: string[]` フィールドを追加し、`validateArtifact` が errors を exit code 1 に変換
- **artifact 間不整合**（trivial FR が checklist.md に出現）→ `warnings[]` のみ（exit code は変わらない）

**受け入れ基準 → delta-spec FR-004/FR-005 Scenario**:
- `risk_tier: unknown` → `Error: invalid risk_tier value "unknown". Must be critical | standard | trivial` + exit code 1
- `blast_radius: global` → `Error: invalid blast_radius value "global". Must be local | module | system | external` + exit code 1

**受け入れ基準 → verify-routing FR-003 Scenario**:
- trivial FR が checklist.md に出現 → `Warning: FR-NNN (trivial) should not appear in checklist.md` + exit code 0

### D-04: デフォルト値 — パーサーレイヤで補完

**決定**: `RequirementSchema` に `risk_tier: z.enum([...]).default('standard')` を定義し、パーサーが省略時に `standard` を設定する。

### D-05: blast_radius — メタデータのみ

**決定**: `blast_radius` は今回の verify 分岐に影響させない。パースして型定義に含めるが、tasks/checklist/implement の分岐ロジックには使わない。将来の security capability 連携のためにデータのみ保持する。

### D-07: エージェントプロンプト側の verify 分岐ルール

**決定**: `templates/claude/agents/mspec-checklist-auditor.md` および `templates/claude/skills/mspec-tasks/SKILL.md` に以下の分岐ルールを追加する:

| risk_tier | checklist.md | tasks.md |
|-----------|-------------|---------|
| `critical` | `<!-- verify: human -->` 付き項目を生成 | `<!-- verify: human -->` アノテーション |
| `standard` | `<!-- verify: fr-NNN -->` 付き項目を生成（既存動作） | `<!-- verify: fr-NNN -->` アノテーション（既存動作） |
| `trivial` | 項目を生成しない | verify アノテーションなし |

**受け入れ基準 → verify-routing FR-001〜FR-005 の全 Scenario**:
- delta init でプレースホルダー生成（FR-001）
- tasks.md の verify 分岐（FR-002 critical/trivial シナリオ）
- checklist.md の項目生成有無（FR-003 critical/trivial シナリオ）
- implement での critical 未達警告（FR-004）
- risk_tier 未記載 FR の後方互換（FR-005）

### D-06: 変更の主対象 — templates/claude/ が SoT

**決定**: `templates/claude/skills/` と `templates/claude/agents/` を変更する。`.claude/skills/` 等のインストール済みディレクトリは `mspec init` で再生成する。

## Constitution Check

> Step: design | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 各実装ファイルは独立して変更可能。パーサーが型定義に依存するが、ステップ間の新たな依存は増えない |
| II. 決定論的マージ | ✅ | ✅ | risk_tier/blast_radius は FR の追加フィールド。ADDED/MODIFIED/REMOVED/RENAMED マージロジックは変更なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | 全設計判断（blast_radius 扱い / trivial enforce / warning vs error）を AskUserQuestion で確定済み |
| IV. 双方向アンカー | ✅ | ✅ | design.md に @mspec-delta アンカーを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ステップ構造は変更なし。フィールド追加と SKILL.md 更新のみ |

### Complexity Tracking

None

## Self-Review

> Reviewed: 2026-05-24 | Reviewer: mspec-self-reviewer

### Findings

1. [warning] **proposal Goal #4 と Delta Spec の乖離** — proposal.md Goal #4「trivial FR は `verify: fr-NNN`（自動）のみ許可する」が、AskUserQuestion での決定（trivial → checklist 項目を生成しない）と乖離していた。proposal.md を修正済み。

2. [note] **verify-routing FR-001/FR-002/FR-004 に対応する明示的 Decision がなかった** — architecture-overview.md の図のみで Design Decision として明文化されていなかった。D-07 を追加済み。

3. [note] **quickstart.md に `mspec delta init` のステップ言及なし** — verify-routing FR-001 との整合性は低いが、quickstart は How-to であり FR 検証の主手段ではないため対処しない。

4. [note] **両 capability の同番号 FR による verify アノテーション曖昧性** — checklist.md に記録済み。将来の change で改善する（proposal.md Open Questions に追記済み）。

### Constitution Re-Evaluation

全 5 原則について独立再評価した結果、全 artifact の Phase 0 / Phase 1 評価と一致。不一致なし。

### Verdict

PASS
