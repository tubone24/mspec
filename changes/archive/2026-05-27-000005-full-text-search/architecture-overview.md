---
doc_type: Reference
---

# Architecture Overview: Full-Text Search 拡張

## System Diagram

```mermaid
graph TD
    subgraph Browser
        A[Dashboard.tsx] -->|"q, changes"| B[useSearchIndex hook]
        B -->|"SearchIndexState"| A
        B --> C[searchIndex.ts]
        C --> D[MiniSearch instance]
        C --> E["Intl.Segmenter tokenizer"]
    end

    subgraph "API Server :3847"
        F["GET /api/changes"]
        G["GET /api/changes/:id/artifacts"]
        H["GET /api/changes/:id/artifacts/*"]
    end

    B -->|"1. fetch changes"| F
    B -->|"2. fetch artifact list per change"| G
    B -->|"3. fetch markdown content (×N×M, concurrency=5)"| H
    F --> B
    G --> B
    H --> B

    D -->|"MiniSearch.search(q)"| I[scoreMap: changeId → maxScore]
    I --> A
    A -->|"filter + sort by score"| J[Filtered ChangeInfo list]
```

## Sequence Diagram: インデックス構築フロー

```mermaid
sequenceDiagram
    participant Browser
    participant useSearchIndex
    participant API as API Server

    Browser->>useSearchIndex: mount (changes props)
    useSearchIndex->>useSearchIndex: isBuilding = true
    loop 各 change
        useSearchIndex->>API: GET /api/changes/:id/artifacts
        API-->>useSearchIndex: ArtifactFile[] (filter: type==='markdown')
        par 並行フェッチ (concurrency=5)
            useSearchIndex->>API: GET /api/changes/:id/artifacts/:path
            API-->>useSearchIndex: content (text/plain)
        end
        useSearchIndex->>useSearchIndex: MiniSearch.add({ id, changeId, name, title, summary, tags, content })
    end
    useSearchIndex->>useSearchIndex: isBuilding = false
    useSearchIndex-->>Browser: { index, isBuilding: false, error: null }
```

## Sequence Diagram: 検索フロー

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant useSearchIndex
    participant MiniSearch

    User->>Dashboard: テキスト入力 (q)
    Dashboard->>useSearchIndex: index, isBuilding
    alt isBuilding === true または index === null
        Dashboard->>Dashboard: includes() フォールバック検索
    else index が利用可能
        Dashboard->>MiniSearch: search(q, { fields, boost, tokenize })
        MiniSearch-->>Dashboard: SearchResult[] (score付き)
        Dashboard->>Dashboard: changeId 単位で score 集約
        Dashboard->>Dashboard: scoreMap で変更リストをフィルタ＋スコア降順ソート
    end
    Dashboard-->>User: フィルタ済み変更一覧
```

## Data Model

```mermaid
erDiagram
    SearchDocument {
        string id PK "changeId:relativePath"
        string changeId FK
        string name
        string title
        string summary
        string tags "スペース区切り"
        string content "Markdown 本文テキスト"
    }

    ChangeInfo {
        string id PK
        string name
        string title
        string summary
        string[] tags
        StepState[] steps
        boolean isArchived
    }

    ArtifactFile {
        string name
        string relativePath
        string type "markdown|html|json|xml|other"
        string docType
    }

    ChangeInfo ||--o{ SearchDocument : "1 change → N docs"
    ChangeInfo ||--o{ ArtifactFile : "has artifacts"
    ArtifactFile ||--o| SearchDocument : "markdown only → indexed"
```

## Component Responsibilities

| コンポーネント | 責務 | 変更種別 |
|--------------|------|---------|
| `lib/searchIndex.ts` | MiniSearch インスタンス生成・トークナイザー定義 | NEW |
| `hooks/useSearchIndex.ts` | インデックス構築・状態管理 | NEW |
| `pages/Dashboard.tsx` | 検索ロジックの切り替え（includes → MiniSearch） | MODIFIED |
| `components/Search.tsx` | 変更なし（UI のみ） | UNCHANGED |
| `api/client.ts` | 変更なし（既存 useArtifacts / useArtifactContent を流用） | UNCHANGED |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | ✅ architecture-overview はコードを変更しない | ✅ 既存コンポーネントの責務を変更しない設計 |
| II. 決定論的マージ | ✅ 単一のアーキテクチャ概要ファイル | ✅ 図と表が design.md と整合している |
| III. 質問駆動の要件確定 | ✅ 全設計決定が research.md と proposal.md に基づく | ✅ コンポーネント責務が FR に対応 |
| IV. 双方向アンカー | ✅ 後続 tasks でアンカー付与予定 | ✅ 各図が FR の Scenario に対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ architecture-overview は強制ステップの成果物 | ✅ 実装詳細（コード）は tasks.md で扱う |
| VI. Security by Default | ✅ サーバー権限変更なし・クライアントサイド完結 | ✅ API は既存エンドポイントのみ使用。新規権限付与なし |
