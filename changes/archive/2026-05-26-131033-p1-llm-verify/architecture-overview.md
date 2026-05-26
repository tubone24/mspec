# Architecture Overview: mspec verify --llm

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I. 仕様駆動 | ✅ |
| II. TDD | ✅ |
| III. 双方向アンカー | ✅ |
| IV. 決定論的アーカイブ | ✅ |
| V. リスク比例検証 | ✅ |

## 案A方式のデータフロー

```mermaid
graph TD
    A["mspec verify --llm<br/>--change &lt;change&gt;"] --> B[specs/*/spec.md 読み込み]
    A --> C[design.md 読み込み]
    B --> D[FR-ID ごとにプロンプト生成]
    C --> D
    D --> E["JSON 出力<br/>{ fr_checks: [...] }"]
    E --> F["Claude Code エージェント<br/>(SKILL.md / checklist 手順)"]
    F --> G[LLM 評価実行]
    G --> H[評価結果を checklist.md にコメント付加]
```

## verify.ts のコンポーネント

```mermaid
graph LR
    A[verify.ts] --> B[parseDeltaSpec]
    A --> C[findChange]
    A --> D[resolveProduces]
    B --> E[FR-ID リスト抽出]
    E --> F[buildFrPrompt]
    F --> G[JSON stdout 出力]
```
