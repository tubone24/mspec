---
doc_type: Reference
---

# Tasks: full-text-search

## Phase 1: Setup

### T-001: minisearch を web-ui に追加する

`packages/web-ui` に MiniSearch をインストールし、TypeScript 型が解決できることを確認する。

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/full-text-search/spec.md
Requirements implemented: FR-001
Change: full-text-search
```

<!-- verify: fr-001 -->

対象ファイル: `packages/web-ui/package.json`

実装内容:
```bash
cd packages/web-ui && npm install minisearch
```

---

### T-002: routes/changes.ts に title / tags を追加する（D-07）

`packages/cli/src/server/routes/changes.ts` のレスポンスに `title` と `tags` フィールドが含まれていることを確認・修正する。含まれない場合は `ChangeInfo` の型定義と合わせて追加する。

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/search-index/spec.md
Requirements implemented: FR-002
Change: full-text-search
```

<!-- verify: fr-002 -->

対象ファイル: `packages/cli/src/server/routes/changes.ts`

---

## Phase 2: Foundational

### T-003: src/lib/searchIndex.ts を作成する（D-01, D-05）

MiniSearch インスタンスの生成ファクトリと Intl.Segmenter ベースのトークナイザーを実装する。

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/full-text-search/spec.md
Requirements implemented: FR-001, FR-002
Change: full-text-search
```

<!-- verify: fr-001 -->

対象ファイル: `packages/web-ui/src/lib/searchIndex.ts`（新規）

実装内容:
- `SearchDocument` インターフェース（id / changeId / name / title / summary / tags / content）
- `tokenize(text: string): string[]` — `Intl.Segmenter('ja', { granularity: 'word' })` ベース
- `createSearchIndex()` — フィールド weight: name/title=3, summary/tags=2, content=1

---

### T-004: src/hooks/useSearchIndex.ts を作成する（D-02, D-03, D-06）

ブラウザ起動時に動的インデックスを構築する React hook を実装する。

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/search-index/spec.md
Requirements implemented: FR-001, FR-002, FR-003
Change: full-text-search
```

<!-- verify: fr-001 -->

対象ファイル: `packages/web-ui/src/hooks/useSearchIndex.ts`（新規）

実装内容:
- `useSearchIndex(changes: ChangeInfo[]): SearchIndexState` インターフェース
- `useEffect` の依存キーを `changes.map(c => c.id).join(',')` で安定化（D-06）
- 各 change の markdown アーティファクトを concurrency=5 で並行フェッチ（D-02）
- エラー時は `error` state に記録し `index: null` で返す（D-03 フォールバック用）

---

## Phase 3: User Story

### T-005: E2E — クライアントサイド検索（full-text-search FR-001）

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/full-text-search/spec.md
Requirements implemented: FR-001
Change: full-text-search
```

<!-- verify: fr-001 -->

対象ファイル: `packages/web-ui/tests/e2e/full-text-search.spec.ts`（新規）

テスト内容:
- GIVEN Web UI が起動している
- WHEN 検索ボックスにキーワードを入力する
- THEN ネットワークリクエストが `/api/search` 等の新規エンドポイントに飛ばないことを確認（クライアントサイドのみ）

---

### T-006: E2E — ドキュメント本文の全文検索（full-text-search FR-002）

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/full-text-search/spec.md
Requirements implemented: FR-002
Change: full-text-search
```

<!-- verify: fr-002 -->

対象ファイル: `packages/web-ui/tests/e2e/full-text-search.spec.ts`

テスト内容:
- GIVEN インデックス構築済みの状態
- WHEN タイトルには含まれないが仕様書本文にのみ存在するキーワードで検索する
- THEN 該当変更が検索結果に表示される

---

### T-007: E2E — ブラウザ起動時インデックス構築（search-index FR-001）

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/search-index/spec.md
Requirements implemented: FR-001
Change: full-text-search
```

<!-- verify: fr-001 -->

対象ファイル: `packages/web-ui/tests/e2e/search-index.spec.ts`（新規）

テスト内容:
- GIVEN ユーザーが Web UI を開いた
- WHEN アプリ初期化完了後に検索を実行する
- THEN アーティファクト本文を含む結果が返る（メタデータのみより広い検索が機能）

---

### T-008: E2E — 複数フィールド検索（search-index FR-002）

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/search-index/spec.md
Requirements implemented: FR-002
Change: full-text-search
```

