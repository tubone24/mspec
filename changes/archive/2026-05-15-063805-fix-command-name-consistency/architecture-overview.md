---
doc_type: Reference
---

# Architecture Overview: fix-command-name-consistency

## System Diagram

修正対象ファイルのカテゴリと、「変更する」「変更しない」の分類を示す。

```mermaid
graph TD
    subgraph FIX["修正対象（ハイフン→コロン）"]
        SK["ランタイム スキル<br/>.claude/skills/mspec-*/SKILL.md<br/>（11ファイル）"]
        CM["ランタイム コマンド<br/>.claude/commands/mspec/*.md<br/>（9ファイル）"]
        CS["CLI ソース<br/>init.ts / new.ts<br/>（2ファイル）"]
        CT["CLI テンプレート<br/>templates/claude/<br/>（20ファイル）"]
        WF["ワークフロー設定<br/>.mspec/workflow.yaml<br/>（command: フィールドのみ）"]
        DC["ドキュメント・仕様書<br/>README / docs / specs<br/>（4ファイル）"]
        AT["テストフィクスチャ<br/>archive.test.ts<br/>（1ファイル）"]
    end

    subgraph KEEP["変更しない（識別子）"]
        AG["エージェント名<br/>mspec-researcher<br/>mspec-checklist-auditor"]
        NM["name: フロントマター<br/>skill: フィールド"]
        AN["@mspec-delta アンカー"]
    end

    USER["ユーザー"] -->|"/mspec:continue と入力"| CM
    CM -->|"スキルを呼び出す"| SK
    SK -->|"次ステップを案内"| USER
    WF -->|"continue.ts が読み取る"| CS
    CT -->|"mspec init でコピー"| SK
    CT -->|"mspec init でコピー"| CM
```

## Sequence: ユーザーがスキル指示を受けてコマンドを実行するまで

修正前後のフローの違いを示す。

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant SK as SKILL.md
    participant CC as Claude Code ハーネス

    rect rgb(255, 200, 200)
        Note over SK: 修正前（ハイフン形式）
        SK->>U: "run /mspec-continue を実行してください"
        U->>CC: /mspec-continue と入力
        CC-->>U: ❌ コマンドが見つからない
    end

    rect rgb(200, 255, 200)
        Note over SK: 修正後（コロン形式）
        SK->>U: "run /mspec:continue を実行してください"
        U->>CC: /mspec:continue と入力
        CC-->>U: ✅ mspec-continue スキルが起動
    end
```

## ファイル対応関係: ランタイム ↔ テンプレート

`mspec init` を実行すると、テンプレートがランタイムファイルとしてコピーされる。
両者を同時に修正することで新規プロジェクトも即座に正しいコマンド形式を持つ。

```mermaid
graph LR
    T1["templates/claude/skills/mspec-new/SKILL.md"]
    T2["templates/claude/commands/mspec/continue.md"]
    R1[".claude/skills/mspec-new/SKILL.md"]
    R2[".claude/commands/mspec/continue.md"]

    T1 -->|"mspec init"| R1
    T2 -->|"mspec init"| R2

    style T1 fill:#ffe,stroke:#cc0
    style T2 fill:#ffe,stroke:#cc0
    style R1 fill:#efe,stroke:#0a0
    style R2 fill:#efe,stroke:#0a0
```

## Constitution Check

> Step: design | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | architecture-overview は設計ドキュメントのみ；コード変更なし |
| II. 決定論的マージ | ✅ | ✅ | 図はファイル分類を決定論的に表現；曖昧な分岐なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | スコープは proposal・research で確定済み |
| IV. 双方向アンカー | ✅ | ✅ | 各カテゴリが FR-017・FR-001・FR-002 に対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | 既存ファイル修正のみ；新ステップ・新コマンド不要 |

### Complexity Tracking

None
