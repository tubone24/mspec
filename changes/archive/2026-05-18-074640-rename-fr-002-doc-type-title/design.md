---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: rename-fr-002-doc-type-title

## Summary

`specs/artifact-taxonomy/spec.md` 内の FR-002 タイトルを「four Diátaxis types」から「five permitted types」へ RENAMED する。
FR-002 本文はすでに5種（`AI-Internal` 含む）を正しく記載しているため、タイトルとの乖離を解消するのみ。
変更は `mspec archive` による決定論的マージで SoT spec に反映される。

## Goals

- FR-002 タイトルを実態（5種）に合わせる
- SoT spec のタイトル・本文間の不整合を解消する

## Non-Goals

- FR-002 本文の内容変更
- 新しい `doc_type` 値の追加
- 他の FR への影響

## Technical Context

- Language / Runtime: Markdown のみ
- Dependencies (new): なし
- Storage: `specs/artifact-taxonomy/spec.md`（SoT spec）
- Testing framework: `mspec validate`、`mspec anchor check`
- Target platform: mspec CLI（`mspec archive` によるマージ）
- Performance / Constraints: マージは CLI パーサーが処理するため LLM 不使用

## Project Structure (changes)

- 修正（archive 後）: `specs/artifact-taxonomy/spec.md` — FR-002 タイトル行を置換

## Decisions

### D-1: Delta Spec の RENAMED セクションを使う

FR-002 の本文は変更しない。タイトルのみの変更であるため、MODIFIED ではなく RENAMED セクションを使用する。
`mspec archive` は RENAMED セクションを解釈し、`### Requirement: FR-002 — <旧>` の行を `### Requirement: FR-002 — <新>` に置換する。

受け入れ基準: Delta Spec `## RENAMED Requirements` セクションに
`FR-002 — doc_type value is constrained to the four Diátaxis types -> FR-002 — doc_type value is constrained to the five permitted types`
が記載されており、`mspec archive` 後の SoT spec に新タイトルが反映される。

## Constitution Check (Phase 0)

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 | ✅ | SoT spec 修正のみで他ステップに副作用なし |
| II. 決定論的マージ | ✅ | RENAMED セクションは CLI パーサーが処理し LLM 不使用 |
| III. 質問駆動の要件確定 | ✅ | タイトル変更は自明、追加質問不要 |
| IV. 双方向アンカー | ✅ | 実装対象は SoT spec のみ、アンカー対象外 |
| V. 強制ステップと拡張ステップの分離 | ✅ | design は removable だが今回実行、構造に変更なし |

## Constitution Check (Phase 1, 計画詳細後)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | archive ステップのみが SoT spec を変更 |
| II. 決定論的マージ | ✅ | ✅ | RENAMED マージは純粋関数で処理 |
| III. 質問駆動の要件確定 | ✅ | ✅ | 変更内容が確定済みで追加質問なし |
| IV. 双方向アンカー | ✅ | ✅ | SoT spec 変更にアンカー不要 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ワークフロー構造に変更なし |

### Complexity Tracking

None

## Migration Plan / Rollout

1. Delta Spec の RENAMED セクションを確認
2. `mspec archive` で SoT spec に FR-002 新タイトルをマージ
3. `mspec validate` でアーカイブ後の spec を検証

## Self-Review

### Findings

- **[nit] SoT spec FR-002 本文の自己参照注記が archive 後に stale になる。**
  `specs/artifact-taxonomy/spec.md` 32行目に「タイトル改名は後続の change で扱う」という注記が残っており、archive 後は事実と矛盾する。checklist.md で人手判断 / follow-up change として明記済み。ブロッカーではないがフォローアップ必須。

- **[nit] `architecture-overview.md` の Mermaid ノードラベルが省略パス（`changes/.../specs/...`）を使用していた。** → 修正済み（実パスに置換）。

- **[nit] `design.md` の Phase 0 / Phase 1 Constitution Check テーブルが同一内容で重複している。** このスコープでは無害だが、将来の変更時にメンテナンス負荷になりうる。

- **[nit] `design-rationale.md`・`design.md`・`architecture-overview.md` の3ファイルに同一 Constitution Check テーブルが存在する。** 情報の冗長性あり。ブロッカーではなし。

- **ブロッカーなし。** Delta Spec の旧タイトル文字列は SoT spec とバイト一致確認済み。RENAMED 書式も正規形式に準拠。

### Constitution Re-Evaluation

| Principle | Phase 0 | Phase 1 | 独立再評価 | 差異 |
|-----------|---------|---------|-----------|------|
| I. ステップ独立性 | ✅ | ✅ | PASS — SoT spec 1行のみ変更 | なし |
| II. 決定論的マージ | ✅ | ✅ | PASS — CLI 文字列置換のみ | なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | PASS — SoT spec 自身が後続 change を明記 | なし |
| IV. 双方向アンカー | ✅ | ✅ | PASS — コードファイル生成なし | なし |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | PASS — ワークフロー構造に変更なし | なし |

### Verdict

**PASS WITH NOTES** — 全ブロッキング基準を満たす。唯一の未解決事項は FR-002 本文の stale 注記で、checklist で人手判断 / follow-up change として管理されている。
