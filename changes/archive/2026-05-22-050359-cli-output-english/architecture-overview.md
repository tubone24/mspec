---
doc_type: Reference
---

# Architecture Overview: cli-output-english

## System Diagram

```mermaid
graph TD
    User["ユーザー"]
    CLI["mspec CLI (index.js)"]
    UC["upgradeCommand()"]
    NPM["npm registry\n(registry.npmjs.org)"]
    PKG["package.json\n(getCurrentVersion)"]

    User -->|"mspec upgrade"| CLI
    CLI --> UC
    UC -->|"fetch @mspec/cli/latest"| NPM
    NPM -->|"{ version: 'x.y.z' }"| UC
    UC --> PKG
    PKG -->|"currentVersion"| UC
    UC -->|"English output ✅"| User
```

## Sequence Diagram: mspec upgrade (after this change)

```mermaid
sequenceDiagram
    participant U as User
    participant C as upgradeCommand()
    participant N as npm registry
    participant P as package.json

    U->>C: mspec upgrade
    C->>N: GET /registry.npmjs.org/@mspec/cli/latest
    N-->>C: latestVersion
    C->>P: readFileSync(package.json)
    P-->>C: currentVersion

    C->>U: "Current version: x.y.z"
    C->>U: "Latest version:  a.b.c"

    alt currentVersion === latestVersion
        C->>U: "Already up to date (x.y.z)" ✅
    else latestVersion newer
        C->>U: "Upgrade to a.b.c? [y/N]"
        U-->>C: y
        C->>C: npm install -g @mspec/cli@latest
        C->>U: "✓ Upgrade complete" ✅
    end
```

## Change Scope

この変更はアーキテクチャに影響しない。変更されるのは `upgradeCommand()` 内の文字列リテラル8箇所のみ。モジュール構成・依存関係・インターフェースはすべて不変。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | ✅ アーキテクチャ図は設計の可視化のみ | ✅ |
| II 決定論的マージ | ✅ 変更スコープが明確に定義されている | ✅ |
| III 質問駆動の要件確定 | ✅ 設計判断はすべて design.md / design-rationale.md で確定 | ✅ |
| IV 双方向アンカー | ✅ シーケンス図が FR-002/FR-004 の受け入れ基準を可視化 | ✅ |
| V 強制ステップと拡張ステップの分離 | ✅ architecture-overview は設計成果物として分離 | ✅ |

### Complexity Tracking

None
