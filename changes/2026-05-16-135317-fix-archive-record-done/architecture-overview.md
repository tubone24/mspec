---
doc_type: Architecture
---

# Architecture Overview: fix-archive-record-done

## System Diagram

```mermaid
graph TD
    A["mspec archive コマンド実行"] --> B["loadWorkflow()"]
    B --> C["findChange()"]
    C --> D["parseDeltaSpec()"]
    D --> E["mergeDeltaIntoSpec()"]
    E --> F{"エラーあり?"}
    F -- Yes --> G["エラースロー\n(何も書き込まない)"]
    F -- No --> H["merged source specs を writeFile()"]
    H --> I["mkdir(changesArchiveDir)"]
    I --> J["rename(change.dir, targetDir)"]
    J -- 失敗 --> K["エラースロー\n(recordDone は呼ばない)"]
    J -- 成功 --> L["★ await recordDone(paths, change.name, 'archive')\n(追加箇所)"]
    L -- 失敗 --> M["エラー伝播\n(ロールバックなし)"]
    L -- 成功 --> N["return ArchiveResult"]

    style L fill:#d4edda,stroke:#28a745,color:#000
```

## Sequence Diagram: `mspec continue` 完了検知の修正前後

```mermaid
sequenceDiagram
    participant CLI as mspec CLI
    participant ArchiveCmd as archiveCommand()
    participant FS as ファイルシステム
    participant DoneLog as done-log.json
    participant StateEngine as state-engine

    Note over CLI,StateEngine: 修正前（バグあり）
    CLI->>ArchiveCmd: archiveCommand(opts)
    ArchiveCmd->>FS: rename(change.dir, targetDir)
    FS-->>ArchiveCmd: OK
    ArchiveCmd-->>CLI: ArchiveResult
    CLI->>StateEngine: continue --change
    StateEngine->>DoneLog: isDone("archive") ?
    DoneLog-->>StateEngine: false（記録なし）
    StateEngine-->>CLI: next_action: "execute" ♻️

    Note over CLI,StateEngine: 修正後（正常）
    CLI->>ArchiveCmd: archiveCommand(opts)
    ArchiveCmd->>FS: rename(change.dir, targetDir)
    FS-->>ArchiveCmd: OK
    ArchiveCmd->>DoneLog: recordDone("archive") ✅
    DoneLog-->>ArchiveCmd: OK
    ArchiveCmd-->>CLI: ArchiveResult
    CLI->>StateEngine: continue --change
    StateEngine->>DoneLog: isDone("archive") ?
    DoneLog-->>StateEngine: true
    StateEngine-->>CLI: next_action: "complete" ✅
```

## Data Model: done-log.json

```mermaid
erDiagram
    DoneLog {
        string changeName PK "e.g. 2026-05-16-fix-archive-record-done"
    }
    StepEntry {
        string stepId PK "e.g. archive"
        string done_at "ISO 8601 timestamp"
    }
    DoneLog ||--o{ StepEntry : "has"
```

**書き込みタイミング**: `archiveCommand` が `rename()` 成功後に `recordDone()` を呼ぶことで追加される。

## Constitution Check

> Step: design (architecture-overview) | Constitution Version: 1

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 図はarchive.tsの単一変更を表現 |
| II. 決定論的マージ | ✅ | ✅ | アーキテクチャ変更なし、フロー追加のみ |
| III. 質問駆動の要件確定 | ✅ | ✅ | シーケンス図は確定済み仕様を図示 |
| IV. 双方向アンカー | — | ✅ | シーケンス図の「修正後」がFR-003シナリオに対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | 図の変更範囲はarchiveステップのみ |

### Complexity Tracking

None
