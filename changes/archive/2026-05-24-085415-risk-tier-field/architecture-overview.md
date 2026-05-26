---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

# Architecture Overview: risk-tier-field

## System Diagram

```mermaid
flowchart TD
    A["Delta Spec\nspecs/&lt;cap&gt;/spec.md\n---\n&lt;!-- risk_tier: critical|standard|trivial --&gt;\n&lt;!-- blast_radius: local|module|system|external --&gt;"]

    subgraph CLI["TypeScript CLI Layer"]
        B["parseDeltaSpec()\ndelta-spec.ts\n→ RISK_TIER_RE / BLAST_RADIUS_RE\n→ default: standard"]
        C["RequirementSchema\ntypes/delta-spec.ts\nrisk_tier: z.enum().default('standard')\nblast_radius: z.enum().optional()"]
        D["validateArtifact()\nartifact-validator.ts\nerrors[] → exit 1\nwarnings[] → exit 0"]
    end

    subgraph Agent["Agent Prompt Layer (templates/claude/)"]
        E["mspec-checklist-auditor.md\ncritical → verify: human\nstandard → verify: fr-NNN\ntrivial → skip (no item)"]
        F["mspec-tasks SKILL.md\ncritical → verify: human\nstandard → verify: fr-NNN\ntrivial → no annotation"]
        G["mspec-implement SKILL.md\ncritical + unchecked verify:human\n→ Warning output"]
    end

    H["checklist.md\n✅ critical items (verify: human)\n✅ standard items (verify: fr-NNN)\n❌ trivial items (not generated)"]
    I["tasks.md\nannotated by risk_tier"]

    A --> B
    B --> C
    C --> D
    D -->|"invalid value → errors[]"| ERR["exit code 1\nError: invalid risk_tier value"]
    D -->|"trivial in checklist → warnings[]"| WARN["exit code 0\nWarning: trivial FR in checklist"]

    C -->|"Requirement + risk_tier"| E
    C -->|"Requirement + risk_tier"| F
    E --> H
    F --> I
    H --> G
```

## Data Model

### RequirementSchema（変更後）

```typescript
// packages/cli/src/types/delta-spec.ts
const RequirementSchema = z.object({
  fr_id:        z.string(),                                        // "FR-NNN"
  title:        z.string(),
  body:         z.string(),
  raw_block:    z.string(),
  scenarios:    z.array(ScenarioSchema),
  risk_tier:    z.enum(['critical', 'standard', 'trivial'])        // NEW
                 .default('standard'),
  blast_radius: z.enum(['local', 'module', 'system', 'external']) // NEW
                 .optional(),
});
```

### Delta Spec Markdown 表現（変更後）

```markdown
### Requirement: FR-001 — 外部 API 連携

<!-- risk_tier: critical -->
<!-- blast_radius: external -->

外部 API を呼び出すとき、このシステムは SHALL ...

#### Scenario: ...
```

## Validate フロー（変更後）

```mermaid
sequenceDiagram
    participant V as mspec validate
    participant P as parseDeltaSpec()
    participant AV as artifact-validator

    V->>AV: validateArtifact(spec.md)
    AV->>P: parseDeltaSpec(source)
    P-->>AV: { requirements, errors[], warnings[] }
    alt errors[] 非空
        AV-->>V: exit code 1 + Error メッセージ
    else warnings[] 非空
        AV-->>V: exit code 0 + Warning メッセージ
    else
        AV-->>V: exit code 0 (clean)
    end

    Note over V,AV: checklist.md × spec.md 整合チェック
    V->>AV: validateChecklist(checklist.md, spec.md)
    AV-->>V: warnings[] (trivial FR in checklist)
```

## Constitution Check

> Step: design | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 図はパーサー・バリデーション・エージェントプロンプト各層を独立して表現している |
| II. 決定論的マージ | ✅ | ✅ | architecture-overview.md は Reference ドキュメント。SoT spec にマージされない |
| III. 質問駆動の要件確定 | ✅ | ✅ | 設計判断はすべて AskUserQuestion で確定済み |
| IV. 双方向アンカー | ✅ | ✅ | @mspec-delta アンカーを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ステップ構造は変更なし |

### Complexity Tracking

None
