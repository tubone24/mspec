---
doc_type: Reference
---

# Architecture Overview: init-gitignore-ui-pid

## System Diagram

```mermaid
graph TD
    subgraph CLI["packages/cli"]
        INIT["init.ts\ninitCommand()"]
        PLANNED["PlannedFile[]\n（宣言的ファイル生成リスト）"]
        COLLISIONS["collisions check\n(init.ts:241-251)"]
        WRITE["writeFile loop\n(init.ts:253-260)"]
        TPL["templates/\nmspec-gitignore"]
    end

    subgraph Output[".mspec/ (生成物)"]
        GITIGNORE[".mspec/.gitignore\n（ui.pid を含む）"]
        PIDFILE[".mspec/ui.pid\n（実行時に生成）"]
    end

    subgraph Server["packages/cli/server"]
        PIDMGR["pidManager.ts\nwritePid()"]
    end

    INIT --> PLANNED
    PLANNED -->|"from: templates/mspec-gitignore\nto: .mspec/.gitignore"| COLLISIONS
    COLLISIONS -->|"--force または未存在"| WRITE
    COLLISIONS -->|"存在 & --force なし → exit(1)"| ABORT["中断"]
    WRITE -->|"readFile(TPL) → writeFile"| GITIGNORE
    TPL -->|"静的コピー"| WRITE
    PIDMGR -->|"mspec ui 起動時"| PIDFILE
    GITIGNORE -->|"ui.pid を除外"| PIDFILE
```

## Sequence Diagram: mspec init (fresh project)

```mermaid
sequenceDiagram
    actor User
    participant init as init.ts
    participant fs as File System

    User->>init: mspec init
    init->>init: PlannedFile[] を構築<br/>(config.yaml, workflow.yaml,<br/>constitution.md, .mspec/.gitignore 等)
    init->>fs: 各 dest の存在チェック (collisions)
    fs-->>init: .mspec/.gitignore 未存在
    init->>fs: readFile(templates/mspec-gitignore)
    fs-->>init: "# mspec runtime-generated files\nui.pid\n"
    init->>fs: writeFile(.mspec/.gitignore, content)
    fs-->>init: 完了
    init->>User: ✓ Created .mspec/.gitignore
```

## Sequence Diagram: mspec init (already initialized, no --force)

```mermaid
sequenceDiagram
    actor User
    participant init as init.ts
    participant fs as File System

    User->>init: mspec init (--force なし)
    init->>init: PlannedFile[] を構築
    init->>fs: 各 dest の存在チェック (collisions)
    fs-->>init: .mspec/.gitignore 存在
    init->>User: Error: existing mspec artifacts detected<br/>(exit code 1)
    Note over init: .mspec/.gitignore は変更されない
```

## Sequence Diagram: mspec init --force

```mermaid
sequenceDiagram
    actor User
    participant init as init.ts
    participant fs as File System

    User->>init: mspec init --force
    init->>init: PlannedFile[] を構築
    init->>init: collisions check をスキップ
    init->>fs: readFile(templates/mspec-gitignore)
    fs-->>init: テンプレート内容
    init->>fs: writeFile(.mspec/.gitignore, content)<br/>（上書き）
    fs-->>init: 完了
    init->>User: ✓ Re-created .mspec/.gitignore
```

## File Change Map

| ファイル | 種別 | 変更の概要 |
|---------|------|-----------|
| `packages/cli/src/commands/init.ts` | 修正 | `PlannedFile[]` に `.mspec/.gitignore` エントリ追加 + `@mspec-delta` アンカーコメント |
| `packages/cli/templates/mspec-gitignore` | 新規 | `ui.pid` を含む静的テンプレート |

## Constitution Check

> Step: architecture-overview | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | Sequence Diagram で `init.ts` が自ステップ内で完結することを図示 |
| II. 決定論的マージ | ✅ | ✅ | System Diagram で `PlannedFile[]` → `writeFile` の決定論的フローを図示 |
| III. 質問駆動の要件確定 | ✅ | ✅ | 3つの Sequence Diagram が FR-012 の3シナリオ（fresh / no-force / force）を網羅 |
| IV. 双方向アンカー | ✅ | ✅ | File Change Map に実装対象ファイルを明示。`init.ts` へのアンカー追加も明記 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | System Diagram に新ステップ・新スキルの追加なし。既存 `mspec init` フロー内の拡張のみ |
| VI. Security by Default | ✅ | ✅ | System Diagram で `.mspec/.gitignore` が `ui.pid` を除外する関係を図示 |

### Complexity Tracking

None — 違反 0 件。
