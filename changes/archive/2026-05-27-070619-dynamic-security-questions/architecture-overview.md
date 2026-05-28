---
doc_type: Reference
---

# Architecture Overview: dynamic-security-questions

## System Diagram

```mermaid
graph TD
    A[mspec-proposal SKILL.md] --> B[手順 1-4: 機能質問 3-5問]
    B --> C[手順 4a: mspec-security-analyzer 起動]
    C --> D[(specs/ + changes/current/)]
    D --> C
    C --> E[リスクリスト + 動的質問 3-5問]
    E --> F[手順 4b: AskUserQuestion で質問提示]
    F --> G[回答を proposal.md Decisions に記録]

    subgraph 廃止
        H[proposal.yaml PRP-SEC-001~004]
        I[SKILL.md 固定提示ロジック]
    end

    subgraph 新規
        C
        J[.claude/agents/mspec-security-analyzer.md]
    end

    subgraph 更新
        K[delta-spec.ja/en.md Security Capabilities スロット]
    end
```

## Sequence Diagram: proposal ステップ（変更後）

```mermaid
sequenceDiagram
    participant User
    participant Skill as mspec-proposal SKILL.md
    participant Bank as mspec questions --phase proposal
    participant Analyzer as mspec-security-analyzer
    participant FS as specs/ + changes/current/

    Skill->>Bank: mspec questions --phase proposal --json
    Bank-->>Skill: 機能質問リスト（security カテゴリなし）
    loop 3-5 問
        Skill->>User: AskUserQuestion（機能・NFR・完了条件等）
        User-->>Skill: 回答
    end

    Note over Skill,Analyzer: 手順 4a: セキュリティ分析フェーズ
    Skill->>Analyzer: Agent tool 起動（読み取り専用）
    Analyzer->>FS: specs/**/*.md + changes/<current>/* を読む
    FS-->>Analyzer: 変更コンテキスト
    Analyzer-->>Skill: 変更固有リスクリスト + 動的質問 3-5問

    loop 3-5 問（動的）
        Skill->>User: AskUserQuestion（変更固有セキュリティ質問）
        User-->>Skill: 回答
    end

    Skill->>Skill: 回答を proposal.md ## Decisions に記録
```

## Data Model: mspec-security-analyzer の出力形式

サブエージェントは以下の JSON ライクな構造のテキストを返す（実際は markdown リスト形式）:

```mermaid
classDiagram
    class SecurityAnalysisResult {
        risks: RiskItem[]
        questions: SecurityQuestion[]
    }
    class RiskItem {
        description: string
        severity: low | medium | high
    }
    class SecurityQuestion {
        text: string
        options: string[]  %%最大4個（AskUserQuestion制約）
        multi_select: boolean
    }
    SecurityAnalysisResult "1" --> "1..*" RiskItem
    SecurityAnalysisResult "1" --> "3..5" SecurityQuestion
```

## 変更前後のファイル依存関係

```mermaid
graph LR
    subgraph Before
        S1[SKILL.md] -->|reads| Q1[proposal.yaml\nPRP-SEC-001~004]
        S1 -->|presents| AUQ1[AskUserQuestion\n固定4問]
    end

    subgraph After
        S2[SKILL.md] -->|reads| Q2[proposal.yaml\nsecurity なし]
        S2 -->|invokes| AG[mspec-security-analyzer.md]
        AG -->|reads| SP[specs/]
        AG -->|reads| CH[changes/current/]
        AG -->|returns| DQ[動的質問 3-5問]
        S2 -->|presents| AUQ2[AskUserQuestion\n動的質問]
    end
```

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK | OK — アーキテクチャは proposal スキルの内部フローのみを変更する。他ステップの入出力インターフェースは不変 |
| II 決定論的マージ | OK | OK — 図に示す全ファイル変更は git revert で単一コミットとして元に戻せる |
| III 質問駆動の要件確定 | OK | OK — 図の動的質問数（3〜5）・スコープ（specs/ + changes/<current>/）は OC-3/5 で確定済み |
| IV 双方向アンカー | OK | OK — implement ステップで変更ファイルに `@mspec-delta` アンカーを付与する |
| V 強制ステップと拡張ステップの分離 | OK | OK — 変更前後のシーケンス図が示すとおり、workflow.yaml の step 境界は不変 |
| VI Security by Default | CAUTION | OK — Sequence Diagram の「読み取り専用」注記がエージェント制約を文書化。スコープは specs/ + changes/<current>/ に限定 |

### Complexity Tracking

None
