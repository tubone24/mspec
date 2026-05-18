---
doc_type: Reference
---

# Architecture Overview: fix-locale-spec-language

## System Diagram

ロケール解決フローの全体像。今回の変更で追加・修正されるコンポーネントを `[NEW]`/`[MOD]` で示す。

```mermaid
graph TD
    CFG["config.yaml\n(locale: ja)"]
    LC["locale-resolver.ts\nDEFAULT_LOCALE='ja'"]
    CL["config-loader.ts\nloadConfig()"]
    TR["template-resolver.ts\nresolveTemplate()"]

    subgraph "Templates [D-3: NEW]"
        TJ["<artifact>.ja.md"]
        TE["<artifact>.en.md"]
        TL["<artifact>.md (legacy → DELETE)"]
    end

    subgraph "Commands"
        NEW["new.ts\n(locale 取得済み)"]
        STA["status.ts [D-1: MOD]\n+ locale フィールド"]
        CON["continue.ts [D-2: MOD]\n+ ContinueOutput.locale"]
        DI["delta-init.ts\n(locale 取得済み)"]
    end

    subgraph "Skill Templates"
        DELTA["mspec-delta/SKILL.md\n[D-4: MOD]\nEARS ja/en 分岐"]
    end

    subgraph "LLM (Claude)"
        LLM["Spec 生成\n(Requirements EARS 形式)"]
    end

    CFG --> CL
    CL --> LC
    CL --> NEW
    CL --> STA
    CL --> CON
    CL --> DI

    STA -->|"locale フィールド"| DELTA
    DELTA -->|"locale=ja → 日本語パターン"| LLM
    DELTA -->|"locale=en → 英語パターン"| LLM

    DI -->|"resolveTemplate(delta-spec, locale)"| TR
    NEW -->|"resolveTemplate(readme, locale)"| TR
    TR --> TJ
    TR --> TE
    TR -.->|"fallback (削除後は不使用)"| TL
```

## Sequence Diagram: `mspec new` with locale=ja (After Fix)

```mermaid
sequenceDiagram
    actor User
    participant CLI as new.ts
    participant CL as config-loader
    participant TR as template-resolver
    participant FS as FileSystem

    User->>CLI: mspec new my-feature
    CLI->>CL: loadConfig(configFile)
    CL-->>CLI: { resolvedLocale: { locale: 'ja' } }
    CLI->>TR: resolveTemplate('readme', 'ja', templatesDir)
    TR->>FS: try readme.ja.md
    FS-->>TR: content (✓ found)
    TR-->>CLI: { content, usedLocale: 'ja', fellBack: false }
    CLI->>FS: write changes/.../readme.md
    Note over CLI,FS: "missing template" 警告なし
```

## Sequence Diagram: `mspec:delta` skill with locale=ja (After Fix)

```mermaid
sequenceDiagram
    actor LLM as LLM (Claude)
    participant STAT as mspec status --json
    participant DI as delta-init (CLI)
    participant TR as template-resolver
    participant FS as FileSystem

    LLM->>STAT: mspec status --change <dir> --json
    STAT-->>LLM: { ..., "locale": "ja" }
    Note over LLM: locale='ja' を認識
    LLM->>DI: mspec delta init --capability X
    DI->>TR: resolveTemplate('delta-spec', 'ja', ...)
    TR->>FS: try delta-spec.ja.md (✓ already exists)
    TR-->>DI: { content: "このシステムは SHALL..." }
    DI->>FS: write changes/.../specs/X/spec.md
    Note over LLM,FS: SKILL.md の locale=ja 例示に従い<br/>「このシステムは SHALL <振る舞い>.」形式で記述
```

## Data Model: `ContinueOutput` (Before / After)

```mermaid
classDiagram
    class ContinueOutput_Before {
        change: string
        current_step: string|null
        next_action: string
        skill: string|null
        main_prompt: string|null
        subagent_prompt: string|null
        subagent_name: string|null
        upstream_skipped: string[]
        required_artifacts: Array
        produces: string[]
        block_after: boolean
        blockers: string[]
        constitution_principles: Array
    }
    class ContinueOutput_After {
        change: string
        locale: string ← NEW
        current_step: string|null
        next_action: string
        skill: string|null
        main_prompt: string|null
        subagent_prompt: string|null
        subagent_name: string|null
        upstream_skipped: string[]
        required_artifacts: Array
        produces: string[]
        block_after: boolean
        blockers: string[]
        constitution_principles: Array
    }
```

## Template Resolution Before / After

| Artifact | Before (locale=ja) | After (locale=ja) |
|----------|-------------------|-------------------|
| `delta-spec` | `delta-spec.ja.md` ✅ (既存) | 変更なし |
| `readme` | `readme.md` (legacy, 警告あり) | `readme.ja.md` ✅ (新規) |
| `glossary` | `glossary.md` (legacy, 警告あり) | `glossary.ja.md` ✅ (新規) |
| `proposal` | `proposal.md` (legacy, 警告あり) | `proposal.ja.md` ✅ (新規) |
| `research` | `research.md` (legacy, 警告あり) | `research.ja.md` ✅ (新規) |
| `design` | `design.md` (legacy, 警告あり) | `design.ja.md` ✅ (新規) |
| `architecture-overview` | `architecture-overview.md` (legacy) | `architecture-overview.ja.md` ✅ (新規) |
| `quickstart` | `quickstart.md` (legacy, 警告あり) | `quickstart.ja.md` ✅ (新規) |
| `checklist` | `checklist.md` (legacy, 警告あり) | `checklist.ja.md` ✅ (新規) |
| `tasks` | `tasks.md` (legacy, 警告あり) | `tasks.ja.md` ✅ (新規) |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | テンプレート追加・CLI 変更・SKILL.md 変更は独立して適用可能 ✓ | 各変更が単独でロールバック可能な設計 ✓ |
| II. 決定論的マージ | テンプレートファイルの追加は冪等。`locale` フィールド追加は既存 JSON 消費者に影響なし ✓ | フォールバックチェーン `<locale>.md` → `en.md` は決定論的 ✓ |
| III. 質問駆動の要件確定 | 全 Open Choices はユーザー確認済み ✓ | — |
| IV. 双方向アンカー | 実装ファイルに `@mspec-delta` アンカー付与予定 ✓ | — |
| V. 強制ステップと拡張ステップの分離 | CLI コア変更と設定ファイル変更を分離 ✓ | — |
