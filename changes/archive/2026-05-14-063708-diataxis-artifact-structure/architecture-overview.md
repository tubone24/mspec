---
doc_type: Reference
---

# Architecture Overview: Diátaxis Artifact Structure

## System Diagram

変更が影響するコンポーネントと成果物の関係を示す。

```mermaid
graph LR
  subgraph CLI ["packages/cli/src/commands/"]
    NEW["new.ts"]
    DELTA["delta-init.ts"]
  end

  subgraph TMPL ["packages/cli/templates/artifacts/"]
    GLOSSARY_T["glossary.md 🆕"]
    PROPOSAL_T["proposal.md\n(+doc_type: Explanation)"]
    RESEARCH_T["research.md\n(+doc_type: Reference)"]
    DESIGN_T["design.md\n(+doc_type: Reference)"]
    DELTA_T["delta-spec.md\n(SHALL stub)"]
    OTHER_T["quickstart/tasks/checklist\n(+doc_type)"]
  end

  subgraph SKILLS [".claude/skills/"]
    SKILL_DELTA["mspec-delta/SKILL.md\n(EARS+Scenario 🔄)"]
    SKILL_PROP["mspec-proposal/SKILL.md\n(注記追加 🔄)"]
    SKILL_DESIGN["mspec-design/SKILL.md\n(Scenario対応 🔄)"]
  end

  subgraph CONST ["memory/"]
    CONSTITUTION["constitution.md\n(SHALL/MUST/SHOULD 🔄)"]
  end

  subgraph OUTPUT ["changes/<name>/"]
    README_OUT["readme.md\n(glossary追記)"]
    GLOSSARY_OUT["glossary.md 🆕"]
    DELTA_OUT["specs/<cap>/spec.md\n(SHALLスタブ)"]
  end

  NEW -->|"生成"| README_OUT
  NEW -->|"生成 🆕"| GLOSSARY_OUT
  DELTA -->|"スタブ生成"| DELTA_OUT
  GLOSSARY_T -.->|"参照"| GLOSSARY_OUT
  DELTA_T -.->|"参照"| DELTA_OUT
  SKILL_DELTA -->|"LLMが参照"| DELTA_OUT
```

## Sequence

`mspec new` の変更後の実行フロー（glossary.md 自動生成追加）。

```mermaid
sequenceDiagram
  actor User
  participant CLI as mspec CLI (new.ts)
  participant FS as ファイルシステム

  User->>CLI: mspec new <feature>
  CLI->>FS: mkdir changes/<name>/
  CLI->>FS: write readme.md (doc_type: Reference + glossary追記)
  CLI->>FS: write glossary.md (doc_type: Reference + ## Terms) 🆕
  CLI-->>User: ✓ Created <change-name>
  Note over User,FS: 次回 /mspec-proposal から用語をglossary.mdに記入できる
```

`mspec delta init` の変更後の実行フロー（SHALL スタブ）。

```mermaid
sequenceDiagram
  actor LLM as LLM (mspec-delta skill)
  participant CLI as mspec CLI (delta-init.ts)
  participant FS as ファイルシステム

  LLM->>CLI: mspec delta init --capability <name>
  CLI->>FS: read specs/<name>/spec.md (既存 FR-ID スキャン)
  CLI->>FS: write changes/.../specs/<name>/spec.md
  Note over FS: ADDED stub: "The system SHALL <behavior>." 🔄
  CLI-->>LLM: ✓ <deltaPath>
  LLM->>FS: edit spec.md (プレースホルダー → EARS形式)
```

## Data Model

成果物（Artifact）と Diátaxis ドキュメントタイプの対応関係。

```mermaid
erDiagram
  ARTIFACT {
    string filename
    string doc_type
  }
  DIATAXIS_TYPE {
    string name
    string purpose
  }

  ARTIFACT }o--|| DIATAXIS_TYPE : "classified as"

  ARTIFACT ||--o{ GLOSSARY_TERM : "references"
  GLOSSARY_TERM {
    string term
    string definition
  }
```

## Constitution Check

> Step: design | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|---|---|---|---|
| I. ステップ独立性 | ✅ | ✅ | アーキテクチャ変更はテンプレート・スクリプト・SKILL.md の修正のみ。ステップ間依存関係に影響なし |
| II. 決定論的マージ | ✅ | ✅ | YAML フロントマターは archive パーサーに透過的。Mermaid ブロックも archive 対象外 |
| III. 質問駆動の要件確定 | ✅ | ✅ | research の Open Choices・design の trade-off をすべてユーザー回答済み |
| IV. 双方向アンカー | ✅ | ✅ | delta-init.ts・new.ts に @mspec-delta アンカーを実装ステップで追加する |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | workflow.yaml の強制ステップ定義（removable フラグ）に触れない |
