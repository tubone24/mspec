---
doc_type: Reference
---

# Architecture Overview: SKILL.md 3コンパートメント化

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I. 仕様駆動 | ✅ |
| II. TDD | ✅ |
| III. 双方向アンカー | ✅ |
| IV. 決定論的アーカイブ | ✅ |
| V. リスク比例検証 | ✅ |

## 変更後のSKILL.md構造

```mermaid
graph TD
    A[SKILL.md] --> B["## Procedure<br/>(既存: 実行手順)"]
    A --> C["## Observation<br/>(既存: Agent Experience Log)"]
    A --> D["## Verification C2<br/>(新規: CLI確認コマンド)"]
    A --> E["## Learning C3<br/>(新規: 学習パターン記録)"]
    D --> F["mspec validate<br/>mspec anchor check<br/>etc."]
    E --> G["mspec learn が読み込む<br/>LEARNING commentフォーマット"]
```

## C2/C3フィードバックループ

```mermaid
sequenceDiagram
    participant Agent
    participant SKILL.md
    participant CLI
    participant Learn

    Agent->>SKILL.md: スキル実行
    Agent->>CLI: C2: mspec validate等
    CLI-->>Agent: 検証結果
    Agent->>SKILL.md: C3: LEARNINGコメント記録
    Learn->>SKILL.md: P4 mspec learnが収集
    Learn-->>Agent: post-condition候補をproposeへ
```
