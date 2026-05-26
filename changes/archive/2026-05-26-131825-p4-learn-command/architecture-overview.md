# Architecture Overview: mspec learn コマンド

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I. 仕様駆動 | ✅ |
| II. TDD | ✅ |
| III. 双方向アンカー | ✅ |
| IV. 決定論的アーカイブ | ✅ |
| V. リスク比例検証 | ✅ |

## データ収集フロー

```mermaid
graph TD
    A["mspec learn"] --> B["changes/archive/ 走査"]
    B --> C[".agent-runs.jsonl 読み込み"]
    B --> D["checklist.md 読み込み"]
    C --> E["edits > 0 フィルタ"]
    D --> F["- [ ] verify: human マッチ"]
    E --> G["review-blocker パターン"]
    F --> H["unchecked-human-verify パターン"]
    G --> I["LearnOutput JSON"]
    H --> I
    I --> J["stdout 出力"]
```

## C3フィードバックループ

```mermaid
sequenceDiagram
    participant Archive as changes/archive/
    participant Learn as mspec learn
    participant Agent as 次回 propose/design

    Archive->>Learn: .agent-runs.jsonl (edits > 0)
    Archive->>Learn: checklist.md (verify: human 未チェック)
    Learn->>Agent: post-condition候補 JSON
    Agent->>Agent: propose/design 時に参照して<br/>新しい verify 項目を追加
```
