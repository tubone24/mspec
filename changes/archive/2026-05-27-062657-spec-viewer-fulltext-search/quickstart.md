---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007 -->
<!-- Change: spec-viewer-fulltext-search -->

# Quickstart: Spec Viewer 全文検索

## Prerequisites

- mspec Web UI が起動していること（`mspec server` または `pnpm --filter web-ui dev`）
- ブラウザで `http://localhost:3847` にアクセスできること
- `specs/` 配下に 1 件以上の capability ディレクトリ（`spec.md` を含む）が存在すること

## Setup

追加の設定は不要わん。Web UI を起動すると `/spec-viewer` にアクセスした時点で自動的にインデックスが構築される。

```bash
# Web UI を起動
mspec server

# または開発モードで起動
pnpm --filter web-ui dev
```

## Try it (Golden Path)

### 1. Spec Viewer を開く

ブラウザで `http://localhost:3847/spec-viewer` にアクセスするか、ダッシュボードの **Spec Viewer** リンクをクリックする。

左サイドバーに全 capability 一覧が表示され、上部に検索ボックスが現れる。

> インデックス構築中は `Building index…` と表示される。数秒で完了する。

### 2. キーワードで検索する

検索ボックスに `fr-001` と入力する。

```
fr-001
```

入力しながら即座に（200ms 以内）サイドバーが絞り込まれ、`FR-001` を含む capability のみが表示される。capability 名の中の一致箇所がハイライト（黄色背景）される。

### 3. 結果を確認する

絞り込まれた一覧から任意の capability をクリックする。右ペインに spec.md が表示され、`FR-001` の出現箇所が `<mark>` タグでハイライトされる。

### 4. 検索をクリアする

検索ボックスの右端に表示される **×** ボタンをクリックすると、クエリがリセットされ全 capability 一覧に戻る。

### 5. FR 番号以外のキーワードも試す

```
minisearch
```

```
SHALL
```

```
full-text
```

いずれも本文に含まれる capability に絞り込まれ、マッチ箇所がハイライトされる（FR 番号検索は `full-text` → `full`, `text` に split される）。

## Verify

```bash
# E2E テストで動作を確認する
pnpm --filter web-ui test:e2e --grep "spec-viewer"
```

以下がすべて green になれば成功わん：

| テスト ID | 内容 |
|---|---|
| T401 | Dashboard に Spec Viewer リンクが表示される |
| T402 | /spec-viewer に capability 一覧が表示される |
| T403 | capability クリックで本文が表示される |
| T404 | 検索ボックスが表示される |
| T405 | キーワード入力で capability 一覧が絞り込まれる |
| T406 | × ボタンで検索がリセットされる |
| T407 | 一致なしで「No capabilities found.」が表示される |
| T408 | サイドバーの capability 名にマッチ箇所がハイライトされる |
| T409 | 大文字クエリ `FR-001` を入力しても同じ capability がヒットする（case-insensitive） |

## Troubleshooting

**検索ボックスが表示されない**
→ ブラウザのキャッシュをクリアして再読み込み。`pnpm --filter web-ui build` で再ビルドを試みる。

**インデックス構築中から進まない**
→ `GET /api/specs` または `GET /api/specs/:capability` がエラーを返している可能性がある。ブラウザの DevTools > Network タブで確認。`mspec server` が正常に起動しているか確認。

**検索しても何もヒットしない**
→ `specs/` 配下の capability に `spec.md` が存在するか確認。`mspec status` でインデックス対象の capability 数を確認。

**コードブロックや Mermaid 図が壊れる**
→ `rehypeMarkText` のスキップ処理に問題がある可能性。`<pre>`/`<code>` タグを含む箇所のハイライトが干渉していないか確認。

<!-- LEARNING: Quickstart の Golden Path は検索ボックスの表示 → キーワード入力 → サイドバー絞り込み → クリック → 本文ハイライトの5ステップで完結する | source: FR-003 | confidence: high -->