<!-- verify: fr-002 -->

対象ファイル: `packages/web-ui/tests/e2e/search-index.spec.ts`

テスト内容:
- GIVEN インデックス構築済みの状態
- WHEN タグフィールドと一致するキーワードで検索する
- THEN タグのマッチが結果に反映される

---

### T-009: E2E — フォールバック動作（search-index FR-003）

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/search-index/spec.md
Requirements implemented: FR-003
Change: full-text-search
```

<!-- verify: fr-003 -->

対象ファイル: `packages/web-ui/tests/e2e/search-index.spec.ts`

テスト内容:
- GIVEN API エラーを mock してインデックス構築が失敗する状態
- WHEN 検索クエリを入力する
- THEN エラーを表示せず変更名・タイトルのメタデータ部分一致で結果を返す

---

### T-010: E2E — 検索入力が全文検索エンジンに渡る（web-ui-search FR-001）

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/web-ui-search/spec.md
Requirements implemented: FR-001
Change: full-text-search
```

<!-- verify: fr-001 -->

対象ファイル: `packages/web-ui/tests/e2e/web-ui-search.spec.ts`（新規）

テスト内容:
- GIVEN インデックス構築済みの状態
- WHEN 検索ボックスに文字を入力する
- THEN MiniSearch によるスコアリング結果でリストが更新される（includes より広い結果）

---

### T-011: E2E — 全ドキュメント横断検索（web-ui-search FR-002）

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/web-ui-search/spec.md
Requirements implemented: FR-002
Change: full-text-search
```

<!-- verify: fr-002 -->

対象ファイル: `packages/web-ui/tests/e2e/web-ui-search.spec.ts`

テスト内容:
- GIVEN 複数 proposal.md / spec.md / design.md を持つ複数変更がある状態
- WHEN いずれかのドキュメント本文にのみ登場するキーワードを検索する
- THEN そのドキュメントを持つ変更が表示される

---

### T-012: Dashboard.tsx に全文検索を統合する（D-03, D-04, D-06）

既存の `String.includes()` 検索を MiniSearch 結果に置き換える。

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/web-ui-search/spec.md
Requirements implemented: FR-001, FR-002
Change: full-text-search
```

<!-- verify: fr-001 -->

対象ファイル: `packages/web-ui/src/pages/Dashboard.tsx`

実装内容:
- `useSearchIndex(changes)` を呼び出して `{ index, isBuilding, error }` を取得
- `index` が利用可能なとき: `MiniSearch.search(q)` → `changeId` 単位で score 集約 → `matchedChangeIds` と `scoreMap` を生成
- `isBuilding || !index` のとき: 既存 `includes()` でフォールバック（D-03）
- sort を `scoreMap` 優先、空クエリ時は `updatedAt` 降順（D-04）

---

## Phase 4: Polish

### T-013: 再構築ゲーティングの動作確認（D-06）

`useChanges` の 2 秒リフェッチでインデックスが再構築されないことを手動または自動テストで確認する。

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/search-index/spec.md
Requirements implemented: FR-001
Change: full-text-search
```

<!-- verify: fr-001 -->

確認方法:
- ブラウザの Network タブで `/api/changes/:id/artifacts/*` が起動後2秒ごとに繰り返されないことを確認
- `useEffect` の依存配列が `changeIds` 文字列キーであることをコードレビューで確認

---

### T-014: TypeScript 型チェックとビルド確認

```anchor
@mspec-delta 2026-05-27-000005-full-text-search/specs/full-text-search/spec.md
Requirements implemented: FR-001
Change: full-text-search
```

```bash
cd packages/web-ui && npm run typecheck && npm run build
```

---

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I. ステップ独立性 | ✅ tasks.md はコードを変更しない |
| II. 決定論的マージ | ✅ アンカーブロックが capability / FR で一意に特定できる |
| III. 質問駆動の要件確定 | ✅ 全タスクが design.md の決定 D-01〜D-08 に基づく |
| IV. 双方向アンカー | ✅ 各タスクに `anchor:` ブロックを付与。E2E タスクが実装タスクの前に配置されている |
| V. 強制ステップと拡張ステップの分離 | ✅ tasks は強制ステップ |
| VI. Security by Default | ✅ クライアントサイドのみ。新規権限付与なし |
