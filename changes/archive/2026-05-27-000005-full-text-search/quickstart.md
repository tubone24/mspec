---
doc_type: How-to
---

# Quickstart: Full-Text Search 拡張

## Prerequisites

- Node.js 18 以上（`Intl.Segmenter` が標準で利用可能）
- `packages/web-ui` の開発環境が動作していること
- mspec API サーバーが起動していること（`mspec new` 実行後に自動起動、またはポート 3847 で手動起動）

## Setup

`packages/web-ui` に MiniSearch を追加する：

```bash
cd packages/web-ui
npm install minisearch
```

インストール確認：

```bash
node -e "import('minisearch').then(m => console.log('MiniSearch OK:', m.default.name))"
```

## Try it（Golden Path）

### 1. 新規ファイルを作成する

```bash
# lib/searchIndex.ts — MiniSearch ラッパー
# hooks/useSearchIndex.ts — インデックス構築 hook
```

`src/lib/searchIndex.ts` を作成：

```ts
import MiniSearch from 'minisearch';

export interface SearchDocument {
  id: string;
  changeId: string;
  name: string;
  title: string;
  summary: string;
  tags: string;
  content: string;
}

const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });

export function tokenize(text: string): string[] {
  return Array.from(segmenter.segment(text))
    .filter(s => s.isWordLike)
    .map(s => s.segment.toLowerCase());
}

export function createSearchIndex() {
  return new MiniSearch<SearchDocument>({
    fields: ['name', 'title', 'summary', 'tags', 'content'],
    storeFields: ['changeId'],
    boost: { name: 3, title: 3, summary: 2, tags: 2, content: 1 },
    tokenize,
  });
}
```

### 2. Web UI を起動して動作確認

```bash
cd packages/web-ui
npm run dev
```

ブラウザで `http://localhost:5173` を開き、検索ボックスに仕様書本文に含まれるキーワードを入力する。

### 3. 検索結果を確認する

- 変更名・タイトルにはないが **仕様書の本文に含まれる** キーワードで検索する
- 該当する変更がリストに表示されることを確認する
- 結果が関連度スコア順（TF-IDF）で並んでいることを確認する

## Verify

```bash
# E2E テスト（実装後）
cd packages/web-ui
npm run test:e2e
```

手動確認チェックリスト：

- [ ] 検索ボックスに入力すると、インデックス構築完了後に全文検索が有効になる
- [ ] 本文テキストのみに存在するキーワードで変更が検索できる
- [ ] 検索結果がスコア降順で表示される
- [ ] 検索クエリが空のとき `updatedAt` 降順に戻る
- [ ] API エラー時に `includes()` フォールバックが動作する（`isBuilding: true` 中も同様）

## Troubleshooting

### `Intl.Segmenter is not defined`

Node.js が 18 未満の場合に発生する。`node --version` を確認して 18 以上にアップグレードする。

### インデックス構築中に検索が効かない

`isBuilding: true` の間はフォールバック（メタデータ部分一致）で動作する。インデックス構築完了後に全文検索に切り替わるため、少し待つと解決する。

### 変更数が多い場合の起動が遅い

インデックス構築は並行数 5 でアーティファクトを取得する。変更数×アーティファクト数が多いほど時間がかかる。`useSearchIndex` の並行数設定（`CONCURRENCY = 5`）を調整する。

### 検索ノイズが多い

検索対象を Markdown のみ（`type === 'markdown'`）に絞っているが、それでもノイズが気になる場合は MiniSearch の `boost` 値を調整するか、`content` フィールドのウェイトを下げる。
