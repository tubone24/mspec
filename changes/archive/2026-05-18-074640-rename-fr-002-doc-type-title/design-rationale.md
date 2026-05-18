---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: rename-fr-002-doc-type-title

## Context

`revise-artifact-taxonomy` change（Decision 6）において、mspec の `doc_type` 許容値に `AI-Internal` が追加された。これにより許容される doc_type は `Reference`、`Explanation`、`How-to`、`Tutorial`、`AI-Internal` の5種となった。FR-002 の本文はこの5種を正しく記載するよう更新されたが、タイトル文字列「doc_type value is constrained to the four Diátaxis types」は変更されなかった。

このタイトル不整合は `revise-artifact-taxonomy` の時点で認識されており、SoT spec の FR-002 本文内に「タイトル改名は後続の change で RENAMED として扱う」という注記が残っている。本 change はその後続処理である。

## Decisions

### RENAMED セクションを使う（MODIFIED ではなく）

FR-002 の本文・シナリオ・FR-ID はすべて変更しない。変更はタイトル文字列1行のみである。mspec Delta Spec の `## RENAMED Requirements` セクションはこのユースケースのために設計されており、`mspec archive` CLI がタイトル行の置換を決定論的に処理する。MODIFIED セクションを使うと本文ごと上書きする必要が生じ、変更差分が不明瞭になるため不適切。

## Alternatives Considered

- **`MODIFIED` セクションで FR-002 全体を書き直す**: 本文に変更がないにもかかわらず全文を Delta Spec に転記する必要があり、不要な差分が生まれる。却下。
- **タイトルを「four Diátaxis types extended with AI-Internal」にする**: より説明的だが冗長。本文に詳細が記載されているためタイトルは簡潔でよい。却下。
- **SoT spec を直接手動編集する**: mspec ワークフローを迂回する。追跡可能性が失われるため却下。

## Trade-offs

- タイトル変更後は `revise-artifact-taxonomy` change の注記（「タイトル改名は後続の change で」）が obsolete になるが、archive 後の SoT spec では注記ごと置換されるため問題なし。

## Rejected Options

- **タイトル変更をしない**: FR-002 本文との不整合が永続し、仕様の可読性を損なう。却下。
- **FR-002 を削除して FR-007 として新規追加**: FR-ID の連続性が壊れ、既存アンカーが無効化される。却下。

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 他ステップへの依存なし |
| II. 決定論的マージ | ✅ | ✅ | RENAMED は CLI パーサー処理 |
| III. 質問駆動の要件確定 | ✅ | ✅ | 設計上の選択肢を rationale に記録済み |
| IV. 双方向アンカー | ✅ | ✅ | SoT spec 変更にアンカー不要 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ワークフロー構造に変更なし |
