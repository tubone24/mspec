---
doc_type: Reference
change: 2026-05-25-051411-security-as-default
---

# Architecture Overview: security-as-default

## System Diagram

変更対象ファイルと既存コンポーネントの関係：

```mermaid
graph TD
    subgraph CLI["mspec CLI"]
        Q["mspec questions\n--phase proposal --json"]
        INIT["mspec init"]
        ARCHIVE["mspec archive"]
    end

    subgraph templates["packages/cli/templates/"]
        PY["questions/proposal.yaml\n(+security category PRP-SEC-001〜004)"]
        DJ["artifacts/delta-spec.ja.md\n(+Security Capabilities section)"]
        DE["artifacts/delta-spec.en.md\n(+Security Capabilities section)"]
        DM["artifacts/delta-spec.md\n(+Security Capabilities section)"]
        CT["constitution.md\n(+VI. Security by Default)"]
        SK["claude/skills/mspec-proposal/SKILL.md\n(+security question procedure)"]
    end

    subgraph memory["memory/"]
        MC["constitution.md\n(+VI. Security by Default\nVersion 1.1.0)"]
    end

    subgraph change["changes/<change>/"]
        PR["proposal.md\n(security answers in Decisions)"]
        DS["specs/*/spec.md\n(## Security Capabilities)"]
    end

    Q -->|"reads"| PY
    INIT -->|"copies"| CT
    INIT -->|"creates"| MC
    ARCHIVE -->|"merges ADDED/MODIFIED/REMOVED/RENAMED\n(Security Capabilities section passthrough)"| DS

    SK -->|"instructs agent to ask"| PY
    SK -->|"instructs agent to write"| PR
    PY -->|"populates questions"| PR
    PR -->|"informs"| DS
```

## Sequence Diagram: Security Questions Flow

proposalステップでのsecurity質問フロー：

```mermaid
sequenceDiagram
    participant User
    participant Agent as mspec-proposal Agent
    participant CLI as mspec CLI
    participant QBank as proposal.yaml
    participant Proposal as proposal.md

    Agent->>CLI: mspec questions --phase proposal --json
    CLI->>QBank: load all questions
    QBank-->>CLI: [{id: PRP-SEC-001, category: security, when: always}, ...]
    CLI-->>Agent: questions JSON (including 4 security questions)

    loop For each security question (PRP-SEC-001〜004)
        Agent->>User: AskUserQuestion (security category)
        User-->>Agent: answer
    end

    Agent->>Proposal: write ## Decisions (including security answers)
    Agent->>Proposal: write security question responses recorded
```

## Data Flow: Constitution Update

```mermaid
flowchart LR
    subgraph source["変更元"]
        T["templates/constitution.md\n(VI. Security by Default 追加)"]
    end

    subgraph existing["既存プロジェクト（手動更新）"]
        M["memory/constitution.md\n(VI. Security by Default 追加\nVersion: 1.1.0)"]
    end

    subgraph new["新規プロジェクト（自動）"]
        N["memory/constitution.md\n(mspec init でコピー)"]
    end

    T -->|"mspec init (新規)"| N
    T -.->|"このchangeで直接編集（既存）"| M
```

## Component Overview

| コンポーネント | 役割 | 変更種別 |
|--------------|------|---------|
| `proposal.yaml` | security質問バンク | 追記（末尾に4問追加） |
| `delta-spec.ja/en/delta-spec.md` | delta specテンプレート | 追記（Security Capabilitiesセクション） |
| `memory/constitution.md` | 現プロジェクトの原則集 | 追記（VI原則 + バージョン更新） |
| `templates/constitution.md` | 新規プロジェクト雛形 | 修正（III〜V プレースホルダー + VI実文） |
| `mspec-proposal/SKILL.md` | エージェント実行手順 | 修正（security質問手順 + アンカー追記） |

---

## Constitution Check

| 原則 | Phase 0 評価 | Phase 1 評価 |
|------|-------------|-------------|
| I. ステップ独立性 | ✅ PASS | ✅ PASS |
| II. 決定論的マージ | ✅ PASS | ✅ PASS |
| III. 質問駆動の要件確定 | ✅ PASS | ✅ PASS |
| IV. 双方向アンカー | ✅ PASS | ✅ PASS |
| V. 強制ステップと拡張ステップの分離 | ✅ PASS | ✅ PASS |

### Complexity Tracking

None
