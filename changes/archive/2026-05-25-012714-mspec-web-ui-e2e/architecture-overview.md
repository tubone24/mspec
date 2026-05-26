---
doc_type: Reference
---

# Architecture Overview: mspec-web-ui-e2e

## System Diagram

```mermaid
graph TD
    subgraph PW["Playwright Test Runner"]
        T1["dashboard.e2e.test.ts"]
        T2["artifact-preview.e2e.test.ts"]
        T3["test-results.e2e.test.ts"]
    end

    subgraph WebServer["packages/web-ui (Vite dev server :5173)"]
        VITE["Vite + React SPA"]
        PROXY["Proxy /api → :3847"]
    end

    subgraph API["api-server.ts (Fastify :3847)"]
        ROUTES["/api/changes\n/api/changes/:id/artifacts/*\n/api/changes/:id/test-results\n/api/health"]
    end

    subgraph FS["File System (mspec repo)"]
        ARCH["changes/archive/*\n(test data)"]
        SPEC["specs/*\n(SoT specs)"]
    end

    T1 & T2 & T3 -->|"page.goto(), click(), waitForSelector()"| VITE
    VITE -->|"fetch /api/..."| PROXY
    PROXY -->|"HTTP forward"| ROUTES
    ROUTES -->|"readdir, readFile"| ARCH
    ROUTES -->|"readFile"| SPEC
```

## Sequence: E2E テスト起動フロー

```mermaid
sequenceDiagram
    participant PW as Playwright
    participant VITE as Vite dev server (:5173)
    participant API as api-server.ts (:3847)
    participant FS as changes/archive/

    PW->>VITE: pnpm dev を起動
    PW->>API: node --import tsx/esm tests/e2e/setup/api-server.ts を起動
    API->>API: Fastify.listen(:3847)
    PW->>API: GET /api/health (webServer 待機条件)
    API-->>PW: { status: "ok" }
    PW->>VITE: page.goto('http://localhost:5173/')
    VITE-->>PW: Dashboard HTML
    PW->>VITE: fetch /api/changes (Vite proxy 経由)
    VITE->>API: forward /api/changes
    API->>FS: listChanges(includeArchived: true 相当)
    FS-->>API: ChangeInfo[]
    API-->>VITE: JSON
    VITE-->>PW: ChangeInfo[]
    PW->>PW: assert data-testid^="change-row-" exists
```

## Sequence: Mermaid SVG レンダリング検証

```mermaid
sequenceDiagram
    participant PW as Playwright
    participant SPA as React SPA
    participant MM as MermaidRenderer.tsx

    PW->>SPA: page.goto('/changes/:id/artifacts/architecture-overview.md')
    SPA->>SPA: ArtifactPreview.tsx がコンテンツを fetch
    SPA->>MM: react-markdown が ```mermaid ブロックを検出
    MM->>MM: useEffect → mermaid.render() (async)
    MM->>SPA: setSvg(rendered) → dangerouslySetInnerHTML
    PW->>SPA: waitForSelector('[data-testid="mermaid-svg"] svg', timeout: 15000)
    SPA-->>PW: SVG 要素が DOM に出現
    PW->>PW: expect(svg).toBeTruthy()
```

## Sequence: テーマ切り替え + LocalStorage 永続化検証

```mermaid
sequenceDiagram
    participant PW as Playwright
    participant SPA as React SPA
    participant LS as localStorage

    PW->>SPA: page.goto('/')
    SPA->>LS: persist middleware が theme を読み込み（初期: 'light'）
    PW->>SPA: click [data-testid="theme-toggle"]
    SPA->>SPA: toggleTheme() → html.classList.add('dark')
    SPA->>LS: persist middleware が theme: 'dark' を書き込み
    PW->>SPA: page.reload()
    SPA->>LS: persist middleware が theme: 'dark' を読み込み
    SPA->>SPA: ThemeToggle useEffect → html.classList.add('dark')
    PW->>SPA: locator('html').evaluate(el => el.classList.contains('dark'))
    SPA-->>PW: true
    PW->>SPA: evaluate(() => localStorage.getItem('mspec-ui-store'))
    SPA-->>PW: {"state":{"theme":"dark"},...}
```

## テストファイルと FR のマッピング

```mermaid
graph LR
    D["dashboard.e2e.test.ts"] -->|"covers"| FR5["change-dashboard FR-005\nダッシュボード表示"]
    D -->|"covers"| FR6D["change-dashboard FR-006\nモードフィルター"]

    AP["artifact-preview.e2e.test.ts"] -->|"covers"| FR6A["artifact-preview FR-006\nMermaid SVG"]
    AP -->|"covers"| FR7["artifact-preview FR-007\nテーマ永続化"]
    AP -->|"covers"| FR8["artifact-preview FR-008\nGherkin ハイライト"]

    TR["test-results.e2e.test.ts"] -->|"covers"| FR5T["test-result-viewer FR-005\nバッジ表示"]
    TR -->|"covers"| FR6T["test-result-viewer FR-006\nトレース展開"]
```

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ architecture-overview は design.md と同一ステップで生成、外部依存なし | ✅ 各 Mermaid 図は独立して参照・更新可能 |
| II 決定論的マージ | ✅ 新規ファイルで既存への影響なし | ✅ Mermaid 記法は構造化されており将来の更新が確定的 |
| III 質問駆動の要件確定 | ✅ 全設計決定は proposal・research・AskUserQuestion を経て確定している | ✅ 図は確定済みの設計決定のみを反映している |
| IV 双方向アンカー | ✅ System Diagram が design.md の Project Structure と対応している | ✅ テストファイルマッピング図が各 FR に 1:1 で対応している |
| V 強制ステップと拡張ステップの分離 | ✅ architecture-overview は design ステップの強制成果物として管理されている | ✅ Mermaid 図（必須）と追加 Sequence 図（拡張）が明確に分かれている |

### Complexity Tracking

None.
