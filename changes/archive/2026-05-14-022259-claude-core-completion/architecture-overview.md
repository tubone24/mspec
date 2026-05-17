# Architecture Overview: Claude 向け mspec v0 機能ギャップ充足

## System Diagram

`packages/cli` 内のモジュール依存と本チェンジで触る箇所 (太線) を俯瞰する。

```mermaid
graph LR
  subgraph CLI["packages/cli/src/commands"]
    Validate["validate.ts"]
    Continue["continue.ts"]
    Archive["archive.ts"]
    AnchorCmd["anchor.ts"]
    SpecLintCmd["spec-lint.ts"]
  end

  subgraph Lib["packages/cli/src/lib"]
    AnchorScanner["anchor-scanner.ts"]
    ArtifactValidator["artifact-validator.ts"]
    SpecLinter["spec-linter.ts"]
    ArchiveMerger["archive-merger.ts"]
    TextMask["text-mask.ts (NEW)"]
    ArchiveSummary["archive-summary.ts (NEW)"]
    ConstPrinciples["constitution-principles.ts (NEW)"]
  end

  subgraph Parser["packages/cli/src/parser"]
    AnchorParser["anchor.ts"]
  end

  subgraph Memory["memory/"]
    Constitution["constitution.md"]
  end

  Validate --> ArtifactValidator
  Validate --> SpecLinter
  Continue --> ConstPrinciples
  Archive --> ArchiveMerger
  Archive --> ArchiveSummary
  AnchorCmd --> AnchorScanner
  AnchorScanner --> AnchorParser
  SpecLintCmd --> SpecLinter

  AnchorParser -. uses .-> TextMask
  SpecLinter -. uses .-> TextMask
  ConstPrinciples --> Constitution
  ArchiveSummary --> ArchiveMerger

  classDef changed fill:#ffe4b5,stroke:#c97f0a,stroke-width:2px;
  class AnchorParser,AnchorScanner,ArtifactValidator,SpecLinter,Archive,Continue,TextMask,ArchiveSummary,ConstPrinciples changed;
```

## Sequence: `mspec continue` envelope 生成

`constitution_principles[]` と `upstream_skipped[]` を含む新エンベロープの組み立て手順。

```mermaid
sequenceDiagram
  participant User
  participant ContinueCmd as commands/continue.ts
  participant WorkflowYaml as workflow.yaml
  participant Skips as state.json
  participant ConstFile as memory/constitution.md
  participant Parser as lib/constitution-principles.ts

  User->>ContinueCmd: mspec continue --change X --json
  ContinueCmd->>WorkflowYaml: 現ステップと step.constitution_check を取得
  ContinueCmd->>Skips: skip 記録 → upstream_skipped[] を算出
  alt step.constitution_check === true
    ContinueCmd->>ConstFile: readFile
    ContinueCmd->>Parser: parsePrinciples(content)
    Parser-->>ContinueCmd: [{id, name}, ...]
    ContinueCmd->>ContinueCmd: evaluate_in_phase = step.id==='design' ? ['0','1'] : ['0']
  else
    ContinueCmd->>ContinueCmd: constitution_principles = []
  end
  ContinueCmd-->>User: JSON envelope (upstream_skipped, constitution_principles, ...)
```

## Sequence: `mspec anchor check` の false-positive 抑制パス

FR-015 (フェンス/HTML コメント除外) と FR-016 (spec ファイルスキップ) と FR-017 (ブロック形状ガード) の三段防御。

```mermaid
sequenceDiagram
  participant User
  participant AnchorCmd as commands/anchor.ts
  participant Scanner as lib/anchor-scanner.ts
  participant Parser as parser/anchor.ts
  participant Mask as lib/text-mask.ts

  User->>AnchorCmd: mspec anchor check
  AnchorCmd->>Scanner: walk(root)
  Note over Scanner: FR-016: specs/**/spec.md と<br/>changes/*/specs/**/spec.md と<br/>templates/** と tests/** をスキップ
  Scanner->>Parser: 各ファイルの本文渡し
  Parser->>Mask: blankOutFences + blankOutHtmlComments
  Note over Mask: FR-015: フェンス/HTML コメント内の<br/>@mspec-delta を空白化
  Mask-->>Parser: マスク済み行配列
  Parser->>Parser: 行ループで @mspec-delta 検出
  Note over Parser: FR-017: 直前/直後に<br/>Requirements implemented: が無ければ沈黙
  Parser-->>AnchorCmd: anchors + warnings
  AnchorCmd-->>User: ✓ 0 warnings (期待)
```

## Data Model: `ContinueOutput` 型拡張

`mspec continue --json` が返すエンベロープの構造化定義 (本チェンジで追加するフィールドを太字)。

```mermaid
classDiagram
  class ContinueOutput {
    +string change
    +string current_step
    +"execute"|"wait_user"|"validate_failed"|"complete" next_action
    +string? skill
    +string? main_prompt
    +string? subagent_prompt
    +string? subagent_name
    +string[] upstream_skipped
    +ConstitutionPrinciple[] constitution_principles
    +ArtifactRef[] required_artifacts
    +string[] produces
    +boolean block_after
    +Blocker[] blockers
  }
  class ConstitutionPrinciple {
    +string id
    +string name
    +string[] evaluate_in_phase
  }
  class ArtifactRef {
    +string path
    +boolean exists
  }
  ContinueOutput o-- ConstitutionPrinciple
  ContinueOutput o-- ArtifactRef
```

## Data Model: archive サマリの整形

`MergeSummary` から 1 行サマリへの変換。

```mermaid
classDiagram
  class CapabilityMerges {
    +string capability
    +MergeSummary summary
  }
  class MergeSummary {
    +int added
    +int modified
    +int removed
    +int renamed
  }
  class SummaryLine {
    <<formatted string>>
    "<capability>: +<a> ~<m> -<r> ⇄<n>"
  }
  CapabilityMerges o-- MergeSummary
  CapabilityMerges --> SummaryLine : formatSummary()
```

## UI Mockup

本チェンジは CLI のみで GUI 変更は無いため省略。CLI 出力例は `quickstart.md` で具体化する。

## Constitution Check

> Step: design | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 (P1) | ✅ | ✅ | `continue` envelope は後方互換、validate/archive のワークフロー位置は不変。 |
| II. 決定論的マージ (P2) | ✅ | ✅ | `archive-summary.ts` は純関数、lexicographic ソート + 既存 `MergeSummary` 値の直接フォーマット。 |
| III. 質問駆動 (P3) | ✅ | ✅ | research の Decisions と design の Decisions に意思決定の根拠を全て残し追跡可能。 |
| IV. 双方向アンカー (P4) | ✅ | ✅ | tasks.md で各 FR に anchor block を必須化し、実装ファイルから SoT spec へ双方向リンク。 |
| V. 強制/拡張ステップ分離 (P5) | ✅ | ✅ | workflow.yaml と skill 定義は変更なし。Mermaid 必須化は produced artifact 側のチェックで完結。 |

### Complexity Tracking

None — 違反 0 件。
