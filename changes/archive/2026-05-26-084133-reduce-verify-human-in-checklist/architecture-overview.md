---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: reduce-verify-human-in-checklist -->

# Architecture Overview: reduce-verify-human-in-checklist

## System Diagram

変更前後の verify アノテーション決定フローを示す。

### 変更後: verify ルーティングフロー（mspec-checklist-auditor 内）

```mermaid
flowchart TD
    A[checklist 項目を生成] --> B{risk_tier: critical?}
    B -- Yes --> VH1["<!-- verify: human -->\n（critical は常に human）"]
    B -- No --> C{Delta Spec に\nE2E Scenario あり?}
    C -- Yes --> VFR["<!-- verify: fr-NNN -->"]
    C -- No --> D{Constitution IV\n（双方向アンカー）?}
    D -- Yes --> E["mspec anchor check 実行"]
    E -- "ゼロエラー" --> IV_OK["- [x] <!-- verify: human -->"]
    E -- "エラーあり" --> IV_NG["- [ ] <!-- verify: human -->\n（エラー内容を括弧注記）"]
    D -- No --> F{Constitution VI\n（Security by Default）?}
    F -- Yes --> G["Delta Spec の\n## Security Capabilities\nセクションを grep"]
    G -- "存在する" --> VI_OK["- [x] <!-- verify: human -->"]
    G -- "不在" --> VI_NG["- [ ] <!-- verify: human -->"]
    F -- No --> VH2["<!-- verify: human -->\n＋理由を括弧書きで明記\n例:（設計判断の妥当性は機械検証不可）"]
```

### 変更前: verify ルーティングフロー（旧）

```mermaid
flowchart TD
    A2[checklist 項目を生成] --> B2{risk_tier: critical?}
    B2 -- Yes --> VH_OLD1["<!-- verify: human -->"]
    B2 -- No --> C2{Delta Spec に\nE2E Scenario あり?}
    C2 -- Yes --> VFR_OLD["<!-- verify: fr-NNN -->"]
    C2 -- No --> VH_OLD2["<!-- verify: human -->\n（Constitution も Regression も\nすべてここに流れ込む）"]
```

---

## Sequence Diagram: checklist.md 生成フロー

```mermaid
sequenceDiagram
    participant S as mspec-checklist SKILL
    participant A as mspec-checklist-auditor
    participant FS as ファイルシステム
    participant CLI as mspec CLI

    S->>A: Task(subagent_prompt)
    A->>FS: specs/*/spec.md を Read
    A->>FS: design.md を Read
    A->>FS: SoT specs を Read

    loop 各 checklist 項目
        A->>A: risk_tier 確認
        A->>A: E2E Scenario 対応確認
        alt Constitution IV
            A->>CLI: mspec anchor check
            CLI-->>A: 結果（0 errors / N errors）
            A->>A: チェックボックス状態確定
        else Constitution VI
            A->>FS: ## Security Capabilities grep
            FS-->>A: 存在 / 不在
            A->>A: チェックボックス状態確定
        else その他
            A->>A: verify: human + 理由括弧書き
        end
    end

    A->>A: 自己検証（アノテーションなし行スキャン）
    A-->>S: checklist.md 本文を返す
    S->>FS: checklist.md を書き込む
```

---

## Data Model: verify アノテーション分類

| 項目カテゴリ | 条件 | アノテーション | チェックボックス初期値 |
|------------|------|--------------|-------------------|
| critical FR | risk_tier: critical | `<!-- verify: human -->` | `- [ ]` |
| Delta Spec FR | E2E Scenario あり | `<!-- verify: fr-NNN -->` | `- [ ]` |
| Constitution IV | `mspec anchor check` ゼロエラー | `<!-- verify: human -->` | `- [x]` |
| Constitution IV | `mspec anchor check` エラーあり | `<!-- verify: human -->` | `- [ ]` + 注記 |
| Constitution VI | Security Capabilities 存在 | `<!-- verify: human -->` | `- [x]` |
| Constitution VI | Security Capabilities 不在 | `<!-- verify: human -->` | `- [ ]` |
| その他すべて | — | `<!-- verify: human -->` | `- [ ]` + 理由括弧書き |

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | auditor 変更は checklist ステップのみに閉じる | ✅ 他スキル・他ステップへの依存追加なし |
| II. 決定論的マージ | Mermaid 図・データモデルは設計を記述するのみ。マージロジック変更なし | ✅ architecture-overview.md は読み取り専用成果物 |
| III. 質問駆動の要件確定 | AskUserQuestion で全 Open Choices 確定済み | ✅ 未確定事項なし |
| IV. 双方向アンカー | `@mspec-delta` アンカー付与済み | ✅ `mspec anchor check` で確認予定 |
| V. 強制ステップと拡張ステップの分離 | 既存ステップ内の拡張のみ。新ステップ追加なし | ✅ workflow.yaml 変更なし |
| VI. Security by Default | ファイル変更はエージェント定義 2 件のみ | ✅ 外部ネットワーク依存・権限境界変更なし |
