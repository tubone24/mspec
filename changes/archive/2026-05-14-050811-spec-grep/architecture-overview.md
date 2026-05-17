# Architecture Overview: spec grep/list サブコマンド

## System Diagram

```mermaid
graph TD
    subgraph CLI Entry Point
        IDX["index.ts\n(spec command group)"]
    end

    subgraph New Commands
        LR["spec-list-requirements.ts\n(FR-011, FR-014)"]
        SG["spec-grep.ts\n(FR-012, FR-014)"]
        LC["spec-list-capabilities.ts\n(FR-013, FR-014)"]
    end

    subgraph Existing Lib
        SL["lib/spec-linter.ts\ncollectSotSpecs()\nlistCapabilityNames() ★新規"]
        FN["lib/fr-numbering.ts\nFR_HEADING_RE\nscanFrIdsFromContents()"]
        CD["lib/change-discovery.ts\nlistChanges()\ndirExists()"]
        PW["workflow/paths.ts\nprojectPaths()"]
    end

    subgraph Parser
        MD["parser/markdown.ts\nparseMd()\nsectionsByDepth()\nsliceSource()"]
        DS["parser/delta-spec.ts\nREQUIREMENT_RE"]
    end

    subgraph File System
        SOTS["specs/*/spec.md\n(SoT)"]
        DELTA["changes/*/specs/*/spec.md\n(Delta Spec)"]
    end

    IDX --> LR
    IDX --> SG
    IDX --> LC

    LR --> SL
    LR --> MD
    LR --> DS
    LR --> PW

    SG --> FN
    SG --> MD
    SG --> CD
    SG --> PW

    LC --> SL
    LC --> CD
    LC --> PW

    SL --> SOTS
    CD --> DELTA
```

## Sequence Diagram: `mspec spec grep FR-011`

```mermaid
sequenceDiagram
    actor User
    participant CLI as index.ts
    participant Grep as spec-grep.ts
    participant Paths as workflow/paths.ts
    participant Linter as lib/spec-linter.ts
    participant Discovery as lib/change-discovery.ts
    participant MD as parser/markdown.ts

    User->>CLI: mspec spec grep FR-011
    CLI->>Grep: specGrepCommand("FR-011", opts)

    alt FR-ID 形式不正 (/^FR-\d{1,4}$/i 不一致)
        Grep-->>User: Error + exit 1
    end

    Grep->>Paths: projectPaths(cwd)
    Paths-->>Grep: {specsDir, changesDir, ...}

    Note over Grep,Linter: SoT スペックを検索
    Grep->>Linter: collectSotSpecs(specsDir)
    Linter-->>Grep: ["/abs/specs/cli-spec-lint/spec.md", ...]

    loop each SoT spec.md
        Grep->>MD: parseMd(content)
        MD-->>Grep: AST root
        Grep->>MD: sectionsByDepth(root, 3)
        MD-->>Grep: MdSection[]
        alt section.heading が FR-011 を含む
            Grep->>MD: sliceSource(content, start, end)
            MD-->>Grep: raw block string
            Note over Grep: hits に追加
        end
    end

    Note over Grep,Discovery: Delta Spec を検索
    Grep->>Discovery: listChanges(paths)
    Discovery-->>Grep: ChangeLocation[]

    loop each change
        Grep->>Discovery: await resolveProduces / glob specs/*/spec.md
        loop each delta spec.md
            Grep->>MD: parseMd + sectionsByDepth
            alt FR-011 match
                Grep->>MD: sliceSource
                Note over Grep: hits に追加
            end
        end
    end

    alt opts.json
        Grep-->>User: JSON {command, results, meta}
    else human
        Grep-->>User: ファイルパス + ブロックテキスト
    end
```

## Data Model: JSON Envelopes (FR-014)

```mermaid
classDiagram
    class JsonEnvelope {
        +string command
        +Result[] results
        +Meta meta
    }

    class ListRequirementsResult {
        +string capability
        +string fr_id
        +string title
    }

    class GrepResult {
        +string fr_id
        +string file
        +string block
    }

    class ListCapabilitiesResult {
        +string capability
    }

    class ListRequirementsMeta {
        +string specsDir
        +number count
    }

    class GrepMeta {
        +string query
        +number count
    }

    class ListCapabilitiesMeta {
        +string specsDir
        +number count
    }

    JsonEnvelope --> ListRequirementsResult : command=list-requirements
    JsonEnvelope --> GrepResult : command=spec-grep
    JsonEnvelope --> ListCapabilitiesResult : command=list-capabilities
    JsonEnvelope --> ListRequirementsMeta
    JsonEnvelope --> GrepMeta
    JsonEnvelope --> ListCapabilitiesMeta
```

## Anchor Placement

E2E テストファイル（`tests/e2e/spec-grep.e2e.test.ts`）の先頭に以下を配置する：

```typescript
// @mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-011, FR-012, FR-013, FR-014
// Change: spec-grep
```

実装コマンドファイル（`src/commands/spec-grep.ts` 等）にも同じアンカーを付与し、双方向追跡を保証する。

## Constitution Check

> Step: design (architecture-overview) | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | アーキテクチャ図は設計ドキュメント。実装ファイルへの副作用なし。 |
| II. 決定論的マージ | ✅ | ✅ | `architecture-overview.md` は archive の直接マージ対象ではない。 |
| III. 質問駆動の要件確定 | ✅ | ✅ | ユーザー入力不要の純粋な構造説明。 |
| IV. 双方向アンカー | ✅ | ✅ | アンカー配置先を明示（E2E テスト + コマンドファイル）。implement で実施。 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ワークフロー構造を変更しない。 |

### Complexity Tracking

None — 違反 0 件。
