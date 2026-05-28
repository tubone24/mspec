---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md -->
<!-- Requirements implemented: -->
<!-- Change: spec-viewer-fulltext-search -->

# Proposal: Spec Viewer 全文検索

## Why

mspec Web UI の Spec Viewer (`/spec-viewer`) は 40 以上の capability の spec.md を閲覧できるが、現在は
左サイドバーの一覧を目視でスクロールするしかない。任意のキーワードや FR 番号で横断検索する手段がなく、
目的の仕様をすばやく見つけることができない。

## Goals

1. Spec Viewer のサイドバーに検索ボックスを追加し、capability 名・spec.md の見出し・本文・FR 番号を横断検索できるようにする
2. リアルタイムインクリメンタルフィルター（debounce）で入力しながら即座に絞り込みが行われる
3. マッチした箇所を視覚的にハイライト表示し、どこにキーワードが出現したかを把握しやすくする
4. 大文字小文字を区別しない標準化検索（case-insensitive）を実現する
5. すべての処理をクライアントサイドで完結させ、外部サービスへの依存を持たない

## Non-Goals

- 外部インデックスサービス連携（Elasticsearch / Algolia 等）
- 多言語対応・国際化
- リアルタイムファイル変更に連動した自動インデックス再構築
- 検索クエリ履歴の保存・再利用

## Capabilities (touched)

| capability | 操作 | 概要 |
|---|---|---|
| `spec-viewer-search` | 新規 | Spec Viewer 内の全文検索 UI と specs/ インデックス構築ロジック |

## Decisions

| 質問 | 回答 |
|---|---|
| 主に解決したい課題 (PRP-FS-001) | 既存機能の拡張 |
| 検索対象 | spec.md 本文（全文）、タイトル・見出し、FR 番号 |
| Non-Goals | 外部インデックスサービス連携・多言語対応・リアルタイム同期・履歴検索 |
| 完了判定 | 全 E2E が green かつローカルで実際に検索が機能すること |
| 権限境界 (PRP-SEC-001) | なし |
| アクセス範囲の増加 (PRP-SEC-002) | 増加なし（既存 `/api/specs/:capability` を再利用） |
| エージェントへの新規権限付与 (PRP-SEC-003) | なし |
| ロールバック手段 (PRP-SEC-004) | git revert |

## Open Questions

なし

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|---|---|---|
| I. ステップ独立性 | ✅ proposal は research/design に依存しない独立した成果物 | — |
| II. 決定論的マージ | ✅ capability `spec-viewer-search` は新規なので既存 spec へのコンフリクトなし | — |
| III. 質問駆動の要件確定 | ✅ 全 PRP-FS/NG/UX/CMP/SEC の質問を確認済み | — |
| IV. 双方向アンカー | ✅ `@mspec-delta` アンカーを冒頭に記載 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ 本 proposal は強制ステップのみに言及 | — |
| VI. Security by Default | ✅ 権限境界なし・アクセス拡大なし・git revert でロールバック可能 | — |
