---
doc_type: Reference
---

# Architecture Overview: web-ui-enhancements

## System Diagram

```mermaid
graph TB
    subgraph Browser["ブラウザ (React SPA)"]
        Dashboard["Dashboard.tsx<br/>+ Archive Toggle<br/>(useSearchParams)"]
        ChangeDetail["ChangeDetail.tsx<br/>+ DockType Color Coding"]
        SpecViewer["SpecViewer.tsx [新規]<br/>CSS Grid Split View"]
        ArtifactViewer["ArtifactViewer.tsx<br/>(再利用)"]
        Router["AppRouter<br/>+ /spec-viewer routes [新規]"]
    end

    subgraph ClientAPI["api/client.ts"]
        useChanges["useChanges(showArchived)"]
        useArtifacts["useArtifacts()"]
        useSpecs["useSpecs() [新規]"]
        useSpecContent["useSpecContent() [新規]"]
    end

    subgraph Server["Fastify サーバー (CLI)"]
        ChangesRoute["GET /api/changes<br/>?includeArchived=true"]
        ArtifactsRoute["GET /api/changes/:id/artifacts<br/>+ docType フィールド"]
        SpecsRoute["GET /api/specs [新規]<br/>GET /api/specs/:cap [新規]"]
    end

    subgraph FS["ファイルシステム"]
        ChangesDir["changes/ (active)"]
        ArchiveDir["changes/archive/ (archived)"]
        SpecsDir["specs/<capability>/spec.md"]
    end

    Dashboard --> useChanges --> ChangesRoute --> ChangesDir
    ChangesRoute --> ArchiveDir
    ChangeDetail --> useArtifacts --> ArtifactsRoute --> ChangesDir
    SpecViewer --> useSpecs --> SpecsRoute --> SpecsDir
    SpecViewer --> useSpecContent --> SpecsRoute
    SpecViewer --> ArtifactViewer
    Router --> Dashboard
    Router --> ChangeDetail
    Router --> SpecViewer
```

## Sequence: アーカイブフィルター ON (FR-008)

```mermaid
sequenceDiagram
    actor User
    participant Dashboard
    participant useChanges
    participant Server as Fastify /api/changes

    User->>Dashboard: 「アーカイブを表示」トグルをクリック
    Dashboard->>Dashboard: setSearchParams({showArchived: 'true'})
    Note over Dashboard: URL → /?showArchived=true
    Dashboard->>useChanges: showArchived=true
    useChanges->>Server: GET /api/changes?includeArchived=true
    Server->>Server: listChanges({includeArchived: true})
    Server-->>useChanges: [{...isArchived:false}, {...isArchived:true}]
    useChanges-->>Dashboard: changes (含むアーカイブ)
    Dashboard->>Dashboard: アーカイブ行に opacity-60 + バッジを付与
    Dashboard-->>User: 一覧にアーカイブ済みチェンジが表示される
```

## Sequence: SoT Spec ビューアー表示 (FR-009)

```mermaid
sequenceDiagram
    actor User
    participant SpecViewer
    participant useSpecs
    participant useSpecContent
    participant Server as Fastify /api/specs

    User->>SpecViewer: ダッシュボードから「Spec Viewer」をクリック
    SpecViewer->>useSpecs: GET /api/specs
    Server-->>useSpecs: [{capability:"change-dashboard"}, ...]
    useSpecs-->>SpecViewer: capability 一覧
    SpecViewer-->>User: 左ペインに capability リスト表示

    User->>SpecViewer: "change-dashboard" をクリック
    SpecViewer->>SpecViewer: navigate("/spec-viewer/change-dashboard")
    SpecViewer->>useSpecContent: GET /api/specs/change-dashboard
    Server->>Server: fullPath.startsWith(specsDir) チェック
    Server-->>useSpecContent: spec.md raw text
    useSpecContent-->>SpecViewer: Markdown テキスト
    SpecViewer-->>User: 右ペインに Markdown レンダリング表示
```

## Sequence: DockType 色付き artifact 一覧 (FR-011)

```mermaid
sequenceDiagram
    actor User
    participant ChangeDetail
    participant useArtifacts
    participant Server as Fastify /api/changes/:id/artifacts

    User->>ChangeDetail: チェンジを選択
    ChangeDetail->>useArtifacts: GET /api/changes/:id/artifacts
    Server->>Server: collectArtifacts() 実行
    Note over Server: 各 .md ファイルを読み込み<br/>/^doc_type:\s*(.+)$/m で解析
    Server-->>useArtifacts: [{name, relativePath, type, docType:"Reference"}, ...]
    useArtifacts-->>ChangeDetail: ArtifactFile[]
    ChangeDetail->>ChangeDetail: docTypeColor(a.docType) でクラス決定
    ChangeDetail-->>User: カードが Reference=青, Tutorial=黄 等で色付け表示
```

## Data Flow: DockType 色パレット

```mermaid
graph LR
    FM["YAML frontmatter<br/>doc_type: Reference"] -->|regex| Server["artifacts.ts<br/>docType: 'Reference'"]
    Server -->|JSON| Client["ArtifactFile<br/>.docType"]
    Client --> Fn["docTypeColor()<br/>switch(docType)"]
    Fn -->|"bg-blue-50 border-blue-300"| Card["artifact カード"]
    Fn -->|"bg-purple-50..."| Card2["artifact カード"]
    Fn -->|"bg-gray-50..."| Card3["artifact カード (未設定)"]
```

## Constitution Check (Phase 0 + Phase 1)

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | ✅ architecture-overview はコードを書かない | ✅ 図は design.md と整合 |
| II. 決定論的マージ | ✅ 新規 FR のみ図示 | ✅ 既存ルーティングへの追記のみ |
| III. 質問駆動 | ✅ Open Choices は解決済み | ✅ 未決定事項なし |
| IV. 双方向アンカー | ✅ 実装時に各ファイルに `@mspec-delta` アンカーを付与 | ✅ |
| V. 強制/拡張分離 | ✅ architecture-overview は強制ステップの成果物 | ✅ |
| VI. Security by Default | ✅ パストラバーサル防止をシーケンス図に明記 | ✅ |

### Complexity Tracking

None
