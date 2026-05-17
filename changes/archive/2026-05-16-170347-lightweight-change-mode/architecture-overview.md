---
doc_type: Reference
---

# Architecture Overview: 目的別チェンジモード（typo / minor / bugfix）

## System Diagram

```mermaid
graph TD
    User["ユーザー"] -->|"/mspec:new &lt;説明文&gt;"| NewSkill["mspec-new SKILL"]
    NewSkill -->|"説明文を解析"| ModeInfer["AI モード推定\n(typo / minor / bugfix / none)"]
    ModeInfer -->|"AskUserQuestion 確認"| ModeConfirm{"確認OK?"}
    ModeConfirm -->|"訂正あり"| ModeInfer
    ModeConfirm -->|"承認"| ReadmeWrite["readme.md\n> Mode: &lt;mode&gt; を追記"]
    NewSkill -->|"--mode 明示指定"| ReadmeWrite

    ReadmeWrite --> ContCmd["mspec continue"]
    ContCmd -->|"parseMode(readme)"| StateEngine["state-engine.ts\ncomputeStatus()"]
    StateEngine -->|"isModeDrivenSkip(mode, stepId, modes)"| ModeRules["workflow.yaml\nmodes:\n  typo.skip: [proposal, quickstart]\n  minor.skip: [proposal, quickstart]\n  bugfix.skip: [proposal, quickstart]\n  bugfix.force: [research]"]
    ModeRules -->|"skip"| SkipState["StepState: skipped"]
    ModeRules -->|"proceed"| NormalFlow["通常ステップ評価"]

    User2["ユーザー"] -->|"mspec skip research"| SkipCmd["commands/skip.ts"]
    SkipCmd -->|"parseMode(readme)"| ForceCheck{"bugfix.force\nに含まれる?"}
    ForceCheck -->|"Yes → 拒否"| ForceError["Error: bugfix モードでは\nresearch は必須です"]
    ForceCheck -->|"No → 許可"| SkipLog["skip-log.json"]
```

## Sequence: /mspec:new でのモード推定フロー

```mermaid
sequenceDiagram
    actor User
    participant Skill as mspec-new SKILL
    participant ReadmeMd as readme.md

    User->>Skill: /mspec:new コメント内の typo を修正したい
    Skill->>Skill: 説明文からモードを AI 推定 → "typo"
    Skill->>User: AskUserQuestion: "typo モードと判断しました。正しいですか？"
    User->>Skill: 承認
    Skill->>ReadmeMd: > Mode: typo を追記
    Skill->>User: /mspec:continue を実行してください

    Note over User,ReadmeMd: --mode 明示指定の場合
    User->>Skill: /mspec:new --mode bugfix ログが欠落している問題
    Skill->>ReadmeMd: > Mode: bugfix を追記（確認スキップ）
```

## Sequence: mspec continue でのモード由来スキップフロー

```mermaid
sequenceDiagram
    participant ContCmd as continue.ts
    participant Parser as readme-parser.ts
    participant StateEngine as state-engine.ts
    participant Workflow as workflow.yaml

    ContCmd->>Parser: parseMode(readme.md の内容)
    Parser-->>ContCmd: "typo"
    ContCmd->>StateEngine: computeStatus({ mode: "typo", ... })
    loop 各ステップ
        StateEngine->>Workflow: modes.typo.skip に stepId が含まれるか確認
        alt スキップ対象（proposal, quickstart）
            StateEngine-->>StateEngine: StepState = "skipped"
        else 通常ステップ
            StateEngine-->>StateEngine: 既存の評価ロジックへ
        end
    end
    StateEngine-->>ContCmd: Status (proposal=skipped, quickstart=skipped, ...)
```

## Data Model: WorkflowSchema 拡張

```mermaid
erDiagram
    WorkflowSchema {
        int version
        string name
        string description
        Step[] steps
        ModeRules modes
    }
    ModeRules {
        ModeRule typo
        ModeRule minor
        ModeRule bugfix
    }
    ModeRule {
        string[] skip
        string[] force
    }
    WorkflowSchema ||--o{ ModeRules : "optional"
    ModeRules ||--|{ ModeRule : "per mode"
```

## Constitution Check

> Step: design (architecture-overview) | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 図中の `parseMode()` は毎回 readme.md を読む単方向データフロー。前段セッションのコンテキスト不依存で、各ステップが mode 文字列のみを参照する構造を示す |
| II. 決定論的マージ | ✅ | ✅ | `modes:` セクションはスキップルールのみ。System Diagram が示す通り archive merge ルール（CLI パーサー）には非干渉 |
| III. 質問駆動の要件確定 | ✅ | ✅ | Sequence の mspec-new SKILL → `AskUserQuestion` フローが明示。決定根拠は readme.md に永続化されユーザー確認済み |
| IV. 双方向アンカー | ✅ | ✅ | `readme-parser.ts`・`state-engine.ts`・`skip.ts`・`continue.ts` の各実装ファイルに `@mspec-delta` アンカーを付与する設計 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | System Diagram が示す通り `evaluateStep()` 内の lazy skip は skip-log を経由しない。`REQUIRED_STEP_IDS` と `removable: false` は変更しない |
