---
doc_type: Reference
---

# Architecture Overview: multi-test-runner-support

## System Diagram

```mermaid
graph TD
    subgraph "Config Layer"
        A[".mspec/config.yaml"] --> B["TestConfigSchema (Zod)"]
        B --> C{"runners[]<br/>defined?"}
        C -- "Yes (len > 0)" --> D["RunnerSchema[]<br/>multi-runner mode"]
        C -- "No / empty" --> E["legacy test.command<br/>single-runner mode"]
    end

    subgraph "Execution Layer (test.ts)"
        F["mspec test --expect-red/green"] --> G["resolveRunners(cfg)"]
        G --> D
        G --> E
        D --> H["ResolvedRunner[]"]
        E --> H
        H --> I["Sequential Loop"]
        I --> J["runShell(cmd, cwd?)"]
        J -- "exit ok" --> K{"more<br/>runners?"}
        K -- "yes" --> I
        K -- "no" --> L["Write evidence JSON"]
        J -- "exit fail" --> M["fail-fast: log runner name<br/>exit non-zero<br/>NO evidence"]
    end

    subgraph "Evidence Layer"
        L --> N[".mspec/cache/<br/>{red,green}-evidence/<br/><change>__<task-id>.json"]
        N --> O["enforce.ts<br/>checkEnforceTdd()<br/>(unchanged)"]
    end
```

## Sequence Diagram: Multi-Runner Execution

```mermaid
sequenceDiagram
    participant U as User
    participant CLI as mspec test
    participant CFG as .mspec/config.yaml
    participant SH as Shell

    U->>CLI: mspec test --expect-green T001
    CLI->>CFG: loadConfig()
    CFG-->>CLI: {test: {runners: [backend, frontend]}}
    CLI->>CLI: resolveRunners(cfg) → [backend, frontend]

    loop For each runner (sequential)
        CLI->>SH: spawn(runner.command, {cwd})
        SH-->>CLI: exit code
        alt exit ok (in expect_green_on_exit)
            CLI->>CLI: push result
            Note over CLI: continue to next runner
        else exit fail
            CLI-->>U: ✗ runner "backend" failed (exit=1)
            CLI-->>U: process.exitCode = 1
            Note over CLI: STOP — no evidence written
        end
    end

    CLI->>CLI: write evidence JSON
    Note right of CLI: command: [cmd1, cmd2]<br/>runners: [{name, exit_code}, ...]
    CLI-->>U: ✓ evidence saved
```

## Data Model: Config Schema Extension

```mermaid
classDiagram
    class TestConfigSchema {
        +command: string (legacy, optional)
        +expect_red_on_exit: number[]
        +expect_green_on_exit: number[]
        +results_src?: string (legacy)
        +runners?: RunnerSchema[]
    }

    class RunnerSchema {
        +name: string
        +command: string
        +cwd?: string
        +expect_red_on_exit?: number[]
        +expect_green_on_exit?: number[]
        +results_src?: string
    }

    class ResolvedRunner {
        +name: string
        +command: string
        +cwd?: string
        +expectRedOnExit: number[]
        +expectGreenOnExit: number[]
        +resultsSrc?: string
    }

    TestConfigSchema "1" --> "0..*" RunnerSchema : runners
    RunnerSchema ..> ResolvedRunner : resolveRunners()
```

## Data Model: Evidence JSON Payload (拡張後)

```mermaid
classDiagram
    class EvidenceJSON {
        +task_id: string
        +change: string
        +expect: "red" | "green"
        +command: string[] ← 変更(string→配列)
        +exit_code: number
        +runners: RunnerResult[] ← 追加
        +recorded_at: string (ISO 8601)
        +ok: boolean
    }

    class RunnerResult {
        +name: string
        +exit_code: number
    }

    EvidenceJSON "1" --> "1..*" RunnerResult : runners
```

## File Copy Paths: results_src の変化

| モード | コピー元 | コピー先 |
|--------|---------|---------|
| Legacy (runners なし) | `<results_src>` | `e2e-results/<basename>` |
| Multi-runner | `runner.results_src` | `e2e-results/<runner-name>/<basename>` |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ | ✅ architecture-overview は図のみ。コード変更なし |
| II 決定論的マージ | ✅ | ✅ |
| III 質問駆動の要件確定 | ✅ | ✅ |
| IV 双方向アンカー | ✅ | ✅ design.md と相互参照済み |
| V 強制/拡張ステップ分離 | ✅ | ✅ |
| VI Security by Default | ✅ | ✅ |

### Complexity Tracking

None
