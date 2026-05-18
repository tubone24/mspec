---
doc_type: AI-Internal
---

# Tasks: rename-fr-002-doc-type-title

## Phase 1: Setup

- [x] T001 [P] 変更前の SoT spec を確認 — files: `specs/artifact-taxonomy/spec.md`
      anchor:
        @mspec-delta 2026-05-18-074640-rename-fr-002-doc-type-title/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-002
        Change: rename-fr-002-doc-type-title

## Phase 2: Foundational

（なし — コード基盤変更なし、依存関係変更なし）

## Phase 3: User Story — FR-002 タイトルリネーム

### Tests-first (E2E)

- [x] T301 E2E: `mspec archive` 後に SoT spec の FR-002 タイトルが新タイトルに置換されていることを確認 — files: `specs/artifact-taxonomy/spec.md`
      anchor:
        @mspec-delta 2026-05-18-074640-rename-fr-002-doc-type-title/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-002
        Change: rename-fr-002-doc-type-title
      検証手順:
        1. `grep "FR-002" specs/artifact-taxonomy/spec.md` で新タイトル "five permitted types" を確認
        2. FR-002 本文・Scenario が変更されていないことを確認
        3. `mspec validate` でエラーゼロを確認
        4. `mspec anchor check` でアンカー解決エラーゼロを確認

### Implementation

- [x] T302 `mspec archive --change 2026-05-18-074640-rename-fr-002-doc-type-title` を実行して SoT spec に FR-002 新タイトルをマージ — files: `specs/artifact-taxonomy/spec.md`
      anchor:
        @mspec-delta 2026-05-18-074640-rename-fr-002-doc-type-title/specs/artifact-taxonomy/spec.md
        Requirements implemented: FR-002
        Change: rename-fr-002-doc-type-title

## Phase 4: Polish

- [ ] T401 [フォローアップ] FR-002 本文の stale 注記（「タイトル改名は後続の change で扱う」）を別 change で削除または更新する — files: `specs/artifact-taxonomy/spec.md`（archive 後の SoT）
      ※ self-review で指摘されたリスク。本 change の archive 後に後続 change を切ること。

## Dependencies

- T301 blocks T302 （E2E 検証手順を確認してから archive 実行）
- T302 blocks T401 （archive 完了後にフォローアップ判断）

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | archive 後の SoT spec のみが影響範囲 |
| II. 決定論的マージ | ✅ | — | RENAMED マージは CLI パーサーが処理 |
| III. 質問駆動の要件確定 | ✅ | — | 変更内容が自明で追加質問不要 |
| IV. 双方向アンカー | ✅ | — | T301・T302 に anchor ブロック付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | ワークフロー構造に変更なし |

### Complexity Tracking

None
