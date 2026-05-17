# Architecture Overview: checklist AI-driven verification

## System Diagram

```mermaid
graph TD
    subgraph "Checklist Step (before tasks.md exists)"
        AUD["mspec-checklist-auditor\n(Agent)"]
        DSPEC["specs/.../spec.md\n(Delta Spec)"]
        DSGN["design.md"]
        CL["checklist.md\n(annotated output)"]
    end

    subgraph "Implement Step"
        IMPL["mspec-implement\n(Skill)"]
        TASKS["tasks.md\n(Requirements implemented: FR-NNN)"]
    end

    subgraph "Annotation Types"
        ANN_FR["&lt;!-- verify: fr-NNN --&gt;\n(auto-checkable)"]
        ANN_H["&lt;!-- verify: human --&gt;\n(human review)"]
    end

    subgraph "End State"
        RPT_H["人間レビュー要求\n+ block"]
        RPT_GAP["Gap 警告\n+ block"]
        RPT_OK["実装完了宣言"]
    end

    DSPEC -->|"E2E Scenario → fr-NNN\nその他 → human"| AUD
    DSGN --> AUD
    AUD -->|"E2E Scenario"| ANN_FR
    AUD -->|"非E2E"| ANN_H
    ANN_FR -->|"fr-NNN アノテーション"| CL
    ANN_H -->|"human アノテーション"| CL

    TASKS -->|"Requirements implemented: FR-NNN\n逆引き解決"| IMPL
    CL -->|"<!-- verify: fr-NNN --> 項目を - [x] に更新"| IMPL

    IMPL -->|"verify: human 未チェックあり"| RPT_H
    IMPL -->|"verify: fr-NNN 未チェックあり (gap)"| RPT_GAP
    IMPL -->|"全項目チェック済み"| RPT_OK
```

## Sequence Diagram: タスク GREEN → チェックリスト自動更新（FR-012）

```mermaid
sequenceDiagram
    actor User
    participant Impl as mspec-implement
    participant TestRunner as mspec test
    participant Tasks as tasks.md
    participant Checklist as checklist.md

    User->>Impl: /mspec-implement
    Impl->>Tasks: タスク一覧を読む

    loop 各タスク（依存順）
        Impl->>TestRunner: mspec test --expect-green task-NNN --change ...
        TestRunner-->>Impl: GREEN ✅

        Note over Impl,Tasks: FR-NNN 逆引き解決
        Impl->>Tasks: task アンカーを読む
        Tasks-->>Impl: Requirements implemented: FR-011, FR-012

        Note over Impl,Checklist: 対応項目を自動チェック
        Impl->>Checklist: <!-- verify: fr-011 --> の - [ ] を検索
        Checklist-->>Impl: 該当行あり
        Impl->>Checklist: - [ ] → - [x] に更新（冪等）
    end

    Note over Impl,Checklist: 全タスク完了後の報告（FR-013）
    Impl->>Checklist: 未チェック項目を走査

    alt verify: human の未チェックあり
        Impl-->>User: 人間レビュー要求リストを提示（block）
    else verify: fr-NNN の未チェックあり (gap)
        Impl-->>User: Gap 警告 + 対象 FR 一覧（block）
    else 全項目チェック済み
        Impl-->>User: 実装完了を宣言
    end
```

## Data Model: verify アノテーション解決フロー

```mermaid
classDiagram
    class ChecklistItem {
        +string text
        +bool checked
        +VerifyAnnotation annotation
    }

    class VerifyAnnotation {
        +string type: "fr-NNN" | "human"
        +string frId
    }

    class TaskAnchor {
        +string taskId
        +string[] requirementsImplemented
    }

    class ResolutionResult {
        +string frId
        +string[] matchedTaskIds
        +bool autoChecked
    }

    ChecklistItem --> VerifyAnnotation
    TaskAnchor --> ResolutionResult : frId マッチング
    VerifyAnnotation --> ResolutionResult : fr-NNN 照合
```

## Anchor Placement（FR-014）

4 ファイルすべての YAML frontmatter 直後に HTML コメント形式で付与する。

**mspec-checklist-auditor.md（runtime + template）:**
```markdown
---
name: mspec-checklist-auditor
...
---
<!-- @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-011, FR-014 -->
<!-- Change: checklist-ai-driven-verification -->
```

**mspec-implement/SKILL.md（runtime + template）:**
```markdown
---
name: mspec-implement
...
---
<!-- @mspec-delta 2026-05-14-105021-checklist-ai-driven-verification/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-012, FR-013, FR-014 -->
<!-- Change: checklist-ai-driven-verification -->
```

## Constitution Check

> Step: design (architecture-overview) | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | アーキテクチャ図は設計ドキュメント。実装ファイルへの副作用なし。 |
| II. 決定論的マージ | ✅ | ✅ | `architecture-overview.md` は archive の直接マージ対象ではない。 |
| III. 質問駆動の要件確定 | ✅ | ✅ | ユーザー入力不要の純粋な構造説明。 |
| IV. 双方向アンカー | ✅ | ✅ (条件付き) | アンカー配置先を明示（4 Markdown ファイル）。implement で実施。`mspec anchor check` の `.md` HTML コメント対応は tasks.md で確認タスクを追加（design.md 参照）。 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ワークフロー構造を変更しない。 |

### Complexity Tracking

None — 違反 0 件。
