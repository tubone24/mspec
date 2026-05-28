---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: markdown-search-and-quick-access

## Summary

SpecViewerおよびChangesダッシュボードの全文検索をMarkdown本文まで拡張し、マッチ行をスニペット（前後2行、CSS `line-clamp-3`）でプレーンテキスト表示する。AND条件は MiniSearch の `combineWith: 'AND'` で実現。クイックアクセスパレット（⌘K/Ctrl+K、OS判定）を新規追加し、Spec・Change・Capability・次Stepへの高速ナビゲーションを提供する。

変更スコープ:
- **spec-viewer-search**: FR-008（スニペット表示）、FR-009（AND条件）
- **web-ui-search**: FR-004（スニペット表示）、FR-005（AND条件）
- **quick-access-palette**: FR-001〜FR-005（新規Capability）

## Technical Context

| 項目 | 現状 |
|------|------|
| 検索ライブラリ | MiniSearch 7.2.0（`packages/web-ui/package.json:28`） |
| `storeFields` | `['changeId']` / `['capability']`（content未登録） |
| スニペット機能 | なし（capability名/changeId のみ返却） |
| キーバインド登録 | 全体で0件（`Search.tsx:57-59` にヒント表示のみ） |
| パレット | なし |

## Project Structure

### 新規作成ファイル

| ファイル | 役割 |
|----------|------|
| `packages/web-ui/src/lib/extractSnippet.ts` | キーワード→行スニペット抽出純粋関数 |
| `packages/web-ui/src/hooks/useQuickAccess.ts` | ⌘K/Ctrl+K キーバインド＋パレット open/close state |
| `packages/web-ui/src/components/QuickAccessPalette.tsx` | クイックアクセスパレットUIコンポーネント |
| `packages/web-ui/tests/e2e/quick-access-palette.e2e.test.ts` | パレットE2Eテスト |

### 変更ファイル

| ファイル | 変更概要 |
|----------|----------|
| `packages/web-ui/src/lib/searchIndex.ts` | `createSearchIndex()` の戻り値に `contentCache: Map<string, string>` を追加 |
| `packages/web-ui/src/lib/specSearchIndex.ts` | 同上（key: capability名） |
| `packages/web-ui/src/hooks/useSearchIndex.ts` | `buildIndex()` でコンテンツを `contentCache` に蓄積して返却 |
| `packages/web-ui/src/hooks/useSpecSearchIndex.ts` | 同上 |
| `packages/web-ui/src/pages/Dashboard.tsx` | `combineWith: 'AND'`追加、`contentCache`からスニペット表示 |
| `packages/web-ui/src/pages/SpecViewer.tsx` | 同上（specSearchIndex版） |
| `packages/web-ui/src/components/ChangeRow.tsx` | `snippet?: string` prop追加、スニペット表示UI |
| `packages/web-ui/src/components/Search.tsx` | OS判定に基づいてヒントラベル（⌘K / Ctrl+K）を動的表示（現在は静的な "⌘K" 固定） |
| `packages/web-ui/src/App.tsx` | `<QuickAccessPalette>` を `QueryClientProvider` 直下に追加 |
| `packages/web-ui/src/i18n/en.ts` | `quickAccessPalette` キー追加 |

## Key Interfaces

- `extractSnippet(content: string, query: string, context = 2): string | null` — `lib/extractSnippet.ts`
- `useQuickAccess(): { isOpen: boolean; open: () => void; close: () => void; isMac: boolean }` — `hooks/useQuickAccess.ts`
- `QuickAccessPaletteProps: { isOpen: boolean; onClose: () => void }` — `components/QuickAccessPalette.tsx`
- `SearchIndexState` extended with `contentCache: Map` — `hooks/useSearchIndex.ts`, `hooks/useSpecSearchIndex.ts`

## Decisions

### D1: `extractSnippet` — リテラルマッチ行分割

`content.split('\n')` でキーワードを含む行を特定し、前後 `context`（default: 2）行を取り出す。大文字小文字を正規化してから比較。正規表現不使用（ReDoS回避）。スペース区切りクエリは各トークンで個別に行スキャンし、最初にマッチした行を採用する。

**受け入れ基準対応**:
- `spec-viewer-search/FR-008` — 「本文ヒット行がスニペットで表示される」
- `web-ui-search/FR-004` — 「Changes検索でヒット行がスニペットで表示される」

### D2: AND条件 — `combineWith: 'AND'`

MiniSearch の `search(query, { combineWith: 'AND' })` を使用。全トークンを含む文書のみ返却。既存の `index.search(debouncedQuery)` 呼び出しにオプションを追加するだけの最小変更。

**受け入れ基準対応**:
- `spec-viewer-search/FR-009` — 「AND条件で複数キーワードを絞り込む」
- `web-ui-search/FR-005` — 「AND条件で複数キーワードを絞り込む」

### D3: contentCache — `Map<id, content>` 別途管理

`buildIndex()` / `buildSpecIndex()` のフェッチループ内で `contentCache.set(id, content)` を並行構築。`storeFields` には content を追加しない（メモリ消費抑制）。`createSearchIndex()` / `createSpecSearchIndex()` の戻り値型に `contentCache` を追加して呼び出し側に渡す。

### D4: `useQuickAccess` — グローバルキーバインド

OS判定: `navigator.userAgentData?.platform === 'macOS' || /Mac/i.test(navigator.platform)` でisMacを決定。
`useEffect` で `document.addEventListener('keydown', handler)` を登録し、`e.key === 'k'` かつ isMac なら `metaKey`、そうでなければ `ctrlKey` をチェック。cleanup で `removeEventListener` を呼ぶ。

