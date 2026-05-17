---
doc_type: Reference
---

# Architecture Overview: 成果物の言語統制と EARS 多言語化

## System Diagram

```mermaid
graph LR
  User[User / Claude Code]
  Config[".mspec/config.yaml<br/>(locale: ja)"]
  CLI[mspec CLI commands<br/>new / questions / init / delta-init]
  Resolver[lib/locale-resolver.ts<br/>resolveLocale, scanSupportedLocales]
  TplRes[lib/template-resolver.ts<br/>resolveTemplate + fallback]
  QBank[lib/questions-bank.ts<br/>loadMergedBank + localizeQuestion]
  TplFiles["templates/artifacts/<br/>*.ja.md / *.en.md"]
  QFiles["templates/questions/<br/>*.yaml (per-locale keys)"]
  UserTpl[".mspec/templates/<br/>(user overrides)"]
  Out[Generated artifacts<br/>readme.md, proposal.md, ...]
  Stderr[stderr warnings<br/>missing translation]

  User --> CLI
  CLI --> Config
  Config --> Resolver
  CLI --> Resolver
  Resolver --> TplRes
  Resolver --> QBank
  TplRes --> TplFiles
  TplRes --> UserTpl
  QBank --> QFiles
  TplRes --> Out
  QBank --> Out
  TplRes -.fallback.-> Stderr
  QBank -.fallback.-> Stderr
```

## Sequence (`mspec new` 実行時のロケール解決)

```mermaid
sequenceDiagram
  participant U as User
  participant CLI as mspec new
  participant Loader as config-loader
  participant LR as locale-resolver
  participant TR as template-resolver
  participant FS as filesystem (templates)
  participant Stderr as stderr

  U->>CLI: mspec new sample
  CLI->>Loader: loadConfig()
  Loader->>FS: read .mspec/config.yaml
  FS-->>Loader: { locale: ja, ... }
  Loader->>LR: resolveLocale(config)
  LR->>FS: scanSupportedLocales(templatesDir)
  FS-->>LR: ["ja", "en"]
  LR-->>Loader: "ja"
  Loader-->>CLI: { locale: "ja", supported: Set("ja","en") }

  CLI->>TR: resolveTemplate("readme", "ja")
  TR->>FS: read templates/artifacts/readme.ja.md
  alt ja resource exists
    FS-->>TR: content (ja)
    TR-->>CLI: { content, usedLocale: "ja", fellBack: false }
  else ja missing
    TR->>FS: read templates/artifacts/readme.en.md
    FS-->>TR: content (en)
    TR->>Stderr: missing template: readme for locale 'ja', falling back to 'en'
    TR-->>CLI: { content, usedLocale: "en", fellBack: true }
  end

  CLI->>FS: write changes/<dir>/readme.md (content)
  CLI-->>U: ✓ Created changes/<timestamp>-sample
```

## Data Model (Locale 解決の状態とリソース構造)

```mermaid
erDiagram
  CONFIG ||--o| LOCALE_FIELD : "may declare"
  CONFIG {
    string locale "ja | en | xx (ISO 639-1)"
    object project "existing fields preserved"
  }
  LOCALE_FIELD {
    string code "ISO 639-1 two-letter"
  }
  LOCALE_FIELD ||--o{ ARTIFACT_TEMPLATE : "resolves to"
  ARTIFACT_TEMPLATE {
    string name "proposal | delta-spec | research | design | ..."
    string locale "ja | en"
    string path "templates/artifacts/<name>.<locale>.md"
    string doc_type "frontmatter, locale-invariant"
  }
  LOCALE_FIELD ||--o{ QUESTION_BANK_ENTRY : "resolves to"
  QUESTION_BANK_ENTRY {
    string id "PRP-FS-001 etc (locale-invariant)"
    string category "locale-invariant"
    object question "{ ja: string, en: string } or scalar (legacy)"
    object options "{ ja: array, en: array } or scalar (legacy)"
    bool multi_select "locale-invariant"
  }
  ARTIFACT_TEMPLATE ||--o{ DELTA_SPEC : "fills"
  DELTA_SPEC {
    string requirement_anchor "Requirement: FR-NNN (English keyword)"
    string scenario_anchor "Scenario: <name> (English H4 keyword)"
    string body "natural-language body (active locale)"
    string ears_keyword "SHALL | MUST | WHEN | ... (English-only)"
  }
```

## Fallback Decision Tree

```mermaid
graph TD
  Start[resolveTemplate name, locale] --> CheckLocal{path: name.locale.md<br/>exists?}
  CheckLocal -- yes --> RetLocal[return content, usedLocale=locale]
  CheckLocal -- no --> CheckEn{path: name.en.md<br/>exists?}
  CheckEn -- yes --> WarnFallback[emit stderr warning<br/>missing for locale, using en]
  WarnFallback --> RetEn[return content, fellBack=true]
  CheckEn -- no --> CheckLegacy{path: name.md<br/>exists? legacy}
  CheckLegacy -- yes --> WarnLegacy[emit stderr warning<br/>using legacy template]
  WarnLegacy --> RetLegacy[return content, fellBack=true]
  CheckLegacy -- no --> Err[throw TemplateNotFoundError]
```

## Constitution Check

> Step: design (architecture-overview) | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 図中の locale-resolver / template-resolver は単一責務モジュールとして分離され、CLI コマンド層に副作用を持ち込まない構造を示す |
| II. 決定論的マージ | ✅ | ✅ | Fallback Decision Tree が `<name>.<locale>.md` → `<name>.en.md` → `<name>.md` の決定論的順序を明示。archive merge ルールには非干渉 |
| III. 質問駆動の要件確定 | ✅ | ✅ | 構成要素はすべて proposal / research / design ステップでユーザー確定済の意思決定に基づく |
| IV. 双方向アンカー | ✅ | ✅ | Data Model の `DELTA_SPEC` エンティティが `Requirement` / `Scenario` の英語アンカーを保持する構造を明示し、tasks.md でのアンカー付与の前提を整える |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | 図に現れる全モジュールは強制ステップ群の内部実装で、workflow 構造（step ID 群）には新規追加なし |

### Complexity Tracking

None

