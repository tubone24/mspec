---
doc_type: ArchitectureOverview
---

# Architecture Overview: init-link-global-bin

## System Diagram

```mermaid
graph TD
    User["ユーザー"] -->|mspec init| InitCmd["initCommand()\npackages/cli/src/commands/init.ts"]

    InitCmd --> FileOps["既存ファイル配置処理\n.mspec/config.yaml\n.mspec/workflow.yaml\n.claude/commands/ etc."]
    FileOps --> EnsureLink["ensureGlobalLink()"]

    EnsureLink --> DevCheck{"packages/cli/package.json\n存在するか?"}
    DevCheck -->|No: non-dev| Skip["スキップ (FR-002)"]
    DevCheck -->|Yes: dev-mode| Build["spawnSync: npm run build\ncwd=packages/cli\nstdio=inherit"]

    Build --> BuildOK{"status === 0?"}
    BuildOK -->|失敗| WarnBuild["console.warn (FR-003)\n手動ビルドを促す"]
    BuildOK -->|成功| Link["spawnSync: npm link\ncwd=packages/cli\nstdio=inherit"]

    Link --> LinkOK{"status === 0?"}
    LinkOK -->|失敗| WarnLink["console.warn (FR-003)\n手動linkを促す"]
    LinkOK -->|成功| Done["console.log ✓ mspec linked globally (FR-001)"]

    Skip --> End["init完了"]
    WarnBuild --> End
    WarnLink --> End
    Done --> End
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant I as initCommand()
    participant FS as ファイルシステム
    participant NP as node:child_process
    participant NPM as npm CLI

    U->>I: mspec init
    I->>FS: ファイル配置 (.mspec/*, .claude/*)
    FS-->>I: 完了
    I->>I: ensureGlobalLink()
    I->>FS: pathExists(packages/cli/package.json)
    alt dev-mode
        FS-->>I: true
        I->>NP: spawnSync('npm', ['run', 'build'], {cwd, stdio:'inherit'})
        NP->>NPM: npm run build
        NPM-->>U: build stdout (リアルタイム)
        NPM-->>NP: status=0
        NP-->>I: {status:0}
        I->>NP: spawnSync('npm', ['link'], {cwd, stdio:'inherit'})
        NP->>NPM: npm link
        NPM-->>U: link stdout (リアルタイム)
        NPM-->>NP: status=0
        NP-->>I: {status:0}
        I->>U: ✓ mspec linked globally
    else non-dev-mode
        FS-->>I: false
        I->>I: return (スキップ)
    end
    I->>U: init完了メッセージ
```

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I: ステップ独立性 | ✅ 変更は `init.ts` に閉じており他コマンドとの結合なし | ✅ アーキテクチャ図が示す通り `ensureGlobalLink` は独立したフェーズとして分離 |
| II: 決定論的マージ | ✅ 追加のみ。既存フローを変更しない | ✅ `npm link` は冪等。重複実行しても安全 |
| III: 質問駆動の要件確定 | ✅ 全オープンチョイスが解決済み | ✅ アーキテクチャ図に反映済み |
| IV: 双方向アンカー | ✅ `@mspec-delta` アンカーを実装フェーズで埋め込む | ✅ System Diagram の各ノードが FR-001/002/003 に対応 |
| V: 強制ステップと拡張ステップの分離 | ✅ ファイル配置（強制）とリンク（拡張・dev-mode限定）が明確に分離 | ✅ Sequence Diagram で `alt dev-mode` として明示的に分岐 |
