---
doc_type: Reference
---

# Architecture Overview: markdown-search-and-quick-access

## システム構成図

```mermaid
graph TD
  subgraph "Web UI (packages/web-ui)"
    App["App.tsx\n(QueryClientProvider root)"]
    AppRouter["AppRouter\n(BrowserRouter)"]
    QAP["QuickAccessPalette\n(新規)"]
    Dashboard["Dashboard.tsx"]
    SpecViewer["SpecViewer.tsx"]
    ChangeRow["ChangeRow.tsx\n(+ snippet prop)"]

    subgraph "Hooks (新規/変更)"
      useQA["useQuickAccess\n(新規: keydown + isOpen state)"]
      useIdx["useSearchIndex\n(変更: + contentCache)"]
      useSpecIdx["useSpecSearchIndex\n(変更: + contentCache)"]
    end

    subgraph "Lib (新規/変更)"
      extractSnippet["extractSnippet()\n(新規: 純粋関数)"]
      searchIndex["searchIndex.ts\n(変更: contentCache返却)"]
      specSearchIndex["specSearchIndex.ts\n(変更: contentCache返却)"]
    end
  end

  subgraph "CLI Server (packages/cli)"
    apiChanges["/api/changes\n(ChangeInfo[])"]
    apiSpecs["/api/specs\n(CapabilityInfo[])"]
    apiSpecCap["/api/specs/:capability\n(spec.md content)"]
  end

  App --> AppRouter
  App --> QAP
  QAP --> useQA
  QAP --> apiChanges
  QAP --> apiSpecs

  Dashboard --> useIdx
  Dashboard --> extractSnippet
  Dashboard --> ChangeRow
  useIdx --> searchIndex
  useIdx --> apiChanges

  SpecViewer --> useSpecIdx
  SpecViewer --> extractSnippet
  useSpecIdx --> specSearchIndex
  useSpecIdx --> apiSpecCap
```

## シーケンス図: Markdown全文検索とスニペット表示

```mermaid
sequenceDiagram
  actor User
  participant Search as Search.tsx
  participant Dashboard as Dashboard.tsx
  participant MiniSearch as MiniSearch<br/>(combineWith: AND)
  participant extract as extractSnippet()
  participant ChangeRow as ChangeRow.tsx

  User->>Search: キーワード入力
  Note over Search: debounce 200ms
  Search->>Dashboard: onChange(query)
  Dashboard->>MiniSearch: search(query, { combineWith: 'AND' })
  MiniSearch-->>Dashboard: SearchResult[] (changeId, score)

  loop 各 SearchResult
    Dashboard->>extract: extractSnippet(contentCache.get(changeId), query, 2)
    extract-->>Dashboard: snippet string | null
  end

  Dashboard->>ChangeRow: snippet={snippet} prop 渡し
  ChangeRow-->>User: プレーンテキストスニペット表示<br/>(CSS line-clamp-3)
```

## シーケンス図: クイックアクセスパレット（⌘K/Ctrl+K）

```mermaid
sequenceDiagram
  actor User
  participant Doc as document
  participant useQA as useQuickAccess
  participant QAP as QuickAccessPalette
  participant API as CLI Server API

  Note over useQA: useEffect でOS判定<br/>(userAgentData?.platform<br/>|| navigator.platform)
  useQA->>Doc: addEventListener('keydown', handler)

  User->>Doc: ⌘K (macOS) / Ctrl+K (Win/Linux)
  Doc->>useQA: KeyboardEvent
  useQA->>QAP: isOpen = true

  par データ取得
    QAP->>API: GET /api/changes
    QAP->>API: GET /api/specs
  end
  API-->>QAP: ChangeInfo[], CapabilityInfo[]

  QAP-->>User: パレット表示<br/>(Spec / Change / Capability / 次Step)

  User->>QAP: テキスト入力
  Note over QAP: 部分一致インクリメンタルフィルタリング
  QAP-->>User: フィルタリング済み一覧

  User->>QAP: 項目選択 or ESC / 背景クリック
  QAP->>useQA: close()
  QAP-->>User: パレット閉じる
```

## データモデル変更

```mermaid
erDiagram
  SearchIndexResult {
    MiniSearch index "既存（変更なし）"
    Map contentCache "新規: key=changeId, value=content文字列"
  }

  SearchResult {
    string id "changeId or capability"
    number score "関連度スコア"
    string[] terms "マッチしたトークン"
  }

  SnippetOutput {
    string snippet "前後2行コンテキスト（null=マッチなし）"
  }

  QuickAccessItem {
    string type "spec | change | capability | next-step"
    string label "表示ラベル"
    string href "ナビゲーション先パス"
  }

  SearchIndexResult ||--o{ SearchResult : produces
  SearchIndexResult ||--o{ SnippetOutput : "contentCache enables"
  QuickAccessItem ||--o{ QuickAccessItem : "filtered by input query"
```

## `extractSnippet` ロジック概要

```
入力: content (string), query (string), context (number = 2)
1. query をスペース分割してトークン配列に変換
2. content を行分割（split('\n')）
3. 各行を小文字正規化し、最初のトークンが含まれる行インデックスを検索
4. hitIndex ± context の範囲でスライス
5. スライス結果を改行で結合して返す
6. マッチなしの場合は null を返す
正規表現: 不使用（ReDoS回避）
```

## 変更影響範囲まとめ

| Capability | 変更種別 | 影響ファイル数 |
|-----------|---------|-------------|
| spec-viewer-search | 拡張 | 4（useSpecSearchIndex, specSearchIndex, SpecViewer, extractSnippet） |
| web-ui-search | 拡張 | 4（useSearchIndex, searchIndex, Dashboard, ChangeRow） |
| quick-access-palette | 新規 | 4（useQuickAccess, QuickAccessPalette, App.tsx, i18n/en.ts） |
| 共有ユーティリティ | 新規 | 1（extractSnippet.ts） |

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK — architecture-overview は設計ドキュメント。実装への変更を含まない | OK — 3Capability（spec-viewer-search/web-ui-search/quick-access-palette）はそれぞれ独立したモジュールとして図示。共有は `extractSnippet` 純粋関数のみ |
| II 決定論的マージ | OK — 新規ファイル追加のみ | OK — 図内の全コンポーネントは git revert で確実に復元可能な変更のみ |
| III 質問駆動の要件確定 | OK — 図に示す設計は research の Open Choices で確定済み | OK — contentCache Map・line-clamp-3・次Step直近1件の全決定が図に反映されている |
| IV 双方向アンカー | OK — 参照するFR-IDはdeltaステップで付与済み | OK — 図内コンポーネントの対応FRはdesign.md Decisionsで追跡 |
| V 強制ステップと拡張ステップの分離 | OK — 概要図は参照ドキュメント。強制フロー変更なし | OK — QuickAccessPaletteはApp.tsxへのSidecar追加のみ。AppRouterや既存ルーターを変更しない |
| VI Security by Default | OK — UA文字列クライアント利用・textContent使用・ReDoS回避が図とロジック概要に明示 | OK — extractSnippetロジック概要に「正規表現不使用（ReDoS回避）」を明記 |

### Complexity Tracking

None
