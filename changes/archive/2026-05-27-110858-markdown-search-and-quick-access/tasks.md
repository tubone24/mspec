---
doc_type: Reference
---

# Tasks: markdown-search-and-quick-access

## Phase 1 — Setup（共有インフラ）

### T1.1: extractSnippet ユニットテスト（TDD red）

ファイル: `packages/web-ui/src/lib/extractSnippet.test.ts`（新規）

- 本文ヒット行とその前後2行が返ること
- 正規表現を使用しないリテラルマッチであること
- スペース区切りクエリの最初のトークンでマッチすること
- マッチなしの場合 null を返すこと
- 大文字小文字を区別しないこと

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/spec-viewer-search/spec.md
Requirements implemented: FR-008
Change: markdown-search-and-quick-access
```
<!-- verify: fr-008 -->

---

### T1.2: extractSnippet 実装（TDD green）

ファイル: `packages/web-ui/src/lib/extractSnippet.ts`（新規）

- `extractSnippet(content: string, query: string, context = 2): string | null` を実装
- `content.split('\n')` で行分割、`toLowerCase().includes(token)` でマッチ行を特定
- hitIndex ± context の範囲でスライスして結合
- 正規表現不使用（ReDoS回避）

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/spec-viewer-search/spec.md
Requirements implemented: FR-008
Change: markdown-search-and-quick-access
```
<!-- verify: fr-008 -->

---

### T1.3: searchIndex / specSearchIndex に contentCache を追加

ファイル（変更）:
- `packages/web-ui/src/lib/searchIndex.ts`
- `packages/web-ui/src/lib/specSearchIndex.ts`
- `packages/web-ui/src/hooks/useSearchIndex.ts`
- `packages/web-ui/src/hooks/useSpecSearchIndex.ts`

- `createSearchIndex()` / `createSpecSearchIndex()` の戻り値型に `contentCache: Map<string, string>` を追加
- `buildIndex()` / `buildSpecIndex()` のフェッチループ内で `contentCache.set(id, content)` を蓄積
- storeFields への content 追加は行わない（メモリ消費抑制）

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/web-ui-search/spec.md
Requirements implemented: FR-004
Change: markdown-search-and-quick-access
```
<!-- verify: fr-004 -->

---

## Phase 2 — Foundational（全文検索スニペット表示）

### T2.1: spec-viewer-search FR-008 E2Eテスト（red）

ファイル: `packages/web-ui/tests/e2e/spec-viewer.e2e.test.ts`（変更）

- spec.md本文にのみ存在するキーワードで検索したとき `[data-testid="spec-snippet"]` が表示されること
- スニペットにヒット行前後のテキストが含まれること

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/spec-viewer-search/spec.md
Requirements implemented: FR-008
Change: markdown-search-and-quick-access
```
<!-- verify: fr-008 -->

---

### T2.2: SpecViewer スニペット表示 実装（green）

ファイル: `packages/web-ui/src/pages/SpecViewer.tsx`（変更）

- `filteredSpecs` に `snippet?: string` を追加
- `extractSnippet(contentCache.get(capability), debouncedQuery, 2)` を呼び出してスニペット生成
- サイドバーリスト項目に `<p data-testid="spec-snippet" className="text-sm text-muted-foreground line-clamp-3">` でスニペット表示
- XSS対策: DOM への代入は `textContent` のみ（`dangerouslySetInnerHTML` 不使用）

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/spec-viewer-search/spec.md
Requirements implemented: FR-008
Change: markdown-search-and-quick-access
```
<!-- verify: fr-008 -->

---

### T2.3: spec-viewer-search FR-009 AND条件 E2Eテスト（red）

ファイル: `packages/web-ui/tests/e2e/spec-viewer.e2e.test.ts`（変更）

- スペース区切りで2キーワード入力したとき、両方を含むCapabilityのみがサイドバーに表示されること
- 片方しか含まないCapabilityが結果に含まれないこと

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/spec-viewer-search/spec.md
Requirements implemented: FR-009
Change: markdown-search-and-quick-access
```

---

### T2.4: SpecViewer AND条件 実装（green）

ファイル: `packages/web-ui/src/pages/SpecViewer.tsx`（変更）

