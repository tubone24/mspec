# Architecture Overview: implement 自己修正ループ

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I. 仕様駆動 | ✅ |
| II. TDD | ✅ |
| III. 双方向アンカー | ✅ |
| IV. 決定論的アーカイブ | ✅ |
| V. リスク比例検証 | ✅ |

## max_iterations フィールドの配置

```mermaid
graph TD
    A[workflow.yaml] -->|max_iterations: 3| B[StepSchema]
    B --> C[implements ステップ]
    C --> D{TDD 失敗回数}
    D -->|< max_iterations| E[再試行]
    D -->|>= max_iterations| F[エスカレーション]
    F --> G["design.md に<br/>## Escalation Summary 追記"]
    F --> H[AskUserQuestion でユーザーへ判断委託]
```

## エスカレーションシーケンス

```mermaid
sequenceDiagram
    participant Agent as mspec-implement Agent
    participant CLI as mspec CLI
    participant Design as design.md
    participant User

    loop 各タスク × max_iterations
        Agent->>CLI: mspec test expect-red <task-id>
        Agent->>CLI: 実装
        Agent->>CLI: mspec test expect-green <task-id>
        alt green 成功
            CLI-->>Agent: ✅ 証跡記録
        else green 失敗
            Agent->>Agent: 失敗カウント++
        end
    end
    Note over Agent: 失敗 >= max_iterations
    Agent->>Design: ## Escalation Summary を追記
    Agent->>User: AskUserQuestion（設計変更 or 仕様見直し?）
```
