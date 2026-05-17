---
doc_type: Reference
---

# Architecture Overview: fix-special-step-produces

## System Diagram

```mermaid
graph TD
    CLI["CLI (index.ts)"] -->|"mspec done &lt;step&gt;"| DoneCmd["commands/done.ts"]
    CLI -->|"mspec status"| StatusCmd["commands/status.ts"]
    CLI -->|"mspec continue"| ContinueCmd["commands/continue.ts"]

    DoneCmd -->|"loadWorkflow"| WorkflowLoader["workflow/loader.ts"]
    DoneCmd -->|"validate if implement"| Validator["lib/artifact-validator.ts"]
    DoneCmd -->|"recordDone"| DoneLog["lib/done-log.ts"]

    StatusCmd -->|"loadDoneLog"| DoneLog
    StatusCmd -->|"loadSkipLog"| SkipLog["lib/skip-log.ts"]
    StatusCmd -->|"computeStatus"| StateEngine["lib/state-engine.ts"]

    ContinueCmd -->|"loadDoneLog"| DoneLog
    ContinueCmd -->|"loadSkipLog"| SkipLog
    ContinueCmd -->|"computeStatus"| StateEngine

    StateEngine -->|"isDone"| DoneLog
    StateEngine -->|"isSkipped"| SkipLog

    DoneLog -->|"read/write"| DoneLogFile[".mspec/cache/done-log.json"]
    SkipLog -->|"read/write"| SkipLogFile[".mspec/cache/skip-log.json"]

    WorkflowYAML[".mspec/workflow.yaml"] -->|"loaded by"| WorkflowLoader
```

## Sequence Diagram — `mspec done implement`

```mermaid
sequenceDiagram
    participant User
    participant CLI as index.ts
    participant Done as commands/done.ts
    participant WF as workflow/loader.ts
    participant Val as lib/artifact-validator.ts
    participant DL as lib/done-log.ts

    User->>CLI: mspec done implement
    CLI->>Done: doneCommand("implement", opts)
    Done->>WF: loadWorkflow()
    WF-->>Done: step: implement (produces: [], enforce_anchor/e2e/tdd)
    Done->>Done: Guard check: produces.length > 0? → NO → continue
    Done->>Val: validate (anchor / E2E / TDD 証跡確認)
    Val-->>Done: validation OK
    Done->>DL: recordDone(paths, changeName, "implement")
    DL->>DL: loadDoneLog() → update entry → writeFile(done-log.json)
    Done-->>User: done: implement
```

```mermaid
sequenceDiagram
    participant User
    participant Done as commands/done.ts
    participant WF as workflow/loader.ts

    User->>Done: mspec done proposal
    Done->>WF: loadWorkflow()
    WF-->>Done: step: proposal (produces: [proposal.md])
    Done->>Done: Guard check: produces.length > 0? → YES → Error
    Done-->>User: Error "mspec done は produces が空のステップにのみ使用できます"
```

## Data Model — done-log.json

```mermaid
classDiagram
    class DoneLog {
        <<type: Record>>
        changeName → DoneLogEntry
    }
    class DoneLogEntry {
        <<type: Record>>
        stepId → DoneEntry
    }
    class DoneEntry {
        +done_at: string ISO8601
    }
    DoneLog "1" --> "*" DoneLogEntry
    DoneLogEntry "1" --> "*" DoneEntry
```

### skip-log との対称性

| | skip-log.json | done-log.json |
|--|--|--|
| パス | `.mspec/cache/skip-log.json` | `.mspec/cache/done-log.json` |
| Entryフィールド | `reason: string`, `skipped_at: string` | `done_at: string` |
| Load 関数 | `loadSkipLog(paths)` | `loadDoneLog(paths)` |
| Record 関数 | `recordSkip(paths, change, step, reason)` | `recordDone(paths, change, step)` |
| Query 関数 | `isSkipped(log, change, step)` | `isDone(log, change, step)` |
| トリガー | `mspec skip <step> --reason <text>` | `mspec done <step>` |

## State Transition — produces レスステップ（BEFORE / AFTER）

```mermaid
stateDiagram-v2
    direction LR
    [*] --> blocked : 前ステップが done/skipped でない

    state "BEFORE fix" as before {
        blocked --> ready : 前ステップが done/skipped
        ready --> ready : (stuck — done 遷移なし)
        note right of ready : skippable: true で\n擬似的に skip → done 連鎖
    }

    state "AFTER fix" as after {
        blocked --> ready2 : 前ステップが done/skipped
        ready2 --> done : mspec done &lt;step-id&gt;
    }

    ready2 : ready
```

## state-engine.ts 変更差分（擬似コード）

```
// BEFORE
if (produces.length === 0) {
  return 'ready';
}

// AFTER
if (produces.length === 0) {
  if (isDone(doneLog, change.name, step.id)) return 'done';
  return 'ready';
}
```

`evaluateStep` の引数 `EvaluateInput` に `doneLog: DoneLog` を追加し、`ComputeStatusInput` にも同フィールドを追加する。`status.ts` と `continue.ts` で `loadDoneLog()` を `loadSkipLog()` と並走して呼び出す。

## Constitution Check

> Step: design (architecture-overview) | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | `done-log.ts` は独立モジュール。既存コマンドへの変更は引数追加のみ |
| II. 決定論的マージ | ✅ | ✅ | `done-log.json` は `.mspec/cache/` 配下（gitignore 済み）。archive マージ対象外 |
| III. 質問駆動の要件確定 | ✅ | ✅ | 新規アーキテクチャ上の疑問点なし。全決定は research.md に記録済み |
| IV. 双方向アンカー | — | — | アンカーロジックへの直接変更なし |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `done-log` が強制ステップ専用の done 機構として分離された設計 |

### Complexity Tracking

None
