---
doc_type: Reference
---

# Architecture Overview: cli-upgrade

## System Context Diagram

```mermaid
graph TD
    User["ユーザー\n(Terminal)"]
    CLI["mspec CLI\n(packages/cli/src/index.ts)"]
    UpgradeCmd["upgradeCommand\n(commands/upgrade.ts)"]
    PromptLib["ask()\n(lib/prompt.ts)"]
    Registry["npm Registry\nhttps://registry.npmjs.org/\n@mspec/cli/latest"]
    NPM["npm CLI\n(npm install -g)"]

    User -->|"mspec upgrade\n[--yes]"| CLI
    CLI -->|"program.command('upgrade')"| UpgradeCmd
    UpgradeCmd -->|"getCurrentVersion()\n(createRequire + package.json)"| UpgradeCmd
    UpgradeCmd -->|"fetch() + AbortSignal.timeout(10_000)"| Registry
    Registry -->|"{ version: '1.x.x' }"| UpgradeCmd
    UpgradeCmd -->|"ask('アップグレードしますか？')"| PromptLib
    PromptLib -->|"ユーザー入力"| User
    UpgradeCmd -->|"spawnSync('npm', ['install', '-g', '@mspec/cli@latest'],\n{ stdio: 'inherit' })"| NPM
    NPM -->|"インストール進捗 (stdout/stderr inherit)"| User
```

## Sequence Diagram: mspec upgrade（通常フロー）

```mermaid
sequenceDiagram
    actor User
    participant CLI as mspec (index.ts)
    participant Upgrade as upgradeCommand
    participant Registry as npm Registry
    participant Prompt as ask()
    participant NPM as npm install

    User->>CLI: mspec upgrade
    CLI->>Upgrade: upgradeCommand({ yes: false })
    Upgrade->>Upgrade: getCurrentVersion() → "0.1.0-beta.1"
    Upgrade->>Registry: GET /\@mspec/cli/latest (timeout: 10s)
    Registry-->>Upgrade: { version: "1.0.0" }
    Upgrade->>User: 現在のバージョン: 0.1.0-beta.1\n最新バージョン:   1.0.0
    Upgrade->>Prompt: ask('アップグレードしますか？ [y/N] ')
    Prompt->>User: prompt表示
    User->>Prompt: "y"
    Prompt-->>Upgrade: "y"
    Upgrade->>NPM: spawnSync npm install -g @mspec/cli@latest
    NPM-->>User: (インストール進捗リアルタイム表示)
    NPM-->>Upgrade: status: 0
    Upgrade->>User: ✓ アップグレード完了
```

## Sequence Diagram: already up-to-date フロー

```mermaid
sequenceDiagram
    actor User
    participant Upgrade as upgradeCommand
    participant Registry as npm Registry

    User->>Upgrade: mspec upgrade
    Upgrade->>Registry: GET /\@mspec/cli/latest
    Registry-->>Upgrade: { version: "0.1.0-beta.1" }
    Upgrade->>User: すでに最新バージョンです (0.1.0-beta.1)
    Note over Upgrade: process.exit(0)
```

## Sequence Diagram: ネットワークエラーフロー（version-check FR-002）

```mermaid
sequenceDiagram
    actor User
    participant Upgrade as upgradeCommand
    participant Registry as npm Registry

    User->>Upgrade: mspec upgrade
    Upgrade->>Registry: GET /\@mspec/cli/latest (timeout: 10s)
    Registry--xUpgrade: TimeoutError / NetworkError
    Upgrade->>User: [stderr] バージョン情報の取得に失敗しました: <error message>
    Note over Upgrade: process.exit(1)
```

## Sequence Diagram: --yes フラグによる確認スキップ

```mermaid
sequenceDiagram
    actor User
    participant Upgrade as upgradeCommand
    participant Registry as npm Registry
    participant NPM as npm install

    User->>Upgrade: mspec upgrade --yes
    Upgrade->>Registry: GET /\@mspec/cli/latest
    Registry-->>Upgrade: { version: "1.0.0" }
    Upgrade->>User: 現在のバージョン: 0.1.0-beta.1\n最新バージョン:   1.0.0
    Note over Upgrade: --yes のため ask() をスキップ
    Upgrade->>NPM: spawnSync npm install -g @mspec/cli@latest
    NPM-->>Upgrade: status: 0
    Upgrade->>User: ✓ アップグレード完了
```

## Data Model: npm Registry レスポンス（使用フィールドのみ）

```mermaid
erDiagram
    NPM_REGISTRY_RESPONSE {
        string version "例: 1.0.0 (latest stable のみ)"
        string name    "@mspec/cli"
    }
    UPGRADE_COMMAND {
        string currentVersion "package.json から取得"
        string latestVersion  "registry から取得"
        boolean isUpToDate    "currentVersion === latestVersion"
    }
    UPGRADE_COMMAND ||--|| NPM_REGISTRY_RESPONSE : "fetch して latestVersion を取得"
```

## File Structure: 変更対象

```
packages/cli/
├── src/
│   ├── index.ts               ← 変更: upgradeCommand を import・登録
│   └── commands/
│       └── upgrade.ts         ← 新規作成
└── package.json               ← 変更なし（依存追加なし）
```

## Constitution Check

| 原則 | Phase 0 (Architecture Overview) | Phase 1 (Architecture Overview) |
|------|--------------------------------|--------------------------------|
| I ステップ独立性 | OK — 本図は design.md の構造を視覚化したもので、後続ステップへの依存なし | OK — Phase 1: 図の内容は design.md の契約のみを反映しており、実装詳細を含まない |
| II 決定論的マージ | OK — ファイル構成・コンポーネント間の接続が一意に表現されており、曖昧さなし | OK — Phase 1: 各シーケンス図は Delta Spec の Scenario に対応しており、実装時の解釈ブレなし |
| III 質問駆動の要件確定 | OK — 図は確定済みの設計を視覚化するもので、新たな要件を導入していない | OK — Phase 1: 未解決の設計選択肢を含まない |
| IV 双方向アンカー | OK — シーケンス図の各フローは cli-upgrade / version-check の FR 番号と対応 | OK — Phase 1: ER 図のフィールドは version-check FR-001/FR-003 の要件と整合 |
| V 強制ステップと拡張ステップの分離 | OK — 実装コードは含まず、構造・フローの可視化に限定 | OK — Phase 1: テストケースや実装手順は tasks.md に委ねている |

### Complexity Tracking

None
