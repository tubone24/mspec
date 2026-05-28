---
doc_type: Reference
---

# Research: Full-Text Search 拡張

## Decisions

| 決定事項 | 選択 | 代替案 | 根拠 |
|---------|------|--------|------|
| クライアントサイド検索ライブラリ | **MiniSearch + Intl.Segmenter** | Fuse.js / FlexSearch(Charset.CJK) / Orama | MiniSearch は 7kB gzip・カスタムtokenize関数で Intl.Segmenter を差し込める・週 98 万 DL の実績・TF-IDF スコアリングで関連度ソートが容易。Fuse.js は文字レベル fuzzy で CJK に動作するが TF-IDF スコアリングがなくソート品質が劣る。FlexSearch の Charset.CJK は v0.8 で確認済みだが型定義が不安定で TS 統合コストが高い。Orama はバンドル 2kB だが現行メタが充実しすぎ・weekly DL 15 万と相対的に低い。 |
| インデックス構築タイミング | **ブラウザ起動時（初期化後）** | ユーザーが検索ボックスにフォーカスした時点 | proposal.md PRP-IDX-001 で確定済み。起動時構築は即時検索を保証する。 |
| アーティファクト取得戦略 | **未決定（Open Choice 参照）** | N×M 個別 fetch / 新規 aggregate endpoint | `useArtifactContent` は 1 ファイル 1 リクエスト。変更数×アーティファクト数だけ HTTP が発生する。 |
| インデックス構築失敗時 | **メタデータ部分一致フォールバック** | エラー表示して検索停止 | search-index FR-003 に明示。API エラーは UI に表示せず既存 `includes()` で継続する。 |
| 空状態メッセージ | **「No results」または同等の日本語メッセージ** | 非表示 | full-text-search FR-003 / web-ui-search 要件で明示。現在 Dashboard.tsx:228 に `No changes match...` があり、検索クエリ時の分岐を追加する。 |

## Web References

| タイトル | URL | 要点 |
|---------|-----|------|
| MiniSearch npm | https://www.npmjs.com/package/minisearch | 週 986K DL、最新 7.1.2、7kB gzip |
| MiniSearch 公式ドキュメント | https://lucaong.github.io/minisearch/ | `tokenize` オプションでカスタムトークナイザーを差し込み可能 |
| MiniSearch Bundlephobia | https://bundlephobia.com/package/minisearch | minified+gzip で約 7kB |
| Fuse.js Bundlephobia | https://bundlephobia.com/package/fuse.js@6.6.2 | full build 約 8.6kB gzip、TypeScript 組み込み |
| FlexSearch GitHub | https://github.com/nextapps-de/flexsearch | v0.8 で `Charset.CJK` 確認済み、async worker 対応 |
| FlexSearch encoder.md | https://github.com/nextapps-de/flexsearch/blob/master/doc/encoder.md | `Charset.CJK` の利用方法を記載 |
| Orama GitHub | https://github.com/oramasearch/orama | バンドル 2kB 未満・vector/hybrid 対応・weekly 15 万 DL |
| npm trends 比較 | https://npmtrends.com/flexsearch-vs-fuse.js-vs-fuzzysort-vs-match-sorter-vs-minisearch | 各ライブラリの DL 推移グラフ |
| PkgPulse: Fuse.js vs FlexSearch vs Orama 2026 | https://www.pkgpulse.com/blog/fusejs-vs-flexsearch-vs-orama-client-side-search-2026 | 2026 年時点の比較記事 |
| npm-compare 4 ライブラリ | https://npm-compare.com/fuse.js,elasticlunr,flexsearch,minisearch | ダウンロード数・スター・メンテナンス状況 |

## Codebase Findings

### 現在の検索実装

- `/Users/kagadminmac/project/mspec/packages/web-ui/src/pages/Dashboard.tsx:77-81` — 現在の検索ロジック。`[c.name, c.title, c.summary, ...(c.tags ?? [])].join(' ').toLowerCase().includes(q.toLowerCase())` のみ。本文コンテンツ未対応。
- `/Users/kagadminmac/project/mspec/packages/web-ui/src/components/Search.tsx:1-33` — 検索 UI コンポーネント。`value` / `onChange` の props のみ。全文検索エンジンへの接続は Dashboard 側で行う。

### API レイヤーの現状

- `/Users/kagadminmac/project/mspec/packages/web-ui/src/api/client.ts:105-122` — `useArtifacts(changeId)` で `GET /api/changes/:id/artifacts` を呼び ArtifactFile リストを取得。`useArtifactContent(changeId, relativePath)` で `GET /api/changes/:id/artifacts/*` を呼び本文テキストを取得する。**1 ファイル 1 リクエスト構造**。
- `/Users/kagadminmac/project/mspec/packages/cli/src/server/routes/artifacts.ts:63-99` — サーバー実装。`GET /api/changes/:id/artifacts` でアーティファクトリスト、`GET /api/changes/:id/artifacts/*` で本文テキストを `text/plain` で返す。**本文コンテンツ取得 API は既存**。バルク取得エンドポイントは存在しない。
- `/Users/kagadminmac/project/mspec/packages/cli/src/server/routes/changes.ts:26-58` — `GET /api/changes` は `name / summary / mode / currentStep / steps / isArchived` を返す。`title` / `tags` フィールドは API レスポンスに**含まれない**（`ChangeInfo` 型には `title?: string` / `tags?: string[]` があるが、routes/changes.ts のレスポンスには未含有）。要確認。

### 依存関係の現状

- `/Users/kagadminmac/project/mspec/packages/web-ui/package.json` — 現在の `dependencies` に全文検索ライブラリは存在しない。追加が必要。既存: `@tanstack/react-query ^5.62.0`、`react ^18.3.1`、`zustand ^5.0.2`。
- `Intl.Segmenter` — Node 18+ / モダンブラウザ標準 API。**追加パッケージ不要**。engines に `node: >=18.0.0` があるため利用可能。

## Open Choices (要ユーザー判断)

- [x] **OC-01: ライブラリ最終選定** → **MiniSearch + Intl.Segmenter** を採用。TF-IDF スコアリングによる関連度ソートを優先。
- [x] **OC-02: アーティファクト取得戦略** → **N×M 個別 fetch** を採用。既存 `useArtifactContent` を再利用し、サーバー側変更なし。
- [ ] **OC-03: title / tags フィールドの API 欠落** — `changes.ts` の `/api/changes` レスポンスに `title` と `tags` が含まれているか実装時に要確認。欠落時は routes 側を修正する。
- [x] **OC-04: インデックス構築中の UI 状態** → **フォールバック継続方式**（`isBuilding: true` 中も `includes()` 検索で動作し続ける）。disabled 方式はUX劣化が大きいため不採用。design.md D-03 補足を参照。
- [x] **OC-05: 検索対象アーティファクトの絞り込み** → **Markdown のみ**（`type === 'markdown'`）。HTML/JSON/XML を除外して検索ノイズを抑制。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | research はコードを変更しない ✅ | — |
| II. 決定論的マージ | capability 名 kebab-case で一意 ✅ | — |
| III. 質問駆動の要件確定 | Open Choices で未決定事項を明示 ✅ | — |
| IV. 双方向アンカー | 後続 design/tasks ステップでアンカー付与予定 ✅ | — |
| V. 強制ステップと拡張ステップの分離 | research は強制ステップ ✅ | — |
| VI. Security by Default | FS アクセス範囲拡大は proposal.md で確認済み。クライアントサイドのみで動作しサーバー権限変更なし ✅ | — |
