---
doc_type: Reference
---

# Architecture Overview: ui-visual-mock-workflow

## System Diagram

```mermaid
graph TD
    subgraph CLI["mspec CLI (commander)"]
        CMD["mspec mock\n--change / --port"]
        IDX["src/index.ts"]
    end

    subgraph MockCommand["src/commands/mock.ts"]
        RESOLVE["Active change 解決"]
        DETECT["framework-detector.ts\npackage.json → FrameworkInfo"]
        SUBAGENT["mspec-visual-mock-runner\nサブエージェント起動"]
        SERVER["mock-server.ts\nnode:http 静的サーバー"]
        FEEDBACK["prompt.ts ask()\nフィードバック収集"]
        SAVE["mock-feedback.md\n保存 (上書き)"]
    end

    subgraph Workflow["workflow.default.yaml"]
        PROP["proposal ステップ"]
        VMOCK["visual-mock ステップ\nskippable: true\nblock: true"]
        DELTA["delta ステップ"]
        TASKS["tasks ステップ"]
    end

    subgraph TasksSkill["mspec-tasks スキル"]
        SOFTREAD["mock-feedback.md\nソフト参照 (存在時のみ)"]
    end

    IDX --> CMD
    CMD --> RESOLVE
    RESOLVE --> DETECT
    DETECT --> SUBAGENT
    SUBAGENT -->|"mock/index.html"| SERVER
    SERVER -->|"Ctrl+C"| FEEDBACK
    FEEDBACK --> SAVE

    PROP --> VMOCK
    VMOCK --> DELTA
    DELTA --> TASKS
    SAVE -.->|"任意参照"| SOFTREAD
```

---

## Sequence Diagram: mspec mock 実行フロー

```mermaid
sequenceDiagram
    actor User
    participant CLI as mspec mock
    participant FD as framework-detector
    participant SA as mspec-visual-mock-runner<br/>(サブエージェント)
    participant FS as ファイルシステム
    participant SRV as mock-server (node:http)
    participant Browser as ブラウザ

    User->>CLI: mspec mock --change <change>
    CLI->>FS: proposal.md 読み込み
    CLI->>FD: detectFramework(projectRoot)
    FD->>FS: package.json 検査
    FD-->>CLI: FrameworkInfo { name, promptHint }

    CLI->>SA: 起動 (proposal.md + FrameworkInfo)
    SA->>FS: changes/<change>/mock/index.html 書き込み
    SA-->>CLI: 生成完了

    CLI->>SRV: startMockServer(mockDir, 3737)
    Note over SRV: ポート衝突時は<br/>自動インクリメント
    SRV-->>CLI: { port: 3737, close() }
    CLI->>User: Serving mock at http://localhost:3737

    User->>Browser: http://localhost:3737
    Browser->>SRV: GET /index.html
    SRV-->>Browser: HTML レスポンス
    User->>CLI: Ctrl+C (サーバー停止)
    SRV-->>CLI: サーバー終了

    CLI->>User: フィードバックを入力してください（空行で終了）
    User->>CLI: フィードバックテキスト入力
    CLI->>FS: mock-feedback.md 上書き保存
    CLI->>User: Feedback saved to mock-feedback.md
```

---

## Sequence Diagram: visual-mock ステップ skip フロー

```mermaid
sequenceDiagram
    actor User
    participant Continue as mspec continue
    participant Skip as mspec skip
    participant FS as ファイルシステム

    User->>Continue: mspec continue --change <change> --json
    Continue-->>User: current_step: "visual-mock"<br/>block_after: true

    User->>Skip: mspec skip visual-mock --change <change> --reason "..."
    Skip->>FS: mock-feedback.md に<br/>SKIPPED_PLACEHOLDER_MARKER 書き込み
    Skip-->>User: visual-mock skipped

    User->>Continue: mspec continue --change <change> --json
    Continue-->>User: current_step: "delta"
```

---

## Data Model: mock-feedback.md

```
changes/<change>/
├── mock/
│   └── index.html          ← mspec-visual-mock-runner が生成
└── mock-feedback.md        ← mspec mock が生成（または skip placeholder）
```

**mock-feedback.md フォーマット（通常時）:**
```markdown
# Mock Feedback

> Recorded: 2026-05-21T06:00:00Z
> Mock: changes/<change>/mock/index.html

<ユーザーが入力したフィードバック本文>
```

**mock-feedback.md フォーマット（skip 時）:**
```markdown
<!-- mspec: skipped step -->
```

---

## Component Responsibility Matrix

| コンポーネント | 責務 | 境界 |
|--------------|------|------|
| `src/commands/mock.ts` | コマンド引数解析・全体オーケストレーション | CLI 入出力 |
| `src/lib/mock-server.ts` | 静的ファイル配信・ポート管理 | TCP ソケット |
| `src/lib/framework-detector.ts` | CSS フレームワーク判定 | ファイルシステム読み取り |
| `mspec-visual-mock-runner` (SKILL) | HTML/CSS 生成 | LLM + ファイル書き込み |
| `mspec-visual-mock` (SKILL) | ワークフローステップ制御 | mspec workflow engine |
| `prompt.ts` (既存) | stdin 対話入力 | stdin/stdout |
