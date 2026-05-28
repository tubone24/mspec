---
doc_type: Reference
---

# Architecture Overview: checklist-reduce-verify-human

## System Diagram

変更前後の verify アノテーション決定フローを示す。

```mermaid
flowchart TD
    Start([checklist 項目を生成]) --> Q1{risk_tier?}
    Q1 -->|trivial| Skip([生成しない])
    Q1 -->|critical| Human1[verify: human\n+ 確認手順子リスト]
    Q1 -->|standard / 未記載| Q2{E2E Scenario or\nCIテストが存在?}
    Q2 -->|YES| Auto1[verify: fr-NNN]
    Q2 -->|NO| Q3{CLI コマンドで\n検証可能?}
    Q3 -->|YES| Cmd[verify: cmd:command\n例: mspec anchor check]
    Q3 -->|NO| Human2[verify: human\n+ 理由括弧注記\n+ 確認手順子リスト]

    subgraph ConstitutionCheck [Constitution Check 事前実行]
        IV_Check["mspec anchor check 実行\n(Constitution IV)"]
        VI_Check["grep Security Capabilities 実行\n(Constitution VI)"]
        IV_Check --> IV_Result{ゼロエラー?}
        VI_Check --> VI_Result{セクション存在?}
        IV_Result -->|YES| IV_OK["- [x] verify: cmd:mspec anchor check"]
        IV_Result -->|NO| IV_NG["- [ ] verify: cmd:mspec anchor check\n+ エラー括弧注記"]
        VI_Result -->|YES| VI_OK["- [x] verify: cmd:grep ..."]
        VI_Result -->|NO| VI_NG["- [ ] verify: cmd:grep ..."]
    end
```

---

## Sequence Diagram: checklist-auditor の verify 判定

```mermaid
sequenceDiagram
    participant Skill as mspec-checklist スキル
    participant Auditor as mspec-checklist-auditor
    participant CLI as mspec CLI
    participant FS as ファイルシステム

    Skill->>Auditor: Delta Spec + design.md + SoT specs を渡して起動
    Auditor->>FS: Delta Spec の FR 一覧を読み込む
    loop 各 FR について
        Auditor->>Auditor: risk_tier を確認
        alt trivial
            Auditor->>Auditor: 項目スキップ
        else critical
            Auditor->>Auditor: verify:human + 確認手順子リスト
        else standard / 未記載
            Auditor->>FS: E2E Scenario 存在チェック
            alt Scenario あり
                Auditor->>Auditor: verify:fr-NNN
            else Scenario なし
                Auditor->>Auditor: verify:cmd 対象コマンドを判定
                alt CLI コマンドで確認可能
                    Auditor->>Auditor: verify:cmd:<command>
                else それ以外
                    Auditor->>Auditor: verify:human + 理由注記 + 確認手順子リスト
                end
            end
        end
    end
    Auditor->>CLI: mspec anchor check（Constitution IV）
    CLI-->>Auditor: エラー数
    Auditor->>Auditor: Constitution IV → verify:cmd:mspec anchor check（チェック済み確定）
    Auditor->>FS: grep Security Capabilities（Constitution VI）
    FS-->>Auditor: 検索結果
    Auditor->>Auditor: Constitution VI → verify:cmd:grep ...（チェック済み確定）
    Auditor->>FS: checklist.md を書き込む
    Auditor->>Auditor: 自己検証（verify: なし行がゼロか確認）
    Auditor->>Skill: checklist.md の内容を返す
```

---

## Data Model: verify アノテーション形式

```mermaid
classDiagram
    class ChecklistItem {
        +String text
        +Boolean checked
        +VerifyAnnotation annotation
        +List~String~ steps
    }
    class VerifyAnnotation {
        <<enumeration>>
        fr_NNN
        cmd_command
        human
    }
    ChecklistItem --> VerifyAnnotation
    note for ChecklistItem "steps は verify:human または verify:cmd 時に最低 2 項目必須"
```

---

## Web UI: amber ハイライト対象の拡張

```mermaid
flowchart LR
    Line["checklist.md の 1 行"] --> Detect{アノテーション検出}
    Detect -->|"verify: human"| Amber[amber ハイライト]
    Detect -->|"verify: cmd:..."| Amber
    Detect -->|"verify: fr-NNN"| Normal[通常表示]
    Detect -->|アノテーションなし| Normal
```

---

## Constitution Check

| # | 原則 | Phase 0 | Phase 1 |
|---|------|---------|---------|
| I | ステップ独立性 | pass | pass — architecture-overview.md は構造の可視化のみ、他ステップの成果物を変更しない |
| II | 決定論的マージ | pass | pass — 図は design.md の変更内容を視覚化したもので、実装詳細を規定しない |
| III | 質問駆動の要件確定 | pass | pass — research フェーズで全 Open Choices が決定済み |
| IV | 双方向アンカー | pass | pass — アンカーコメントは design.md に集約。architecture-overview.md はアンカーなし（生成物） |
| V | 強制ステップと拡張ステップの分離 | pass | pass — design ステップ内に収まっている |
| VI | Security by Default | pass | pass — 権限変更なし。図は既存の設計変更のみを描写 |

### Complexity Tracking

None

<!-- LEARNING: architecture-overview.md に verify 判定フローを Mermaid で可視化することで、tasks.md 作成時のタスク分割が容易になる | source: FR-008 | confidence: medium -->
