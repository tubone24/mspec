---
doc_type: Reference
---

# Architecture Overview: fix-specviewer-purpose-regression

## System Diagram

注意: step 3b は意図的に step 3 より前に配置する（CLI archive が readme.md を validate するため）。

```mermaid
graph TD
    A[User: /mspec:archive] --> B[mspec-archive SKILL]
    B --> C["step 3b: Lessons/Next Steps 生成\nreadme.md を更新\n※CLI 実行前に必須"]
    C --> D[step 3: mspec archive -y\nCLI 決定論的マージ]
    D --> E[specs/capability/spec.md\nRequirements マージ済み]
    D --> F[changes/archive/change/\ngit mv 完了]
    E --> G[step 3c: ポストモーテムフック\nLessons + NextAction]
    G --> H{step 3d: Purpose 生成\n各 capability を確認}
    H -->|Purpose = プレースホルダー| I[AI が 1〜2 文を生成]
    I --> J[specs/capability/spec.md\nPurpose 上書き]
    H -->|Purpose = 記述済み| K[スキップ]
    J --> L[archive 完了レポート]
    K --> L
```

## Sequence Diagram: Purpose 自動生成フロー

```mermaid
sequenceDiagram
    participant U as User
    participant S as mspec-archive SKILL
    participant CLI as mspec archive CLI
    participant Spec as specs/<cap>/spec.md

    U->>S: /mspec:archive
    S->>CLI: mspec archive <change> -y
    CLI->>Spec: ADDED/MODIFIED/REMOVED をマージ
    CLI->>CLI: git mv changes/<change>/ → changes/archive/
    CLI-->>S: 完了
    S->>S: step 3c: Lessons + NextAction フロー

    Note over S,Spec: step 3d: Purpose 生成ループ
    loop Delta Spec の各 capability
        S->>Spec: specs/<cap>/spec.md を読む
        alt ## Purpose がプレースホルダー
            S->>S: Requirements を基に 1〜2 文生成（AI）
            S->>Spec: Purpose を上書き
        else 記述済み
            S->>S: スキップ
        end
    end
    S->>U: マージサマリーを報告
```

## Data Model: Purpose 検出と置換

```mermaid
flowchart LR
    A["specs/<cap>/spec.md\n読み込み"] --> B{## Purpose の内容}
    B -->|"&lt;このスペックが...&gt;"| C[プレースホルダー検出]
    B -->|その他テキスト| D[スキップ]
    C --> E["Requirements を読んで\n1〜2 文を AI 生成"]
    E --> F["## Purpose セクションを\n生成テキストで置換"]
    F --> G["specs/<cap>/spec.md\nに書き込み"]
```

## 変更ファイル一覧

| ファイル | 種別 | 変更内容 |
|----------|------|----------|
| `.claude/skills/mspec-archive/SKILL.md` | 修正 | step 3c の後に step 3d（Purpose 生成ループ）を追加 |

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | Purpose 生成は archive 後の独立ステップ。他ステップへの副作用なし |
| II. 決定論的マージ | ✅ | ✅ | CLI 側（LLM フリー）は変更しない。AI 生成は SKILL.md 側のみ |
| III. 質問駆動の要件確定 | ✅ | ✅ | FR-005 に要件明記済み |
| IV. 双方向アンカー | N/A | N/A | コード変更なし |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | 強制ステップ（cli-archive）は変更せず、SKILL.md の拡張ステップに追加 |
| VI. Security by Default | ✅ | ✅ | ローカルファイル書き込みのみ。外部 API・秘密情報アクセスなし |