- `index.search(debouncedQuery)` を `index.search(debouncedQuery, { combineWith: 'AND' })` に変更

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/spec-viewer-search/spec.md
Requirements implemented: FR-009
Change: markdown-search-and-quick-access
```

---

### T2.5: web-ui-search FR-004 E2Eテスト（red）

ファイル: `packages/web-ui/tests/e2e/web-ui-search.e2e.test.ts`（変更）

- アーティファクト本文にのみ存在するキーワードで検索したとき `[data-testid="change-snippet"]` が表示されること
- スニペットにヒット行前後のテキストが含まれること

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/web-ui-search/spec.md
Requirements implemented: FR-004
Change: markdown-search-and-quick-access
```
<!-- verify: fr-004 -->

---

### T2.6: ChangeRow スニペット表示 実装（green）

ファイル:
- `packages/web-ui/src/components/ChangeRow.tsx`（変更）
- `packages/web-ui/src/pages/Dashboard.tsx`（変更）

- `ChangeRow` に `snippet?: string` prop を追加
- `<p data-testid="change-snippet" className="text-sm text-muted-foreground line-clamp-3">` でスニペット表示
- `Dashboard.tsx`: 検索結果ループ内で `extractSnippet(contentCache.get(changeId), q, 2)` を呼び出して `ChangeRow` に渡す
- XSS対策: `textContent` のみ使用

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/web-ui-search/spec.md
Requirements implemented: FR-004
Change: markdown-search-and-quick-access
```
<!-- verify: fr-004 -->

---

### T2.7: web-ui-search FR-005 AND条件 E2Eテスト（red）

ファイル: `packages/web-ui/tests/e2e/web-ui-search.e2e.test.ts`（変更）

- スペース区切りで2キーワード入力したとき、両方を含むChangeのみが表示されること
- 片方しか含まないChangeが結果に含まれないこと

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/web-ui-search/spec.md
Requirements implemented: FR-005
Change: markdown-search-and-quick-access
```

---

### T2.8: Dashboard AND条件 実装（green）

ファイル: `packages/web-ui/src/pages/Dashboard.tsx`（変更）

- `index.search(q)` を `index.search(q, { combineWith: 'AND' })` に変更

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/web-ui-search/spec.md
Requirements implemented: FR-005
Change: markdown-search-and-quick-access
```

---

## Phase 3 — User Story（クイックアクセスパレット）

### T3.1: useQuickAccess hook 実装

ファイル: `packages/web-ui/src/hooks/useQuickAccess.ts`（新規）

- `isMac = navigator.userAgentData?.platform === 'macOS' || /Mac/i.test(navigator.platform)` でOS判定
- `useEffect` で `document.addEventListener('keydown', handler)` 登録、cleanup で `removeEventListener`
- `e.key === 'k' && (isMac ? e.metaKey : e.ctrlKey)` でショートカット検知
- `{ isOpen, open, close }` を返す
- UA文字列はキーバインド判定のみに使用（APIリクエストに含めない）

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-001, FR-002
Change: markdown-search-and-quick-access
```
<!-- verify: fr-001 -->

---

### T3.2: Search.tsx ヒントUI 動的切り替え 実装

ファイル: `packages/web-ui/src/components/Search.tsx`（変更）

- 現在の静的 "⌘K" ラベルを OS 判定に基づいて "⌘K"（macOS）または "Ctrl+K"（Win/Linux）に動的切り替え
- `isMac` 判定は `useQuickAccess` と同じロジックを適用

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-002
Change: markdown-search-and-quick-access
```
<!-- verify: fr-002 -->

---

### T3.3: quick-access-palette FR-001/FR-002 E2Eテスト（red）

ファイル: `packages/web-ui/tests/e2e/quick-access-palette.e2e.test.ts`（新規）

- ⌘K（macOS）または Ctrl+K（Win/Linux）で `[data-testid="quick-access-palette"]` が表示されること
- `Search.tsx` のヒントラベルが macOS では "⌘K"、Win/Linux では "Ctrl+K" と表示されること
- ネットワークリクエストのヘッダーにUA文字列が含まれないこと（fetchインターセプターで確認）

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-001, FR-002
Change: markdown-search-and-quick-access
```
<!-- verify: fr-001 -->

---

### T3.4: QuickAccessPalette コンポーネント 実装（green）

ファイル: `packages/web-ui/src/components/QuickAccessPalette.tsx`（新規）

