---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: Full-Text Search 拡張

## Summary

`packages/web-ui` の既存検索（`Dashboard.tsx` の `String.prototype.includes()` ベース）を MiniSearch + Intl.Segmenter を用いたクライアントサイド全文検索に拡張する。
ブラウザ起動時に既存 API を使って Markdown アーティファクトの本文をフェッチし、インデックスをメモリ上に構築する。サーバーサイドの変更は不要。

## Technical Context

| 項目 | 現状 | 変更後 |
|------|------|--------|
| 検索エンジン | `String.includes()` | MiniSearch (TF-IDF) |
| 検索対象 | name / title / summary / tags | 上記 + 全 Markdown アーティファクト本文 |
| インデックス | なし | メモリ上（ブラウザ起動時構築） |
| 依存追加 | なし | `minisearch` のみ |
| サーバー変更 | なし | なし（既存 API を流用） |

## Project Structure

```
packages/web-ui/src/
├── lib/
│   └── searchIndex.ts        # NEW: MiniSearch ラッパー + Intl.Segmenter トークナイザー
├── hooks/
│   └── useSearchIndex.ts     # NEW: インデックス構築 React hook
├── components/
│   └── Search.tsx            # 既存（変更なし）
└── pages/
    └── Dashboard.tsx         # MODIFIED: includes() → MiniSearch 検索に置き換え
```

## API Contract

### `searchIndex.ts` — MiniSearch インスタンス

```ts
export interface SearchDocument {
  id: string;          // `${changeId}:${relativePath}`
  changeId: string;
  name: string;        // change.name
  title: string;       // change.title ?? change.name
  summary: string;     // change.summary ?? ''
  tags: string;        // (change.tags ?? []).join(' ')
  content: string;     // アーティファクト本文テキスト
}

export function createSearchIndex(): MiniSearch<SearchDocument>
export function tokenize(text: string): string[]  // Intl.Segmenter ベース
```

### `useSearchIndex.ts` — hook インターフェース

```ts
export interface SearchIndexState {
  index: MiniSearch<SearchDocument> | null;
  isBuilding: boolean;
  error: Error | null;
}

export function useSearchIndex(changes: ChangeInfo[]): SearchIndexState
```

### `Dashboard.tsx` — 検索ロジック変更

```ts
// 変更前（line 77-81）
.filter((c) => {
  if (!q.trim()) return true;
  const searchable = [c.name, c.title, c.summary, ...(c.tags ?? [])].join(' ').toLowerCase();
  return searchable.includes(q.toLowerCase());
})

// 変更後
.filter((c) => {
  if (!q.trim()) return true;
  if (indexState.isBuilding || !indexState.index) {
    // フォールバック: メタデータ部分一致
    const searchable = [c.name, c.title, c.summary, ...(c.tags ?? [])].join(' ').toLowerCase();
    return searchable.includes(q.toLowerCase());
  }
  return matchedChangeIds.has(c.id);
})
.sort((a, b) => {
  if (q.trim() && scoreMap.has(a.id) && scoreMap.has(b.id)) {
    return (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0);
  }
  return new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime();
})
```

## Decisions

### D-01: インデックス文書スキーマ（search-index FR-002 対応）

各 Markdown アーティファクトを 1 ドキュメントとしてインデックスする。
同一 change の複数アーティファクトは個別ドキュメントとして登録し、検索後に `changeId` で集約する。

| フィールド | 内容 | MiniSearch weight |
|-----------|------|-------------------|
| `name` | change.name | 3 |
| `title` | change.title または name | 3 |
| `summary` | change.summary | 2 |
| `tags` | タグをスペース結合 | 2 |
| `content` | アーティファクト本文 | 1 |

受け入れ基準（search-index FR-002 Scenario）:
- GIVEN インデックスが構築済み
- WHEN タグフィールドのキーワードで検索
- THEN タグマッチが結果に反映される ✅

### D-02: アーティファクト取得の並行制御（search-index FR-001 対応）

N（変更数）× M（Markdown アーティファクト数）の個別 fetch を `Promise.all` で並行実行する。
同時リクエスト数は最大 5 に制限してサーバー過負荷を防ぐ。

受け入れ基準（search-index FR-001 Scenario）:
- GIVEN Web UI が開かれた
- WHEN 初期化完了
- THEN インデックスがメモリ上に構築される ✅

### D-03: フォールバック動作（search-index FR-003 対応）

インデックス構築中（`isBuilding: true`）またはエラー時（`error != null`）は既存の `includes()` 検索にフォールバックする。Search.tsx には変更を加えない。

受け入れ基準（search-index FR-003 Scenario）:
- GIVEN アーティファクト取得が失敗
- WHEN 検索クエリを入力
- THEN メタデータ部分一致で結果を返す ✅

### D-04: 検索結果ソート（web-ui-search FR-003 対応）

