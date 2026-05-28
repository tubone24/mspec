---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# full-text-search

> Status: new
> Created: 2026-05-27

## Request

`packages/web-ui` の既存検索機能を全文検索へ拡張し、すべての仕様書・ドキュメントを横断的に検索できるようにする。
Elasticsearch などのサーバーサイドミドルウェアは導入せず、npm パッケージとして単体で動作する軽量なクライアントサイド全文検索エンジン（例: Fuse.js, MiniSearch, flexsearch 等）を採用する。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **MiniSearch + Intl.Segmenter の組み合わせ**はクライアントサイド全文検索として有効。tsconfig に `ES2022.Intl` を追加し、MiniSearch v7 の `boost` は `searchOptions` に移動する必要があった。
- **`useChanges` の 2 秒リフェッチ問題**（D-06）は self-review のブロッカーとして検出された。`changeIds` 文字列キーによる再構築ゲーティングで解決。React + polling API の組み合わせで毎回必要になる定型パターン。
- **`parseTitle` / `parseTags` が存在しなかった**（OC-03）。`readme-parser.ts` に `parseTitle` を追加し H1 見出しを title として返すように修正。tags はデータモデルに存在しないため `[]` を返す設計とした。
- **pre-existing テスト失敗**（12 件）が E2E 基盤に存在しており、green 証跡の記録に影響した。test コマンドを新規追加テストファイルのみに限定することで TDD red→green サイクルを正確に記録できた。
- **tsup の entry をオブジェクト形式**にすることで `server-process.js` が `dist/` 直下に出力され、`launchWebUiIfNeeded` の子プロセス起動が正常に動作するようになった（副産物修正）。

### Next Steps

- **Search.tsx プレースホルダー更新**（"Search changes, tags…" → "Search docs, tags…" など本文検索を示す文言への変更）— web-ui-search/FR-001
- **tags フィールドのデータ入力支援**（readme.md にタグ構文を追加し `parseTags` を実装することで、インデックスの関連度スコアを向上）— search-index/FR-002
- **pre-existing E2E テスト失敗の修正**（"No changes match the current filter." vs "No active changes found." のテキスト不一致 12 件）
- **IndexedDB キャッシュ**によるインデックス永続化（変更数増加時の起動時間短縮） — search-index/FR-001
