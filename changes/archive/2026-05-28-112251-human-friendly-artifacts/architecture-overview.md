---
doc_type: Reference
---

# Architecture Overview: human-friendly-artifacts

## System Diagram

mspec の成果物生成に関わるコンポーネントと今回の変更対象を示す。

```mermaid
graph TD
    subgraph CLI["mspec CLI (packages/cli/)"]
        Templates["templates/artifacts/\n*.ja.md / *.en.md\n【変更対象】"]
        Auditor["templates/claude/agents/\nmspec-checklist-auditor.md\n【変更対象】"]
        ChecklistSkill["templates/claude/skills/\nmspec-checklist/SKILL.md\n（変更なし）"]
    end

    subgraph ChangeDir["changes/<id>/"]
        ReadmeMd["readme.md"]
        ChecklistMd["checklist.md\n（auditor が生成）"]
        DesignMd["design.md\n（テンプレートから生成）"]
        ProposalMd["proposal.md\n（テンプレートから生成）"]
    end

    Templates -->|mspec new / mspec design / mspec proposal| DesignMd
    Templates -->|mspec new / mspec proposal| ProposalMd
    ChecklistSkill -->|Task tool で起動| Auditor
    Auditor -->|生成結果を書き込み| ChecklistMd
```

### 変更の影響範囲

```mermaid
graph LR
    FR006["FR-006\n自然語・会話的文体"] --> Tpl_proposal["proposal.ja/en.md\n各 H2 直下に説明文追加"]
    FR006 --> Tpl_design["design.ja/en.md\nリード文プレースホルダ追加"]
    FR006 --> Tpl_checklist["checklist.ja/en.md\n各セクション冒頭に説明文追加"]
    FR007["FR-007\nカテゴリ別グループ構造"] --> Tpl_checklist
    FR007 --> AuditorDef["mspec-checklist-auditor.md\nセクション名ハードコード更新"]
    FR008["FR-008\ndesign.md リード文"] --> Tpl_design
```

## Sequence Diagram: checklist 生成フロー（変更後）

```mermaid
sequenceDiagram
    actor User
    participant CLI as mspec CLI
    participant Skill as mspec-checklist SKILL
    participant Auditor as mspec-checklist-auditor

    User->>CLI: mspec checklist
    CLI->>Skill: スキル起動
    Skill->>Auditor: Task tool 経由で起動<br/>（変更後の新しいセクション名定義を含む）
    Auditor->>Auditor: Delta Spec を分析し<br/>「機能確認」「リグレッションリスク」「デプロイ前確認」<br/>の 3 カテゴリでチェック項目を生成
    Auditor-->>Skill: checklist.md 本文（カテゴリ別・説明文付き）
    Skill->>CLI: changes/<id>/checklist.md に書き込み
    CLI-->>User: ✓ checklist 生成完了
```

## Data Model: テンプレート変更のスキーマ

変更前後のテンプレート構造を示す（ja 版を例示）。

### checklist.ja.md（変更前 → 変更後）

```
変更前:
  ## Delta Spec Coverage       ← 英語技術用語
  （説明文なし）
  ## Source-of-Truth Regression ← 英語技術用語
  （説明文なし）
  ## Constitution              ← 英語
  （説明文なし）

変更後:
  ## 機能確認                   ← 日本語・直感的
  このセクションでは実装した機能が要件を満たすか確認します。
  ## リグレッションリスク         ← 日本語・直感的
  このセクションでは既存機能への影響がないか確認します。
  ## デプロイ前確認              ← 日本語・直感的
  このセクションではリリースに向けた最終確認をします。
```

### design.ja.md（変更前 → 変更後）

```
変更前:
  ## Summary
  <設計の概要>

変更後:
  ## Summary
  このドキュメントは <変更名> の技術設計を記述します。
  読者は <対象読者> を想定しています。
  <設計の概要>
```

## Constitution Check (Phase 0 / Phase 1)

| Principle | Phase 0 | Phase 1 | 備考 |
|-----------|---------|---------|------|
| I. ステップ独立性 | ✅ | ✅ | テンプレート変更はステップ間の独立性に影響しない |
| II. 決定論的マージ | ✅ | ✅ | Delta Spec FR が明確で機械的マージ可能 |
| III. 質問駆動の要件確定 | ✅ | ✅ | OC-1〜OC-4 ユーザー確認済み |
| IV. 双方向アンカー | ✅ | ✅ | FR-006〜FR-008 との対応が明確 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | workflow.yaml への変更なし |
| VI. Security by Default | ✅ | ✅ | ローカルファイル変更のみ |

### Complexity Tracking

None
