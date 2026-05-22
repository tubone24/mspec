---
doc_type: Reference
---

# Architecture Overview: fix-upgrade-package-json-path

## System Diagram

```mermaid
graph TD
    subgraph "変更対象"
        A["packages/cli/src/commands/upgrade.ts\ngetCurrentVersion() を修正"]
    end

    subgraph "変更しない"
        B["packages/cli/package.json\n参照先（変更なし）"]
        C["packages/cli/src/index.ts\nrequire('../package.json') — 現状正常動作"]
    end

    subgraph "ビルド成果物（再生成）"
        D["packages/cli/dist/index.js\ntsup build で再生成"]
    end

    A -->|tsup build| D
    D -->|fileURLToPath + readFileSync で参照| B
```

## パス解決: 修正前後の比較

```mermaid
graph LR
    subgraph "修正前（バグあり）"
        X1["dist/index.js\n（グローバル: /opt/homebrew/lib/node_modules/@mspec/cli/dist/）"]
        X2["../../package.json\n→ /opt/homebrew/lib/package.json\n（存在しない）"]
        X1 -->|createRequire 相対参照| X2
        X2 -->|Cannot find module| X3["ERROR"]
    end

    subgraph "修正後（正常）"
        Y1["dist/index.js\n（グローバル: /opt/homebrew/lib/node_modules/@mspec/cli/dist/）"]
        Y2["fileURLToPath(import.meta.url)\n→ dist/index.js の絶対パス"]
        Y3["dirname + join('../package.json')\n→ /opt/homebrew/lib/node_modules/@mspec/cli/package.json\n（存在する）"]
        Y1 -->|import.meta.url| Y2
        Y2 -->|readFileSync| Y3
    end
```

## Change Sequence

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant CLI as mspec upgrade
    participant Fn as getCurrentVersion()
    participant FS as ファイルシステム
    participant NPM as npm registry

    User->>CLI: mspec upgrade を実行
    CLI->>Fn: getCurrentVersion() 呼び出し
    Fn->>FS: fileURLToPath(import.meta.url) で dist/index.js の絶対パスを取得
    Fn->>FS: join(here, '../package.json') で package.json を readFileSync
    FS-->>Fn: package.json の内容を返す
    Fn-->>CLI: バージョン文字列を返す
    CLI->>NPM: fetchLatestVersion() で最新版を取得
    NPM-->>CLI: 最新バージョン文字列
    CLI-->>User: 現在バージョン / 最新バージョンを表示
```

## Scope Boundary

| ファイル | 対象 | 理由 |
|----------|------|------|
| `packages/cli/src/commands/upgrade.ts` | 変更 | `getCurrentVersion()` のバグ修正 |
| `packages/cli/dist/index.js` | 再生成 | tsup build で自動更新 |
| `packages/cli/src/index.ts` | 変更しない | `require('../package.json')` は現状正常動作 |
| `packages/cli/package.json` | 変更しない | 参照先（バグとは無関係） |

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ architecture-overview.md のみ生成、実装なし | ✅ 他ステップの成果物に依存せず独立 |
| II. 決定論的マージ | ✅ 新規ファイルのみ、競合なし | ✅ 図が変更対象を一意に特定している |
| III. 質問駆動の要件確定 | ✅ research 段階で設計方針確定済み | ✅ 追加の判断事項なし |
| IV. 双方向アンカー | ✅ design.md と相互参照 | ✅ 図が FR-001/FR-002 のシナリオと整合 |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | ✅ 拡張ステップへの依存なし |

### Complexity Tracking

None
