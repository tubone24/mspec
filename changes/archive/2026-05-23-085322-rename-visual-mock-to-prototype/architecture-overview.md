---
doc_type: Reference
---

# Architecture Overview: rename-visual-mock-to-prototype

## System Diagram

```mermaid
graph TD
    User["ユーザー"] -->|"/mspec:prototype"| Skill["mspec-visual-prototype\n(.claude/skills/)"]
    Skill -->|"mspec prototype --change <c>"| CLI["CLI: prototype.ts"]
    CLI -->|"mkdir prototype/"| FS1["changes/<change>/prototype/"]
    CLI -->|"invoke subagent"| Agent["mspec-visual-prototype-runner\n(.claude/agents/)"]
    Agent -->|"write index.html"| FS1
    CLI -->|"startPrototypeServer()"| Server["prototype-server.ts\nlocalhost:3737"]
    Server -->|"serves"| FS1
    User -->|"browser"| Server
    User -->|"Ctrl+C → feedback"| CLI
    CLI -->|"write"| FS2["changes/<change>/prototype-feedback.md"]

    subgraph "mspec init"
        InitCmd["init.ts"] -->|"copy templates/claude/agents/"| AgentInstall[".claude/agents/\nmspec-visual-prototype-runner.md"]
    end

    subgraph "mapSubagentName() in continue.ts"
        StepId["step id: visual-mock"] -->|"case 'visual-mock'"| AgentName["mspec-visual-prototype-runner"]
    end
```

## Sequence Diagram: `/mspec:prototype` 実行フロー

```mermaid
sequenceDiagram
    actor User
    participant Skill as mspec-visual-prototype<br/>(skill)
    participant CLI as prototype.ts
    participant Agent as mspec-visual-prototype-runner<br/>(agent)
    participant Server as prototype-server.ts

    User->>Skill: /mspec:prototype
    Skill->>CLI: mspec prototype --change <c>
    CLI->>CLI: mkdir changes/<c>/prototype/
    CLI->>Agent: (subagent invocation via Claude Code)
    Agent->>CLI: writes prototype/index.html
    CLI->>Server: startPrototypeServer(prototypeDir, 3737)
    Server-->>CLI: { port: 3737, close() }
    CLI->>User: "Serving prototype at http://localhost:3737"
    User->>Server: browser request
    Server-->>User: index.html
    User->>CLI: Ctrl+C
    CLI->>CLI: askMultiline() for feedback
    CLI->>CLI: write prototype-feedback.md
    CLI-->>User: "Feedback saved to prototype-feedback.md"
```

## Sequence Diagram: `mspec init` でのサブエージェントインストール

```mermaid
sequenceDiagram
    actor User
    participant Init as init.ts
    participant Templates as templates/claude/agents/
    participant Dest as .claude/agents/

    User->>Init: mspec init
    Init->>Templates: listFilesRecursive()
    Templates-->>Init: [mspec-researcher.md,<br/>mspec-self-reviewer.md,<br/>mspec-checklist-auditor.md,<br/>mspec-visual-prototype-runner.md]
    loop each agent file
        Init->>Dest: writeFile(agentFile)
        Dest-->>Init: done
    end
    Init->>User: mspec init: done.
```

## ファイル改名マッピング

```mermaid
graph LR
    subgraph Before
        A["mock.ts"]
        B["mock-server.ts"]
        C["mock.md (command)"]
        D["mspec-visual-mock/SKILL.md"]
        E["mspec-visual-mock-runner/SKILL.md\n(skills/)"]
    end
    subgraph After
        A2["prototype.ts"]
        B2["prototype-server.ts"]
        C2["prototype.md (command)"]
        D2["mspec-visual-prototype/SKILL.md"]
        E2["mspec-visual-prototype-runner.md\n(agents/)"]
    end
    A -->|rename| A2
    B -->|rename| B2
    C -->|rename| C2
    D -->|rename| D2
    E -->|delete + recreate| E2
```

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I  ステップ独立性 | ✅ architecture-overview は他ステップ成果物を変更しない | ✅ `changes/` 以下にのみ配置される |
| II  決定論的マージ | ✅ SoT spec と衝突なし | ✅ — |
| III  質問駆動の要件確定 | ✅ ユーザー確認済み（エイリアス・関数名リネーム） | ✅ 未解決事項なし |
| IV  双方向アンカー | ✅ Delta Spec アンカーに対応するダイアグラムを記述 | ✅ — |
| V  強制ステップと拡張ステップの分離 | ✅ visual-mock は任意ステップ。必須ステップに影響しない | ✅ — |

### Complexity Tracking

None
