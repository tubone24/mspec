---
doc_type: Reference
---

# Architecture Overview: step-checkbox-update

## System Diagram

```mermaid
flowchart TD
    subgraph STEPS["Workflow Steps (readme.md 更新対象)"]
        P["mspec-proposal\nSKILL.md"]
        D["mspec-delta\nSKILL.md"]
        R["mspec-research\nSKILL.md"]
        DE["mspec-design\nSKILL.md"]
        Q["mspec-quickstart\nSKILL.md"]
        CL["mspec-checklist\nSKILL.md"]
        T["mspec-tasks\nSKILL.md"]
    end

    subgraph IMPL["mspec-implement"]
        IMP["mspec-implement\nSKILL.md"]
    end

    subgraph AUDIT["mspec-checklist-auditor"]
        AUD["mspec-checklist-auditor.md\n(subagent)"]
        SV["自己検証\n(全項目 verify: 確認)"]
        AUD --> SV
    end

    README["readme.md\n## Artifacts"]
    TASKS["tasks.md\n- [ ] TNNN"]
    CHECKLIST["checklist.md\n<!-- verify: ... -->"]
    VALIDATE["mspec validate"]

    P -->|"成果物書き込み後"| README
    D -->|"成果物書き込み後"| README
    R -->|"成果物書き込み後"| README
    DE -->|"両ファイル書き込み後"| README
    Q -->|"成果物書き込み後"| README
    CL -->|"成果物書き込み後"| README
    T -->|"成果物書き込み後"| README

    README -->|"- [x] に更新後"| VALIDATE
    VALIDATE -->|"失敗時: ロールバック"| README

    IMP -->|"--expect-green 後"| TASKS
    AUD -->|"checklist.md 生成"| CHECKLIST
    SV -->|"漏れがあれば verify: human を付与"| CHECKLIST
```

## Sequence Diagram: readme.md Artifacts 更新フロー（FR-015）

```mermaid
sequenceDiagram
    participant Skill as mspec-<step> Skill
    participant Readme as readme.md
    participant CLI as mspec CLI

    Skill->>Readme: 成果物ファイルを書き込む
    Skill->>Readme: - [ ] <artifact> → - [x] <artifact>
    Skill->>CLI: mspec validate --change <dir>
    alt validate 成功
        CLI-->>Skill: exit 0
        Note over Readme: - [x] のまま維持
    else validate 失敗
        CLI-->>Skill: exit 1
        Skill->>Readme: - [x] <artifact> → - [ ] <artifact> (ロールバック)
        Note over Skill: エラーを報告してブロック
    end
```

## Sequence Diagram: tasks.md タスクチェックボックス更新フロー（FR-016）

```mermaid
sequenceDiagram
    participant Impl as mspec-implement Skill
    participant CLI as mspec CLI
    participant Tasks as tasks.md

    loop 各タスク（依存順）
        Impl->>CLI: mspec test --expect-green TNNN
        alt テスト GREEN
            CLI-->>Impl: exit 0
            Impl->>Tasks: - [ ] TNNN → - [x] TNNN (冪等)
            Impl->>Tasks: checklist.md の verify: fr-NNN を - [x] に更新
        else テスト FAIL
            CLI-->>Impl: exit 1
            Note over Tasks: - [ ] TNNN のまま変更なし
        end
    end
```

## Sequence Diagram: checklist-auditor 自己検証フロー（FR-011 強化）

```mermaid
sequenceDiagram
    participant Aud as mspec-checklist-auditor
    participant CL as checklist.md

    Aud->>CL: 全チェックリスト項目を verify: アノテーション付きで書き込む
    Note over Aud: 自己検証ステップ
    Aud->>CL: verify: アノテーションなし行をスキャン
    alt アノテーションなし行あり
        Aud->>CL: 該当行に <!-- verify: human --> を付与
    end
    Aud-->>Aud: 全項目アノテーション確認完了 → 完了宣言
```

## File Change Map

```mermaid
graph LR
    subgraph RUNTIME["ランタイムファイル"]
        S1[".claude/skills/mspec-proposal/SKILL.md"]
        S2[".claude/skills/mspec-delta/SKILL.md"]
        S3[".claude/skills/mspec-research/SKILL.md"]
        S4[".claude/skills/mspec-design/SKILL.md"]
        S5[".claude/skills/mspec-quickstart/SKILL.md"]
        S6[".claude/skills/mspec-checklist/SKILL.md"]
        S7[".claude/skills/mspec-tasks/SKILL.md"]
        S8[".claude/skills/mspec-implement/SKILL.md"]
        S9[".claude/agents/mspec-checklist-auditor.md"]
    end

    subgraph TEMPLATES["CLI テンプレートファイル（同期必須）"]
        T1["packages/cli/templates/claude/skills/mspec-proposal/SKILL.md"]
        T2["packages/cli/templates/claude/skills/mspec-delta/SKILL.md"]
        T3["packages/cli/templates/claude/skills/mspec-research/SKILL.md"]
        T4["packages/cli/templates/claude/skills/mspec-design/SKILL.md"]
        T5["packages/cli/templates/claude/skills/mspec-quickstart/SKILL.md"]
        T6["packages/cli/templates/claude/skills/mspec-checklist/SKILL.md"]
        T7["packages/cli/templates/claude/skills/mspec-tasks/SKILL.md"]
        T8["packages/cli/templates/claude/skills/mspec-implement/SKILL.md"]
        T9["packages/cli/templates/claude/agents/mspec-checklist-auditor.md"]
    end

    FR15["FR-015\nArtifacts checkbox"]
    FR16["FR-016\ntasks.md checkbox"]
    FR11["FR-011 強化\nauditor self-validate"]

    S1 & S2 & S3 & S4 & S5 & S6 & S7 --- FR15
    S8 --- FR16
    S9 --- FR11
    S1 -.->|同期| T1
    S2 -.->|同期| T2
    S3 -.->|同期| T3
    S4 -.->|同期| T4
    S5 -.->|同期| T5
    S6 -.->|同期| T6
    S7 -.->|同期| T7
    S8 -.->|同期| T8
    S9 -.->|同期| T9
```

## Constitution Check

> Step: design | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 各スキルが自ステップの Artifacts 行のみを更新。他ステップの行への影響なし。Sequence Diagram で独立性を図示 |
| II. 決定論的マージ | ✅ | ✅ | `- [ ]` → `- [x]` の exact-string 置換のみ。CLI archive / merge ロジックへの変更なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | research ステップで 3 問（specs 行・validate 失敗時・design タイミング）を Q&A 解決済み |
| IV. 双方向アンカー | ✅ | ✅ | File Change Map に全 18 ファイルと対応 FR を明示。HTML コメント形式アンカーは前 change で `.md` 対応済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `workflow.yaml` 不変。既存ステップへの Procedure 追加のみ。新ステップ・新スキル追加なし |
