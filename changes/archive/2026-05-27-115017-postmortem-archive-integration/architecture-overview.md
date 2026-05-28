---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004 -->
<!-- Change: postmortem-archive-integration -->

<!-- @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/memory-constitution/spec.md -->
<!-- Requirements implemented: FR-001, FR-002 -->
<!-- Change: postmortem-archive-integration -->

<!-- @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-lessons-analyzer/spec.md -->
<!-- Requirements implemented: FR-001, FR-002 -->
<!-- Change: postmortem-archive-integration -->

<!-- @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-nextaction-planner/spec.md -->
<!-- Requirements implemented: FR-001, FR-002 -->
<!-- Change: postmortem-archive-integration -->

# Architecture Overview: postmortem-archive-integration

## System Component Diagram

```mermaid
graph TD
    AS["mspec-archive スキル<br/>(SKILL.md)"]
    LA["mspec-lessons-analyzer<br/>(サブエージェント)"]
    NP["mspec-nextaction-planner<br/>(サブエージェント)"]
    README["changes/archive/&lt;change&gt;/readme.md<br/>(読み取り)"]
    CONST["memory/constitution.md<br/>(追記)"]
    CHANGES["changes/&lt;new-change&gt;/<br/>(mspec new 生成)"]
    USER["ユーザー<br/>(AskUserQuestion)"]

    AS -->|"Lessons 分析依頼"| LA
    AS -->|"Next Steps 評価依頼"| NP
    LA -->|"### Lessons 読み取り"| README
    NP -->|"### Next Steps 読み取り"| README
    LA -->|"{ text, target_section, source_lesson }[]"| AS
    NP -->|"{ priority, kebab_name, summary }[]"| AS
    AS -->|"全提案を multi-select 表示"| USER
    USER -->|"承認済みエントリ"| AS
    AS -->|"原則/制約を追記"| CONST
    AS -->|"mspec new &lt;kebab&gt;"| CHANGES
```

## Sequence Diagram: postmortem フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant A as mspec-archive スキル
    participant LA as mspec-lessons-analyzer
    participant NP as mspec-nextaction-planner
    participant C as constitution.md
    participant CH as changes/

    Note over A: mspec archive -y 完了（ステップ 3 完了）
    Note over A: ステップ 3b: readme.md Summary 生成

    rect rgb(240, 248, 255)
        Note over A,C: [新規] ステップ 3c: postmortem フック
        A->>A: ### Lessons セクション確認
        alt Lessons が空
            A-->>U: "Lessons なし: スキップ"
        else Lessons あり
            A->>+LA: Agent 起動（readme.md パス渡し）
            LA->>LA: constitution.md と照合・重複排除
            LA-->>-A: LessonsProposal[] 返却
            A->>U: AskUserQuestion (multi-select)<br/>"constitution.md に追加する原則を選択"
            U-->>A: 承認済みエントリ
            loop 承認済みエントリごと
                A->>C: target_section に追記
            end
        end

        A->>A: ### Next Steps セクション確認
        alt Next Steps が空
            A-->>U: "Next Steps なし: スキップ"
        else Next Steps あり
            A->>+NP: Agent 起動（readme.md パス渡し）
            NP->>NP: 優先度評価・kebab-case 生成
            NP-->>-A: NextActionProposal[] 返却
            A->>U: AskUserQuestion (multi-select)<br/>"新規チェンジとして登録する Next Steps を選択"
            U-->>A: 承認済みエントリ
            loop 承認済みエントリごと
                A->>CH: mspec new <kebab_name>
            end
        end
    end

    Note over A: ステップ 4: 完了レポート
```

## Data Model

```mermaid
classDiagram
    class LessonsProposal {
        +String text
        +TargetSection target_section
        +String source_lesson
    }
    class TargetSection {
        <<enumeration>>
        Core_Principles
        Additional_Constraints
    }
    class NextActionProposal {
        +Priority priority
        +String kebab_name
        +String summary
        +String source_next_step
    }
    class Priority {
        <<enumeration>>
        high
        medium
        low
    }
    LessonsProposal --> TargetSection
    NextActionProposal --> Priority
```

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | OK — 各サブエージェントが独立したコンテキストで動作 | OK — シーケンス図の通り、各エージェントは readme.md パスのみを受け取り前段文脈に依存しない |
| II. 決定論的マージ | OK — 追記はテキスト追加のみ | OK — target_section の固定 enum によりどのセクションに追記するかが決定論的 |
| III. 質問駆動の要件確定 | OK — 全提案を AskUserQuestion で確認 | OK — multi-select で全件一覧表示してから選択するフロー設計 |
| IV. 双方向アンカー | OK — SKILL.md にアンカーを付与 | OK — architecture-overview.md 自体も @mspec-delta アンカーの対象（tasks.md で対応） |
| V. 強制ステップと拡張ステップの分離 | OK — workflow.yaml 変更なし | OK — シーケンス図でステップ 3c が archive の内部動作として明示されている |
| VI. Security by Default | OK — インジェクション対策・最小権限・承認ゲート | OK — データモデルで kebab_name が正規化済みであることを型で表現 |

### Complexity Tracking

None
