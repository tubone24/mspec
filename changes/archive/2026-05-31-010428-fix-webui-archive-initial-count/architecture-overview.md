# Architecture Overview: fix-webui-archive-initial-count

## System Diagram

```mermaid
graph TD
    subgraph "Browser (Dashboard.tsx)"
        SF["statusFilter state\n(初期値: 'all')"]
        IA["includeArchived\n= statusFilter === 'archived'"]
        QM["useChanges(includeArchived)\n表示リスト用クエリ"]
        QA["useChanges(true) ← 追加\n件数専用クエリ（常時実行）"]
        CM["counts.inProgress / ready / shipped\n← changes から計算（変更なし）"]
        CA["counts.archived ← 修正\n← allChanges から計算"]
        UI["ダッシュボード UI\n件数バッジ表示"]
    end

    subgraph "Server (changes.ts)"
        EP1["GET /api/changes\n(includeArchived なし)"]
        EP2["GET /api/changes\n?includeArchived=true"]
        LD["listChanges()"]
        AD["listChanges({ includeArchived: true })"]
    end

    subgraph "Filesystem"
        CD["changes/ ディレクトリ"]
        AR["changes/archive/ ディレクトリ"]
    end

    SF --> IA
    IA --> QM
    QM -->|"showArchived=false\n(初期)"| EP1
    QA -->|"showArchived=true\n(常時)"| EP2
    EP1 --> LD --> CD
    EP2 --> AD --> CD
    AD --> AR
    QM -->|"data: changes"| CM
    QA -->|"data: allChanges"| CA
    CM --> UI
    CA --> UI

    style QA fill:#ffd700,stroke:#b8860b
    style CA fill:#ffd700,stroke:#b8860b
```

> 黄色のノードが今回追加・修正する箇所。

## Sequence Diagram: 初期ロード時のアーカイブ件数取得

```mermaid
sequenceDiagram
    participant B as ブラウザ (Dashboard)
    participant S as Server /api/changes

    Note over B: ダッシュボード初期マウント
    B->>S: GET /api/changes (includeArchived なし)
    B->>S: GET /api/changes?includeArchived=true  ← 追加
    S-->>B: [activeChange1, activeChange2, ...]
    S-->>B: [activeChange1, ..., archivedChange1, archivedChange2, ...]
    Note over B: counts.archived = allChanges.filter(isArchived).length = 3
    Note over B: 件数バッジに「2」が即座に表示される
```

## Data Model

変更なし。既存の `ChangeInfo` 型の `isArchived: boolean` フィールドを利用する。

```typescript
// 既存型（変更なし）
interface ChangeInfo {
  name: string;
  isArchived: boolean;
  // ...
}

// Dashboard.tsx での変更後の状態管理
const { data: changes = [] }    = useChanges(includeArchived);  // 変更なし
const { data: allChanges = [] } = useChanges(true);             // 追加
```

## Constitution Check

| 原則 | Phase 0 | Phase 1 | 備考 |
|------|---------|---------|------|
| I. ステップ独立性 | ✅ | ✅ | アーキテクチャ図は design.md・research.md のみ参照 |
| II. 決定論的マージ | ✅ | ✅ | 図の変更は独立しており衝突なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | 図に未確定要素なし |
| IV. 双方向アンカー | ✅ | ✅ | アンカーは tasks.md で付与予定 |
| V. 強制/拡張ステップの分離 | ✅ | ✅ | bugfix モードで適切にスキップ済み |
| VI. Security by Default | ✅ | ✅ | 読み取り専用クエリの追加のみ |
| VII. 設計意図と実装の対応確認 | ✅ | ✅ | 図が FR-011 の修正箇所を正確に反映 |

### Complexity Tracking

None.
