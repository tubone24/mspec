---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007 -->
<!-- Change: spec-viewer-fulltext-search -->

# Architecture Overview: Spec Viewer Full-Text Search

## System Diagram

```mermaid
flowchart TD
    SV[SpecViewer.tsx]
    SI[useSpecSearchIndex]
    UD[useDebounce]
    SSI[lib/specSearchIndex.ts]
    ST[lib/searchIndex.ts\ntokenize]
    API[/api/specs]
    SB[Sidebar\nfiltered list]
    RP[Right Pane\nReactMarkdown]
    HT[HighlightText.tsx]
    RMT[rehypeMarkText.ts]
    SC[Search.tsx\nplaceholder + onClear]

    SV -->|useSpecs| API
    SV -->|useSpecSearchIndex| SI
    SI -->|batch fetch CONCURRENCY=5| API
    SI -->|createSpecSearchIndex| SSI
    SSI -->|import tokenize| ST
    SV -->|useDebounce 200ms| UD
    UD -->|debouncedQuery| SV
    SV -->|filteredSpecs| SB
    SB -->|text + query| HT
    SV -->|renders| RP
    RP -->|rehypeMarkText debouncedQuery| RMT
    SV -->|value + onClear| SC
```

## Index Build Sequence

```mermaid
sequenceDiagram
    participant Browser
    participant SpecViewer
    participant useSpecSearchIndex
    participant API

    Browser->>SpecViewer: navigate to /spec-viewer
    SpecViewer->>API: GET /api/specs
    API-->>SpecViewer: SpecCapability[]
    SpecViewer->>useSpecSearchIndex: specs (40+ capabilities)
    Note over useSpecSearchIndex: isBuilding = true
    loop CONCURRENCY=5 バッチ
        useSpecSearchIndex->>API: GET /api/specs/:capability
        API-->>useSpecSearchIndex: spec.md text
    end
    Note over useSpecSearchIndex: isBuilding = false\nindex ready
    SpecViewer-->>Browser: search box enabled
```

## Search Query Flow

```mermaid
sequenceDiagram
    participant User
    participant SearchBox as Search.tsx
    participant SpecViewer
    participant useDebounce
    participant MiniSearch
    participant Sidebar
    participant RightPane

    User->>SearchBox: input "fr-001"
    SearchBox->>SpecViewer: onChange("fr-001")
    SpecViewer->>useDebounce: query "fr-001"
    Note over useDebounce: 200ms 待機
    useDebounce-->>SpecViewer: debouncedQuery "fr-001"
    SpecViewer->>MiniSearch: index.search("fr-001")
    MiniSearch-->>SpecViewer: [{ id: "web-ui-search", ... }, ...]
    SpecViewer->>Sidebar: filteredSpecs
    Sidebar->>Sidebar: HighlightText("web-ui-search", "fr-001")
    Note over Sidebar: "web-ui-<mark>search</mark>" など

    User->>Sidebar: click capability
    Sidebar->>SpecViewer: navigate /spec-viewer/:capability
    SpecViewer->>RightPane: ReactMarkdown + rehypeMarkText("fr-001")
    Note over RightPane: FR-001 に <mark> タグ
```

## Data Model

```mermaid
erDiagram
    SpecCapability {
        string capability
    }
    SpecSearchDocument {
        string id
        string capability
        string content
    }
    MiniSearch_Index {
        fields capability_content
        storeFields capability
        tokenize ja_segmenter_hyphen
    }
    SpecCapability ||--o{ SpecSearchDocument : "fetch /api/specs/:capability"
    SpecSearchDocument ||--|| MiniSearch_Index : "index.add()"
```

## Component Dependency Graph

```mermaid
flowchart LR
    SV[SpecViewer.tsx]
    SC[Search.tsx]
    HT[HighlightText.tsx]
    SI[useSpecSearchIndex.ts]
    UD[useDebounce.ts]
    SSI[specSearchIndex.ts]
    ST[searchIndex.ts]
    RMT[rehypeMarkText.ts]

    SV --> SC
    SV --> HT
    SV --> SI
    SV --> UD
    SV --> RMT
    SI --> SSI
    SSI --> ST
```

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|---|---|---|
| I. ステップ独立性 | ✅ architecture-overview は design と独立した成果物 | ✅ 他ステップのアーティファクトを変更しない |
| II. 決定論的マージ | ✅ 新規 capability spec-viewer-search のみ | ✅ ダイアグラムは変更ファイルリストに一致 |
| III. 質問駆動の要件確定 | ✅ proposal/research/design で要件確定済み | ✅ シーケンス図が FR-002/FR-003 を正確に反映 |
| IV. 双方向アンカー | ✅ `@mspec-delta` アンカーを冒頭に記載 | ✅ 全 FR を網羅するアンカーが存在 |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみを対象 | ✅ 実装詳細は tasks.md で分離される |
| VI. Security by Default | ✅ 外部 API 追加なし | ✅ D-05 escapeRegExp がダイアグラムに反映 |
