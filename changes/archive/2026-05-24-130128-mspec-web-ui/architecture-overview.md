---
doc_type: Reference
---

# Architecture Overview: mspec-web-ui

## System Diagram

```mermaid
graph TD
    subgraph User["User Environment"]
        U["Developer\n(terminal + browser)"]
    end

    subgraph CLI["packages/cli"]
        CMD["new.ts\n(mspec new hook)"]
        SRV["Fastify Server\nsrc/server/index.ts"]
        PID["PID Manager\nsrc/server/pidManager.ts"]
        ROUTES["REST Routes\nchanges / artifacts / test-results"]
    end

    subgraph Core["packages/core"]
        CORE["Step Manager\nFile I/O"]
    end

    subgraph WebUI["packages/web-ui (@mspec/web-ui — optional)"]
        SPA["React SPA\ndist/"]
        PAGES["Pages\nDashboard / ChangeDetail\nArtifactPreview / TestResults"]
        STORE["Zustand Store\n+ TanStack Query"]
    end

    subgraph FS["File System"]
        CHANGES["~/.mspec/\n  ui.pid"]
        REPO["changes/<id>/\n  *.md / specs/ / e2e-results/"]
    end

    U -->|"mspec new"| CMD
    CMD -->|"launchWebUiIfNeeded()"| PID
    PID -->|"readPid / writePid"| CHANGES
    CMD -->|"spawn background"| SRV
    SRV -->|"serve-static dist/"| SPA
    SRV --> ROUTES
    ROUTES -->|"reads"| CORE
    CORE -->|"reads"| REPO
    U -->|"http://localhost:3847"| SPA
    SPA --> PAGES
    PAGES -->|"GET /api/..."| ROUTES
    STORE -->|"refetchInterval: 3000ms"| ROUTES
```

## Sequence: Server Startup (mspec new)

```mermaid
sequenceDiagram
    participant U as Developer
    participant CLI as mspec CLI
    participant PID as PID Manager
    participant FS as ~/.mspec/ui.pid
    participant SRV as Fastify Server
    participant B as Browser

    U->>CLI: mspec new <feature>
    CLI->>CLI: create changes/<id>/ (existing logic)
    CLI->>PID: readPid()
    PID->>FS: read file

    alt @mspec/web-ui not installed
        CLI-->>U: "ℹ Web UI not available. Install @mspec/web-ui"
    else PID exists and process alive
        PID-->>CLI: { pid, port }
        CLI-->>U: "Web UI already running at http://localhost:<port>"
    else PID missing or stale
        PID-->>CLI: null (or stale)
        CLI->>SRV: spawn background process
        SRV->>PID: writePid(pid, port)
        PID->>FS: write "<pid>:<port>"
        SRV-->>CLI: ready signal
        CLI-->>U: "Web UI started at http://localhost:3847"
    end

    U->>B: open URL
    B->>SRV: GET /api/changes
    SRV-->>B: ChangeInfo[]
    B->>B: render Dashboard
```

## Sequence: Artifact Preview (MD with Mermaid)

```mermaid
sequenceDiagram
    participant U as Developer
    participant B as Browser (React SPA)
    participant SRV as Fastify Server
    participant FS as File System

    U->>B: navigate to /changes/:id/artifacts/design.md
    B->>SRV: GET /api/changes/:id/artifacts/design.md
    SRV->>FS: read design.md
    FS-->>SRV: raw markdown string
    SRV-->>B: { content: "...", type: "markdown" }
    B->>B: react-markdown renders HTML
    B->>B: MermaidRenderer detects ```mermaid blocks
    B->>B: mermaid.render() → SVG
    B-->>U: preview with rendered diagrams
```

## Component Diagram (Frontend)

```mermaid
graph TD
    Router["React Router v7"]

    Router --> Dashboard
    Router --> ChangeDetail
    Router --> ArtifactPreview
    Router --> TestResults

    Dashboard --> StepProgress
    Dashboard --> ModeFilter
    Dashboard -->|"useChanges()"| TanStackQuery

    ChangeDetail -->|"useArtifacts()"| TanStackQuery
    ArtifactPreview --> MermaidRenderer
    ArtifactPreview --> GherkinHighlight
    ArtifactPreview --> PrototypeIframe
    ArtifactPreview -->|"useArtifactContent()"| TanStackQuery

    TestResults -->|"useTestResults()"| TanStackQuery
    TestResults --> TestCaseBadge

    ThemeToggle -->|"theme state"| ZustandStore
    ZustandStore -->|"dark/light class"| Root
```

## Data Flow: Test Result Parsing

```mermaid
graph LR
    subgraph Input
        PW["Playwright JSON\nchanges/<id>/e2e-results/*.json"]
        JU["JUnit XML\nchanges/<id>/e2e-results/*.xml"]
    end

    subgraph Parser["testResultParser.ts"]
        DET["Format Detector\n.json → Playwright\n.xml → JUnit"]
        NOR["Normalizer\n→ TestSuite[]"]
    end

    subgraph Output
        API["GET /api/changes/:id/test-results\n→ TestSuite[]"]
    end

    PW --> DET
    JU --> DET
    DET --> NOR
    NOR --> API
```

## Package Dependency Graph

```mermaid
graph LR
    CLI["packages/cli"]
    CORE["packages/core"]
    WEBUI["packages/web-ui\n(@mspec/web-ui)\n[optional]"]

    CLI -->|"import (required)"| CORE
    CLI -.->|"require.resolve\n(optional, graceful degrade)"| WEBUI
```

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ architecture-overview は design.md と同一ステップで生成され、外部成果物に依存しない | ✅ 各 Mermaid 図は独立して参照・更新可能な単位として設計されている |
| II 決定論的マージ | ✅ 新規ファイルであり既存ファイルへの影響なし | ✅ Mermaid 記法は構造化されており、将来の更新が確定的 |
| III 質問駆動の要件確定 | ✅ 全設計決定は proposal・research・設計時の AskUserQuestion を経て確定している | ✅ 図は確定済みの設計決定のみを反映しており、未解決の選択肢は含まない |
| IV 双方向アンカー | ✅ System Diagram が design.md の Project Structure と対応している | ✅ Sequence 図が Delta Spec（cli-integration / web-ui-server）の Scenario と 1:1 で対応している |
| V 強制ステップと拡張ステップの分離 | ✅ architecture-overview は design ステップの強制成果物として管理されている | ✅ Mermaid 図（必須）と追加 Sequence 図（拡張）が明確に分かれている |

### Complexity Tracking

None.
