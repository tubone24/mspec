---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: Full-Text Search 拡張

## Context

mspec Web UI はダッシュボードで変更一覧を表示する際、検索ボックスへの入力で絞り込みを行う。現行の検索は `Dashboard.tsx:79` にある `String.prototype.includes()` で、変更の `name / title / summary / tags` のみを対象としている。仕様書・ドキュメントの本文（`proposal.md` / `spec.md` / `design.md` 等）は検索対象外であり、ユーザーが必要な情報を探す際にドキュメントを手動で開く必要があった。

制約として「Elasticsearch 等のサーバーサイドミドルウェアは導入しない」「npm パッケージとして単体で動作する」という要件がある（proposal.md）。この制約下でフルテキスト検索を実現するには、クライアントサイドで動作する軽量な全文検索ライブラリの採用が唯一の選択肢となる。

## Decisions

### MiniSearch + Intl.Segmenter を採用した理由

MiniSearch は inverted index と TF-IDF スコアリングを持つ軽量ライブラリ（7kB gzip）で、`tokenize` オプションにカスタム関数を注入できる。この拡張ポイントに Node 18+ 標準の `Intl.Segmenter` を組み合わせることで、日本語を含む CJK テキストを形態素レベルで分割できる。TF-IDF スコアリングにより検索結果を関連度順にソートできる点が Fuse.js との主な差別化要因であり、`web-ui-search FR-003`（スコアベースソート）を自然に実現できる。

### インデックス構築を「ブラウザ起動時・動的」とした理由

`proposal.md` の PRP-IDX-001 で確定した決定。ビルド時静的生成（Vite プラグイン等）は Vite 環境への依存度が高く、npm パッケージとして配布する際にビルドパイプラインへの介入が必要となる。ブラウザ起動時の動的構築は既存 API（`GET /api/changes/:id/artifacts/*`）を流用でき、サーバー側の変更が不要なため採用した。

### N×M 個別 fetch とした理由

既存の `useArtifactContent` hook が 1 ファイル 1 リクエスト構造であり、これを流用することでサーバー側への変更を最小化できる。新規 aggregate エンドポイント（`GET /api/search-corpus` 等）は実装コストが高く、mspec がパッケージとして配布される性質上、ユーザーの CLI バージョンアップも要求することになる。N×M fetch は変更数が数十件程度であれば起動時間への影響が許容範囲内であると判断した（並行数 5 で制御）。

## Alternatives Considered

- **Fuse.js**: character-level fuzzy 検索で追加設定なしに CJK が動作するが、TF-IDF スコアリングがない。関連度順ソート（FR-003）を実装するには独自スコアリングが必要でコストが高い。
- **FlexSearch**: `Charset.CJK` プリセットが存在するが v0.8 時点で TypeScript 型定義が不安定。型エラーの解消コストが高い。
- **Orama**: バンドルサイズが最小（2kB）だが機能が多く、日本語対応に別途プラグインが必要。
- **ビルド時静的インデックス**: 最速だが Vite プラグインへの依存が生まれ、npm パッケージとしての汎用性が損なわれる。

## Trade-offs

- **起動時の HTTP リクエスト増加**: ブラウザ起動時に N×M のアーティファクト取得リクエストが発生する。変更数が多い場合は初期化が遅くなるリスクがある。並行数 5 の制御と `isBuilding` フラグによるフォールバックで対応。
- **メモリ消費**: MiniSearch インデックスはメモリ上に保持される。ドキュメントが大量になるとメモリ使用量が増加する。npm パッケージ用途（個人・チームレベル）では許容範囲と判断。
- **CJK トークナイズの精度**: `Intl.Segmenter` は辞書ベースではなく規則ベースの分割のため、専門用語の分割精度は MeCab 等に劣る。仕様書検索の用途であれば十分と判断。

## Rejected Options

- **サーバーサイド全文検索（Elasticsearch / OpenSearch 等）**: proposal.md で明示的に Non-Goal。npm パッケージ単体配布の要件と矛盾する。
- **リアルタイムインデックス更新**: WebSocket や polling によるリアルタイム更新は実装コストが高く、Non-Goal として明示（proposal.md）。
- **IndexedDB キャッシュ**: インデックスを IndexedDB に永続化して再起動時の再構築を省略する案。実装コストが高く変更検知ロジックが複雑になるため今回は採用しない。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | ✅ design-rationale はコードを変更しない | ✅ 既存設計を破壊する変更なし |
| II. 決定論的マージ | ✅ 単一の Explanation ファイル | ✅ design.md と相互参照する構造で一意 |
| III. 質問駆動の要件確定 | ✅ research.md の Open Choices を根拠に記述 | ✅ 代替案・トレードオフを網羅 |
| IV. 双方向アンカー | ✅ design.md の決定 D-01〜D-04 を参照 | ✅ FR との対応関係が明示されている |
| V. 強制ステップと拡張ステップの分離 | ✅ design-rationale は design の補足 Explanation | ✅ 実装詳細（コード）は含まない |
| VI. Security by Default | ✅ クライアントサイド完結 | ✅ 入力は MiniSearch API にのみ渡す。XSS リスクなし |
