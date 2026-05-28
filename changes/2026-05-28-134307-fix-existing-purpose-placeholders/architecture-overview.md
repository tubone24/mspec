---
doc_type: Reference
---

# Architecture Overview: fix-existing-purpose-placeholders

## System Diagram

```mermaid
graph TD
    A[Claude Code: バックフィル実行] --> B[grep: プレースホルダーを持つ spec を列挙]
    B --> C[39 件の spec ファイルリスト]
    C --> D{各ファイルを逐次処理}
    D --> E[spec.md を Read]
    E --> F{Purpose がプレースホルダー?}
    F -->|Yes| G[Requirements セクションを読む]
    G --> H[AI が 1〜2 文の Purpose を生成]
    H --> I[Edit ツールでプレースホルダー行のみ置換]
    I --> J[処理完了: 修正件数++]
    F -->|No 記述済み| K[スキップ: スキップ件数++]
    J --> D
    K --> D
    D -->|全件完了| L[サマリー出力\n修正/スキップ/失敗件数]
```

## Sequence Diagram: 1 ファイルの処理フロー

```mermaid
sequenceDiagram
    participant CC as Claude Code
    participant FS as ファイルシステム
    participant AI as AI 生成

    CC->>FS: Read specs/<cap>/spec.md
    FS-->>CC: ファイル内容
    CC->>CC: ## Purpose セクションを確認
    alt プレースホルダー検出
        CC->>AI: ## Requirements 内容を渡す
        AI-->>CC: 1〜2 文の Purpose
        CC->>FS: Edit（プレースホルダー行のみ置換）
        FS-->>CC: 成功
    else 記述済み
        CC->>CC: スキップ
    end
```

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | アドホック実行。他ステップへの副作用なし |
| II. 決定論的マージ | ✅ | ✅ | CLI マージは変更なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | 全決定事項が proposal に記録済み |
| IV. 双方向アンカー | N/A | N/A | アドホック実行のためアンカー対象なし |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | SKILL.md・workflow.yaml 変更なし |
| VI. Security by Default | ✅ | ✅ | ローカル書き込みのみ。外部 API なし |
| VII. 設計意図と実装の対応確認 | ✅ | ✅ | FR-005 の設計意図を FR-006 で明示的に記録・実装 |
