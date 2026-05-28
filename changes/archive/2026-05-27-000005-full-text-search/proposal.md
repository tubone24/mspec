---
doc_type: Explanation
---

# Full-Text Search 拡張提案

## Why

`packages/web-ui` の既存検索（`Dashboard.tsx:79`）は `c.name / c.title / c.summary / c.tags` に対する `String.prototype.includes()` のみで、仕様書・ドキュメントの本文コンテンツは対象外となっている。
すべての仕様書・ドキュメントを横断的に全文検索できるようにすることで、ユーザーが必要な情報を素早く発見できる体験を提供する。
Elasticsearch などのサーバーサイドミドルウェアは使用せず、npm パッケージ単体で動作するクライアントサイド全文検索エンジン（Fuse.js / MiniSearch / flexsearch 等）を採用する。

## Goals

- 既存の検索機能を全文検索へ拡張する（既存機能の拡張）
- 仕様書・ドキュメントの本文コンテンツまでを検索対象とする
- ブラウザ起動時に動的インデックスを構築する
- npm パッケージとして単体で動作する（外部ミドルウェア不要）
- 全 E2E テストが green であることを完了条件とする

## Non-Goals

- サーバーサイド全文検索エンジン（Elasticsearch, Solr 等）の導入
- 検索履歴の保存・分析機能
- リアルタイムインデックス更新（文書更新の即時反映）
- ユーザー認証・認可の変更

## Capabilities (touched)

- full-text-search
- search-index
- web-ui-search

## Decisions

| ID | 質問 | 回答 |
|----|------|------|
| PRP-FS-001 | 主に解決したい課題 | 既存機能の拡張 |
| PRP-IDX-001 | インデックス戦略 | ブラウザ起動時に動的構築 |
| PRP-CMP-001 | 完了判定指標 | 全 E2E が green |
| PRP-SEC-001 | 触れる権限境界 | ファイルシステムアクセス（ドキュメント読み込み） |
| PRP-SEC-002 | アクセス範囲増加 | ファイル読み書き範囲の拡大（ドキュメントディレクトリ配下を広く読む） |
| PRP-SEC-003 | エージェント/自動化処理への新規権限付与 | なし |
| PRP-SEC-004 | ロールバック手段 | git revert |

## Open Questions

なし

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | ✅ proposal はコードを変更しない | — |
| II. 決定論的マージ | ✅ capability 名を kebab-case で一意に管理 | — |
| III. 質問駆動の要件確定 | ✅ 4 機能質問 + 4 セキュリティ質問で確定 | — |
| IV. 双方向アンカー | ✅ 後続 delta ステップでアンカー付与予定 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ proposal は強制ステップ | — |
| VI. Security by Default | ✅ FS アクセス範囲拡大を明示、ロールバック手段 (git revert) を確定 | — |