- `isOpen`, `onClose` props を受け取るオーバーレイコンポーネント
- `data-testid="quick-access-palette"` を付与
- `/api/changes` / `/api/specs` からデータ取得（実装前に `currentStep` / `updatedAt` フィールド存在を確認）
- `updatedAt` 降順でソートし、未完了 Change の上位1件の `currentStep` をナビゲーション項目として表示

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-001, FR-003
Change: markdown-search-and-quick-access
```
<!-- verify: fr-001 -->

---

### T3.5: パレット FR-004 インクリメンタルフィルタリング E2Eテスト（red）

ファイル: `packages/web-ui/tests/e2e/quick-access-palette.e2e.test.ts`（変更）

- パレット内テキストボックスに "spec" と入力したとき、"spec" を含む項目のみに絞り込まれること
- 空クエリのとき全項目が表示されること

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-004
Change: markdown-search-and-quick-access
```

---

### T3.6: パレット インクリメンタルフィルタリング 実装（green）

ファイル: `packages/web-ui/src/components/QuickAccessPalette.tsx`（変更）

- 入力フィールドの onChange で `items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()))` でフィルタリング
- フィルタリングはクライアントサイドのみ（正規表現不使用）

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-004
Change: markdown-search-and-quick-access
```

---

### T3.7: パレット FR-005 ESC/背景クリック E2Eテスト（red）

ファイル: `packages/web-ui/tests/e2e/quick-access-palette.e2e.test.ts`（変更）

- パレット表示中に Escape キーを押すとパレットが閉じること
- パレット背景クリックでパレットが閉じること

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-005
Change: markdown-search-and-quick-access
```

---

### T3.8: ESC/背景クリック 実装（green）

ファイル: `packages/web-ui/src/components/QuickAccessPalette.tsx`（変更）

- `onKeyDown={(e) => e.key === 'Escape' && onClose()}` で ESC ハンドリング
- オーバーレイ背景 div の `onClick={onClose}` でバックドロップクリックを処理
- パレット本体の `onClick={(e) => e.stopPropagation()}` でバブリング防止

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-005
Change: markdown-search-and-quick-access
```

---

### T3.9: App.tsx へ QuickAccessPalette を統合

ファイル: `packages/web-ui/src/App.tsx`（変更）

- `useQuickAccess()` フックを App.tsx に追加
- `<QuickAccessPalette isOpen={isOpen} onClose={close} />` を `QueryClientProvider` 直下（`<AppRouter />` の後）に追加

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
Change: markdown-search-and-quick-access
```
<!-- verify: fr-001 -->

---

## Phase 4 — Polish（仕上げ）

### T4.1: i18n/en.ts に quickAccessPalette キーを追加

ファイル: `packages/web-ui/src/i18n/en.ts`（変更）

- `quickAccessPalette` 名前空間のi18nキーを追加（パレット内プレースホルダー・空状態メッセージ等）

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-003
Change: markdown-search-and-quick-access
```

---

### T4.2: 全E2Eスイート グリーン確認

- `pnpm test:e2e` を実行して全テストがパスすること
- 既存テスト（spec-viewer.e2e.test.ts、web-ui-search.e2e.test.ts）がリグレッションしていないこと
- 新規テスト（quick-access-palette.e2e.test.ts）が全件グリーンであること
- Source-of-Truth Regression リスクが MEDIUM の FR（spec-viewer-search FR-002、web-ui-search FR-001/FR-002）を重点的に確認すること

```
@mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
Change: markdown-search-and-quick-access
```
<!-- verify: fr-001 -->

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK — tasks.md は design/checklist と独立したタスク管理ドキュメント | — |
| II 決定論的マージ | OK — 全タスクは git revert で復元可能な変更のみ対象 | — |
| III 質問駆動の要件確定 | OK — 全要件は proposal/research で確定済み。tasks.md は設計決定に従う | — |
| IV 双方向アンカー | OK — 全タスクに `@mspec-delta` アンカーを付与済み | — |
| V 強制ステップと拡張ステップの分離 | OK — QuickAccessPalette は App.tsx への sidecar 追加のみ。既存ルーター・ワークフローを変更しない | — |
| VI Security by Default | OK — T1.2でReDoS対策（正規表現不使用）、T2.2/T2.6でXSS対策（textContent）、T3.1でUA判定方針をタスク実装指示に明記 | — |
