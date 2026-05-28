---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md -->
<!-- Requirements implemented: FR-006 -->
<!-- Change: fix-pre-tag-checklist-ui -->

<!-- @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md -->
<!-- Requirements implemented: FR-005, FR-006 -->
<!-- Change: fix-pre-tag-checklist-ui -->

# Tasks: fix-pre-tag-checklist-ui

## Phase 1: Setup

- [x] T001 [P] 依存パッケージ追加なし確認 — 新規 npm パッケージ不要（既存 react-markdown / react-shiki / remark-gfm で完結） — files: `packages/web-ui/package.json`


## Phase 2: Foundational — `<pre>` 二重ラップ修正（FR-006 code-syntax-highlight）

### Tests-first (E2E)

- [x] T010 E2E for FR-006 "AskUserQuestion コードブロックの正常描画" — コードブロックを含む Markdown を描画したとき DOM 上の `<pre>` タグが 1 層のみであること — files: `packages/web-ui/tests/e2e/code-highlight.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md
        Requirements implemented: FR-006
        Change: fix-pre-tag-checklist-ui
      <!-- verify: fr-006 -->

- [x] T011 E2E for FR-006 "通常の Markdown コードフェンスの正常描画" — 通常のコードフェンスでも `<pre>` 1 層かつ Shiki ハイライトが適用されること — files: `packages/web-ui/tests/e2e/code-highlight.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md
        Requirements implemented: FR-006
        Change: fix-pre-tag-checklist-ui
      <!-- verify: fr-006 -->

### Implementation

- [x] T012 `markdownComponents` に `pre` パススルーレンダラーを追加 — `pre({ children }) { return <>{children}</>; }` を `ArtifactViewer.tsx` の `markdownComponents` に追加 — files: `packages/web-ui/src/components/ArtifactViewer.tsx`
      anchor:
        @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md
        Requirements implemented: FR-006
        Change: fix-pre-tag-checklist-ui
      <!-- verify: fr-006 -->

## Phase 3: User Story 1 — verify-human ハイライト（FR-005 web-ui-server）

### Tests-first (E2E)

- [x] T101 E2E for FR-005 "verify-human 項目の色付き表示" — `<!-- verify: human -->` 付き `<li>` に `bg-amber-50 border-l-4 border-amber-400` クラスが付与されること — files: `packages/web-ui/tests/e2e/checklist-verify-human.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-005
        Change: fix-pre-tag-checklist-ui

- [x] T102 E2E for FR-005 "verify-human 以外の項目は通常表示" — verify-human コメントのない `<li>` にハイライトクラスが付与されないこと — files: `packages/web-ui/tests/e2e/checklist-verify-human.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-005
        Change: fix-pre-tag-checklist-ui

### Implementation

- [x] T103 `markdownComponents` に `li` ハイライトレンダラーを追加 — children 文字列に `verify: human` が含まれる場合に amber スタイルを付与 — files: `packages/web-ui/src/components/ArtifactViewer.tsx`
      anchor:
        @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-005
        Change: fix-pre-tag-checklist-ui

## Phase 3: User Story 2 — インタラクティブチェックボックス（FR-006 web-ui-server）

### Tests-first (E2E)

- [x] T201 E2E for FR-006 "チェックボックスのトグル操作" — 未チェック項目をクリックするとチェック済みになること — files: `packages/web-ui/tests/e2e/checklist-interactive.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-006
        Change: fix-pre-tag-checklist-ui
      <!-- verify: fr-006 -->

- [x] T202 E2E for FR-006 "チェック済み項目のアンチェック操作" — チェック済み項目をクリックすると未チェックに戻ること — files: `packages/web-ui/tests/e2e/checklist-interactive.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-006
        Change: fix-pre-tag-checklist-ui
      <!-- verify: fr-006 -->

### Implementation

- [x] T203 `ArtifactViewer` にチェックボックス状態管理を追加 — `useState<Set<number>>` + `useRef<number>` カウンター（関数本体トップレベルで毎レンダーリセット）+ `input[type=checkbox]` カスタムレンダラーを `ArtifactViewer.tsx` に追加 — files: `packages/web-ui/src/components/ArtifactViewer.tsx`
      anchor:
        @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md
        Requirements implemented: FR-006
        Change: fix-pre-tag-checklist-ui
      <!-- verify: fr-006 -->

## Phase 4: Polish

- [x] T301 ビルド確認・ブラウザ目視検証 — `pnpm build` が成功し、Web UI でコードブロック・verify-human ハイライト・チェックボックストグルが期待通り動作することを確認 — files: `packages/web-ui/`
      <!-- verify: human -->

## Dependencies

- T010, T011 block T012
- T101, T102 block T103
- T201, T202 block T203
- T012 blocks T101 （同一ファイル `ArtifactViewer.tsx` への変更順序確保）
- T103 blocks T201 （同上）
- T203 blocks T301

## Constitution Check

> Step: tasks | Constitution Version: mspec

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 全タスクが `ArtifactViewer.tsx` 1 ファイルに閉じ、他コンポーネント依存なし |
| II. 決定論的マージ | ✅ | — | 追加のみ。既存 `code` レンダラー変更なし |
| III. 質問駆動の要件確定 | ✅ | — | `useRef` カウンターリセット制約が design.md D-03 で確定済み |
| IV. 双方向アンカー | ✅ | — | 全タスクに `@mspec-delta` アンカーブロック付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | CLI ワークフロー変更なし |
| VI. Security by Default | ✅ | — | インメモリ状態のみ。外部送信なし |

### Complexity Tracking

None