useQuickAccess usage:

```text
const { isOpen, open, close, isMac } = useQuickAccess()
document.addEventListener keydown
  if key=k and metaKey(mac) or ctrlKey(other): open()
return removeEventListener on cleanup
```

UA文字列はサーバー送信なし（クライアントのキーバインド判定のみ）。

`Search.tsx:57-59` の現在の静的ヒントラベル `⌘K` を OS 判定結果に基づいて `⌘K`（macOS）または `Ctrl+K`（Windows/Linux）に動的切り替えする。`isMac` フラグは `useQuickAccess()` から prop として受け取るか、コンポーネント内で再判定する。

**受け入れ基準対応**:
- `quick-access-palette/FR-001` — ⌘K/Ctrl+K でパレット表示
- `quick-access-palette/FR-002` — OS判定によるキーバインド切り替え・ヒントUI動的表示

### D5: パレット — `App.tsx` QueryClientProvider 直下

コンポーネントツリー: `QueryClientProvider` → `BrowserRouter` → `AppInner`（`AppRoutes` + `QuickAccessPalette`）

`BrowserRouter` 外側のルートレベルに配置。`useChanges()` / `useSpecs()` が同一 `QueryClient` を共有し、重複フェッチなし。

**受け入れ基準対応**:
- `quick-access-palette/FR-003` — パレット表示コンテンツ
- `quick-access-palette/FR-004` — インクリメンタルフィルタリング
- `quick-access-palette/FR-005` — ESCキーで閉じる

### D6: 次Stepナビゲーション

`/api/changes` レスポンスを `updatedAt` 降順でソートし、`currentStep !== 'archive'` かつ未完了の上位1件を選択。その `currentStep` とChangeIDをパレットに表示してナビゲーションリンクを提供する。

**受け入れ基準対応**:
- `quick-access-palette/FR-003` — パレット表示コンテンツ（次Stepナビゲーション）

### D7: スニペットUI — CSS `line-clamp-3`、textContentのみ

`<ChangeRow>` と SpecViewer サイドバーリスト項目に `snippet` を `<p className="text-sm text-muted-foreground line-clamp-3">` で表示。`textContent` への代入のみ（XSS回避のため `dangerouslySetInnerHTML` 不使用）。

**受け入れ基準対応**:
- `web-ui-search/FR-004` Scenario — 「プレーンテキストスニペットが表示される」
- `spec-viewer-search/FR-008` Scenario — 「プレーンテキストスニペットが表示される」

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK — design は research/proposal と独立した参照ドキュメント | OK — 3Capability（spec-viewer-search/web-ui-search/quick-access-palette）はそれぞれ独立したモジュール境界で設計。共有は `extractSnippet` 純粋関数のみ |
| II 決定論的マージ | OK — 全ファイルは新規追加または既存ファイルの限定的変更 | OK — `extractSnippet`・`contentCache`・`useQuickAccess` は全てgit revertで復元可能。App.tsx の変更は1行追加のみ |
| III 質問駆動の要件確定 | OK — 全Open Choicesはresearchステップで解決済み | OK — スニペット行数（line-clamp-3）・contentキャッシュ方式（Map別管理）・次Step表示（直近1件）の全件が確認済み |
| IV 双方向アンカー | OK — deltaステップで@mspec-deltaアンカー付与済み | OK — tasks.md の実装タスクで各ファイルに `@mspec-delta` アンカーをコードコメントとして付与する |
| V 強制ステップと拡張ステップの分離 | OK — QuickAccessPaletteはApp.tsx拡張（既存ルーター・強制フロー変更なし） | OK — 新コンポーネントは既存コンポーネントに対してsidecar的に追加。Dashboard/SpecViewerの既存検索ロジックへの変更は `combineWith:'AND'` オプション追加のみ |
| VI Security by Default | OK — textContent使用・リテラルマッチ・UA文字列クライアント利用のみ確認済み | OK — `extractSnippet` はHTMLエスケープ不要（textContentに渡すため）。OS判定は低エントロピー情報のみ使用。フィンガープリンティングリスクなし |

### Complexity Tracking

None

## Self-Review

### Summary

全Delta SpecのFR-IDはchecklist.mdに網羅されており、設計全体は内部一貫性を保っている。ただし1件のblockerと3件のwarningを検出し、blockerはDesign修正とchecklist追加で解消した。

### Findings

- **[blocker → 解消済]** `quick-access-palette/FR-002` THEN句「ヒントUIに⌘K/Ctrl+Kが表示される」がdesign.mdのProject Structureおよびchecklist.mdに欠落していた。`Search.tsx` を変更ファイルに追加し、Decision D4にヒントUI動的切り替えの記述を追加。checklist.mdにFR-002（ヒントUI）項目を追加して解消。

- **[warning]** FR-002の「UA文字列をサーバーに送信しないこと（MUST NOT）」の陰性テスト検証手段が不明確だった。checklist.mdにネットワークインターセプター検査項目を追加して対処。

- **[warning]** `i18n/en.ts` がdesign.mdの変更ファイルに記載されているが、architecture-overview.mdのMermaid図に含まれていない。設計上の一貫性として記録するが、図の可読性への影響は軽微なため未修正（acceptedとして記録）。

- **[warning]** `/api/changes` の `currentStep` / `updatedAt` フィールド存在がFR-003の前提だが、どのアーティファクトにも確認記録がなかった。checklist.mdにFR-003（API互換性）項目を追加して実装前検証を義務付け。

- **[ok]** 全FR-IDのchecklistカバレッジ、Mermaid図の正確性、quickstartの3機能カバー、XSS/ReDoS/UA対策の一貫性はすべてOK。
