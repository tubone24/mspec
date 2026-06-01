---
doc_type: Reference
---

# Architecture Overview: web-ui-smart-launch

## System Context

```mermaid
graph TB
    subgraph CLI["mspec CLI (packages/cli)"]
        NewCmd["new.ts\n(既存コマンド)"]
        OpenCmd["open.ts\n(新規コマンド)"]
        Launcher["server/index.ts\nlaunchWebUiIfNeeded()"]
        PortRes["server/portResolver.ts\nresolvePortFromList()"]
        PIDMgr["server/pidManager.ts\nreadPid / writePid / deletePid"]
        Proto["lib/prototype-server.ts\nisPortFree(port, '127.0.0.1')"]
    end

    subgraph Server["Web UI Server (server-process.ts)"]
        Fastify["Fastify App\n(127.0.0.1 bind)"]
        Health["GET /__mspec/health\n{projectRoot, token, port, pid}"]
        ExistingRoutes["既存 API ルート群"]
        Fastify --> Health
        Fastify --> ExistingRoutes
    end

    PIDFile[".mspec/ui.pid\n{pid, port, projectRoot, token}"]
    Browser["ブラウザ\n(mspec open のみ)"]

    NewCmd --> Launcher
    OpenCmd --> Launcher
    OpenCmd -->|"open URL"| Browser
    Launcher --> PortRes
    PortRes --> Proto
    Launcher --> PIDMgr
    PIDMgr <-->|"JSON read/write"| PIDFile
    Launcher -->|"HTTP GET (fetch)"| Health
    Launcher -->|"spawn(shell:false)"| Server
```

## Sequence: スマート起動フロー

```mermaid
sequenceDiagram
    participant CLI as mspec CLI<br/>(new / open)
    participant L as launchWebUiIfNeeded<br/>(server/index.ts)
    participant P as pidManager.ts
    participant R as portResolver.ts
    participant H as /__mspec/health
    participant S as Web UI Server<br/>(server-process.ts)

    CLI->>L: launchWebUiIfNeeded(root, config)
    L->>P: readPid()

    alt PID ファイルなし
        P-->>L: null
        L->>R: resolvePortFromList([3847..3851])
        R-->>L: freePort
        Note over L: token = crypto.randomUUID()
        L->>S: spawn(shell:false, [--port freePort,<br/>--token token, --project-root root])
        loop HTTP ポーリング (200ms 間隔, 5秒 timeout)
            L->>H: GET /__mspec/health
            H-->>L: 200 {projectRoot, token, port, pid}
        end
        L->>P: writePid({pid, port, projectRoot, token})
        L-->>CLI: {url: "http://localhost:freePort", reused: false}

    else PID ファイルあり (既存プロセス確認)
        P-->>L: {pid, port, projectRoot, token}
        L->>H: GET /__mspec/health (timeout: 1秒)

        alt HTTP 成功 & projectRoot + token 一致
            H-->>L: 200 {projectRoot, token}
            L-->>CLI: {url: "http://localhost:port", reused: true}

        else HTTP 失敗 or 照合不一致 (ステール PID)
            H-->>L: error / mismatch
            L->>P: deletePid()
            Note over L: → PID ファイルなしフローへ
        end
    end

    CLI->>CLI: console.log(reused ?<br/>"already running" : "started", url)
```

## Data Model

### PidEntry（.mspec/ui.pid）

```typescript
// packages/cli/src/server/pidManager.ts
interface PidEntry {
  pid: number;       // プロセス ID
  port: number;      // リッスンポート
  projectRoot: string; // プロジェクトルートの絶対パス
  token: string;     // crypto.randomUUID() で生成したランダムトークン
}
```

**旧フォーマット（`pid:port` プレーンテキスト）との後方互換**: JSON.parse 失敗時は `null` を返し、新規起動フローへ進む。

### /__mspec/health レスポンス

```typescript
interface HealthResponse {
  projectRoot: string;
  token: string;
  port: number;
  pid: number;
}
```

## ポート選択フロー

```mermaid
flowchart TD
    Start([resolvePortFromList 開始]) --> Check{candidates が空?}
    Check -->|Yes| Error([Error: 候補ポートが全て使用中])
    Check -->|No| Take[次の候補を取得]
    Take --> Probe[isPortFree&#40port, '127.0.0.1'&#41]
    Probe -->|空き| Return([ポートを返す])
    Probe -->|使用中| Check
```

## セキュリティ境界

| 境界 | 対策 | 対応 FR |
|------|------|---------|
| 外部ネットワーク露出 | `127.0.0.1` 強制バインド | FR-013 |
| コマンドインジェクション | `shell: false` 明示 + ポート整数バリデーション | FR-014 |
| 別プロセスによるポート先取り | `/__mspec/health` でプロジェクト ID + トークン照合 | FR-011 |
| ステール PID による誤再利用 | HTTP ヘルスチェック失敗時に自動クリーンアップ | FR-010 |

## Constitution Check

> Step: design | Constitution Version: 1.1.0

| 原則 | Phase 0 | Phase 1 | Notes |
|------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 図は design.md / research.md のみを参照 |
| II. 決定論的マージ | ✅ | ✅ | Mermaid 図は仕様の視覚化であり、マージ対象外 |
| III. 質問駆動の要件確定 | ✅ | ✅ | 図に新たな未確定事項なし |
| IV. 双方向アンカー | ✅ | ✅ | architecture-overview は非アンカー対象文書 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ワークフロー変更なし |
| VI. Security by Default | ✅ | ✅ | セキュリティ境界テーブルで全防衛策を可視化 |
| VII. 設計意図と実装の対応確認 | ✅ | ✅ | Sequence Diagram が design.md の D-001〜D-008 と対応 |

### Complexity Tracking

None