MiniSearch の `score` フィールドを `changeId` 単位で集約（最大値）し、スコア降順でソートする。クエリが空の場合は従来の `updatedAt` ソートに戻す。

### D-05: Intl.Segmenter トークナイザー

```ts
const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });

export function tokenize(text: string): string[] {
  return Array.from(segmenter.segment(text))
    .filter(s => s.isWordLike)
    .map(s => s.segment.toLowerCase());
}
```

Node 18 / モダンブラウザ標準 API。追加パッケージ不要。

### D-06: useSearchIndex 再構築ゲーティング（useChanges 2 秒リフェッチ対応）

`useChanges` の `refetchInterval: 2000` は毎回新しい配列参照を返す。
`useSearchIndex` は `changes` の内容（`change.id` の集合）が変わったときのみインデックスを再構築する。
`useEffect` の依存配列を `changes.map(c => c.id).join(',')` のような安定した文字列キーに基づかせる。
新しい `id` が追加された場合は差分ドキュメントのみを追加し、完全再構築は行わない。

受け入れ基準:
- GIVEN `useChanges` が 2 秒ごとに同じ変更セットを返している
- WHEN `changes` 配列の参照が毎回変わる
- THEN インデックスの再構築は発生しない（change ID セットが変化したときのみ再構築）

### D-07: /api/changes レスポンスへの title / tags フィールド追加

research.md OC-03: `routes/changes.ts` の現行レスポンスには `title` / `tags` が含まれない可能性がある。
実装時に `packages/cli/src/server/routes/changes.ts` を確認し、`ChangeInfo.title` および `ChangeInfo.tags` をレスポンスに追加する修正を行う。
これにより D-01 の weight 設定（title: 3, tags: 2）が正しく機能する。
変更ファイル: `packages/cli/src/server/routes/changes.ts`

**OC-03: 解決済み**（実装時に routes 側を修正する）

### D-03（補足）: OC-04 解決 — isBuilding 中の検索ボックス状態

research.md OC-04 で「構築中は検索ボックスを disabled にする」案が挙がっていたが、D-03 の劣化動作（`includes()` フォールバック）を採用することで UX を維持する。
disabled にすると起動直後の検索体験が著しく低下するため、フォールバック継続方式を選択した。

**OC-04: 解決済み**（フォールバック継続方式を採用。検索ボックスは常に有効のまま）

### D-08: ブラウザ互換性

| 項目 | 値 |
|------|---|
| 対応ブラウザ | Chrome 87+ / Firefox 125+ / Safari 16.4+（Intl.Segmenter 対応ブラウザ） |
| 非対応時の挙動 | Intl.Segmenter 非対応環境ではランタイムエラー。polyfill 未使用。グレースフルデグラデーションは Non-Goal |

### Complexity Tracking

None

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | ✅ design はコードを変更しない | ✅ 新規ファイル追加のみ。既存 API・コンポーネントを破壊しない |
| II. 決定論的マージ | ✅ capability 名 kebab-case で一意 | ✅ 新規ファイル名が既存と衝突しない |
| III. 質問駆動の要件確定 | ✅ Open Choices 解決済み | ✅ OC-03/OC-04 を D-07/D-03補足で明示解決。全技術決定が research.md に根拠あり |
| IV. 双方向アンカー | ✅ 後続 tasks でアンカー付与予定 | ✅ D-01〜D-08 が FR または OC に対応付けられている |
| V. 強制ステップと拡張ステップの分離 | ✅ design は強制ステップ | ✅ design-rationale は別ファイルに分離 |
| VI. Security by Default | ✅ クライアントサイドのみ。FS アクセス増加は Markdown 読み取りのみで最小権限 | ✅ 入力値は MiniSearch に渡すのみ。インジェクションリスクなし |

## Self-Review

**Reviewed by**: mspec-self-reviewer subagent
**Date**: 2026-05-27

### Findings（解決済み）

- **[blocker → 解決]** `useChanges` 2 秒リフェッチによるインデックス全再構築 → D-06 で change ID 安定キーによる再構築ゲーティングを追加
- **[blocker → 解決]** OC-03（title/tags API 欠落）未解決 → D-07 で `routes/changes.ts` 修正を決定として明示
- **[blocker → 解決]** OC-04 と D-03 の矛盾 → D-03 補足でフォールバック継続方式を採用した旨を記録し解決
- **[warning]** full-text-search FR-003（空状態）が design に未記録 → 既存 `Dashboard.tsx:228` の `No changes match...` メッセージで満たされる（意図的省略）
- **[warning]** quickstart の Golden Path が不完全（useSearchIndex.ts スケルトン欠如）→ tasks.md への誘導で対応
- **[warning]** ブラウザ互換性マトリクス未記載 → D-08 で対応
- **[note]** D-02 の並行数実装方法未記述 → tasks.md レベルで扱う

### Overall Assessment

**PASS**（ブロッカー 3 件を D-06/D-07/D-03 補足で解消。実装可能な状態）
