---
doc_type: Reference
---

# Architecture Overview: web-ui-viewer-improvements

## System Diagram

```mermaid
graph TD
  subgraph "packages/web-ui/src"
    Router["AppRouter\n(router/index.tsx)"]
    Dashboard["Dashboard\n(pages/Dashboard.tsx)"]
    ChangeDetail["ChangeDetail\n(pages/ChangeDetail.tsx)\n★ スプリットビュー追加"]
    ArtifactPreview["ArtifactPreview\n(pages/ArtifactPreview.tsx)\n★ ArtifactViewer委譲"]
    ArtifactViewer["ArtifactViewer\n(components/ArtifactViewer.tsx)\n★ 新規作成"]
    StepProgress["StepProgress\n(components/StepProgress.tsx)\n★ animate-pulse追加"]
    Client["api/client.ts\n★ refetchInterval 2000ms\n★ StepState型拡張"]
    TailwindConfig["tailwind.config.ts\n★ typography plugin追加"]
  end

  Router --> Dashboard
  Router --> ChangeDetail
  Router --> ArtifactPreview
  ChangeDetail --> ArtifactViewer
  ArtifactPreview --> ArtifactViewer
  Dashboard --> StepProgress
  Dashboard --> Client
  ChangeDetail --> Client
  ArtifactViewer --> Client
```

## Sequence Diagram: スプリットビューでのアーティファクト表示

```mermaid
sequenceDiagram
  actor User
  participant CD as ChangeDetail
  participant AV as ArtifactViewer
  participant API as api/client.ts

  User->>CD: アーティファクト一覧を表示
  CD->>API: useArtifacts(changeId)
  API-->>CD: ArtifactFile[]

  User->>CD: design.md をクリック
  CD->>CD: setSelectedArtifact("design.md")
  CD->>AV: <ArtifactViewer changeId relativePath="design.md" />
  AV->>API: useArtifactContent(changeId, "design.md")
  API-->>AV: Markdown テキスト
  AV-->>User: ReactMarkdown でレンダリング表示

  User->>CD: proposal.md をクリック
  CD->>CD: setSelectedArtifact("proposal.md")
  CD->>AV: <ArtifactViewer changeId relativePath="proposal.md" />
  AV->>API: useArtifactContent(changeId, "proposal.md")
  API-->>AV: Markdown テキスト
  AV-->>User: 右ペインが切り替わる（左ペイン変化なし）

  User->>CD: 閉じるボタンをクリック
  CD->>CD: setSelectedArtifact(null)
  CD-->>User: 全幅リスト表示に戻る
```

## Data Model: StepState 型の拡張

```mermaid
classDiagram
  class StepState {
    id: string
    state: StepStateValue
  }

  class StepStateValue {
    <<enumeration>>
    done
    ready ★animate-pulse
    blocked
    skipped ★新規追加
    invalid ★新規追加
  }

  StepState --> StepStateValue
```

## コンポーネント構成: ArtifactViewer の抽出

```mermaid
graph LR
  subgraph 変更前
    AP_old["ArtifactPreview\n(rendering ロジック含む)"]
  end

  subgraph 変更後
    AV_new["ArtifactViewer\n(共有 rendering)"]
    AP_new["ArtifactPreview\n(ArtifactViewer を使用)"]
    CD_new["ChangeDetail\n右ペイン (ArtifactViewer を使用)"]
  end

  AP_old -.->|抽出| AV_new
  AP_new --> AV_new
  CD_new --> AV_new
```

## ファイル変更サマリー

| ファイル | 変更種別 | 影響範囲 |
|----------|----------|----------|
| `tailwind.config.ts` | 修正（プラグイン追加） | 全 `prose` クラスの CSS 出力が有効化 |
| `api/client.ts` | 修正（型 + 設定値） | StepProgress・Dashboard・ChangeDetail に影響 |
| `components/StepProgress.tsx` | 修正（スタイル） | Dashboard のステップ表示 |
| `components/ArtifactViewer.tsx` | 新規作成 | ChangeDetail・ArtifactPreview が依存 |
| `pages/ChangeDetail.tsx` | 修正（レイアウト + 状態） | アーティファクト一覧ページ全体 |
| `pages/ArtifactPreview.tsx` | 修正（委譲） | ArtifactViewer への移譲のみ、ルートは維持 |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ | ✅ 構造図は research・design を参照するのみ。実装に依存しない |
| II 決定論的マージ | ✅ | ✅ 図は設計の可視化のみ。FR 番号・ファイルパスは design.md と一致 |
| III 質問駆動の要件確定 | ✅ | ✅ 設計上の選択肢はすべて research・design ステップで確定済み |
| IV 双方向アンカー | ✅ | ✅ design.md のアンカーコメントが本ファイルをカバー |
| V 強制/拡張ステップの分離 | ✅ | ✅ minor モードの強制ステップとして正しく位置づけられている |

## Complexity Tracking

None
