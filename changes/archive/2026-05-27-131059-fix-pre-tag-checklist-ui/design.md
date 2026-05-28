---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->
<!-- @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md -->
<!-- Requirements implemented: FR-006 -->
<!-- Change: fix-pre-tag-checklist-ui -->

<!-- @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md -->
<!-- Requirements implemented: FR-005, FR-006 -->
<!-- Change: fix-pre-tag-checklist-ui -->

# Design: fix-pre-tag-checklist-ui

## Summary

`ArtifactViewer.tsx` の `markdownComponents` に 3 つのカスタムレンダラー（`pre` / `li` / `input`）を追加することで、コードブロックの `<pre>` 二重ラップ修正・`verify-human` 項目ハイライト・チェックボックスのインタラクティブ操作を実現する。変更ファイルは 1 つのみ。

## Goals

- コードブロック表示時の `<pre><pre ...>` 二重ネストを解消する
- `<!-- verify: human -->` 付きチェックリスト項目を警告色でハイライトする
- checklist.md のチェックボックスを Web UI から ON/OFF トグルできるようにする

## Non-Goals

- チェックボックス状態のファイルへの永続化（スコープ外）
- ページリロード後のチェック状態の復元
- 他のアーティファクト（spec.md, tasks.md 等）へのインタラクティブチェックボックス適用

## Technical Context

- Language / Runtime: TypeScript 5.x, React 18, Vite
- Dependencies (new): なし（既存の `react-markdown`, `react-shiki`, `remark-gfm` で完結）
- Storage: インメモリ `useState`（`Set<number>`）のみ
- Testing framework: Vitest + React Testing Library
- Target platform: Web UI（ブラウザ）
- Performance / Constraints: チェックボックス状態は最大数百項目程度を想定。`Set` で O(1) トグル

## Constitution Check (Phase 0)

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 | ✅ | 変更は `ArtifactViewer.tsx` 単体。他コンポーネント依存なし |
| II. 決定論的マージ | ✅ | カスタムレンダラー追加のみ。既存レンダラー（`code`）変更なし |
| III. 質問駆動の要件確定 | ✅ | Open Choices なし。設計方針は research.md で確定済み |
| IV. 双方向アンカー | ✅ | `@mspec-delta` アンカーを FR-006/FR-005/FR-006 に付与 |
| V. 強制ステップと拡張ステップの分離 | ✅ | UI の拡張ステップ。ワークフローの強制ステップ（CLI）変更なし |
| VI. Security by Default | ✅ | DOM 操作のみ。XSS リスクは `rehypeRaw` 制御下（既存設計継承） |

## Project Structure (changes)

- 修正: `packages/web-ui/src/components/ArtifactViewer.tsx`
  - `markdownComponents` に `pre` / `li` / `input` カスタムレンダラーを追加
  - `ArtifactViewer` 関数内に `checkedItems: Set<number>` ステートを追加

## Decisions

### D-01: `pre` レンダラーで `{children}` パススルー

**受け入れ基準（FR-006 code-syntax-highlight）**:
- GIVEN AskUserQuestion コンポーネントがコードブロックを含む Markdown を出力する
- WHEN Web UI がそのコードブロックを描画する
- THEN DOM 上の `<pre>` タグが 1 層のみ存在する

```tsx
pre({ children }) {
  return <>{children}</>;
},
```

### D-02: `li` レンダラーで `verify-human` 検出・ハイライト

**受け入れ基準（FR-005 web-ui-server）**:
- GIVEN checklist.md に `<!-- verify: human -->` コメント付き項目がある
- WHEN Web UI が描画する
- THEN 該当 `<li>` に警告スタイル（黄色背景 `bg-amber-50 border-l-4 border-amber-400`）が適用される

検出方法: `li` の `node.children` を stringify して `verify: human` の含有を確認。
`rehypeRaw` + `rehypeCommentDim` による変換後は `<span class="md-comment">` になるため、
children の文字列表現に `verify: human` が残る。

### D-03: `input` レンダラーでチェックボックスのインタラクティブ化

**受け入れ基準（FR-006 web-ui-server）**:
- GIVEN checklist.md のチェックリストが表示されている
- WHEN ユーザーが未チェック項目をクリックする
- THEN チェック済みになり視覚的に表示される

実装:
- `ArtifactViewer` 内に `const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())` を追加
- チェックボックスインデックスは `useRef<number>` カウンターで採番（`li` レンダラーで +1）
- **カウンターは各レンダーサイクルの先頭（`ArtifactViewer` 関数本体のトップレベル）で 0 にリセットすること。**
  `li` レンダラー内部でリセットすると再レンダー時にインデックスがズレ、`checkedItems` の Set 値と不整合が生じる。
- `input[type=checkbox]` の `disabled` を除去し `checked`/`onChange` をローカルステートで制御

## Constitution Check (Phase 1, 計画詳細後)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 変更は `ArtifactViewer.tsx` 1 ファイルに閉じている |
| II. 決定論的マージ | ✅ | ✅ | 追加のみ。既存 `code` レンダラーに手を加えない |
| III. 質問駆動の要件確定 | ✅ | ✅ | インデックス採番方式（useRef）を design で確定 |
| IV. 双方向アンカー | ✅ | ✅ | 実装時に `@mspec-delta` アンカーを先頭に付与する |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | CLI ワークフローへの変更なし |
| VI. Security by Default | ✅ | ✅ | チェックボックス状態はメモリのみ、外部送信なし |

### Complexity Tracking

None

## Migration Plan / Rollout

- `ArtifactViewer.tsx` を変更してビルドするだけ。マイグレーション不要
- チェックボックス状態はインメモリのためロールバックは差し戻しのみ

## Self-Review

**Reviewer:** mspec-self-reviewer  
**Verdict:** PASS（blocker 修正済み）

### Findings（修正済み）

- **[blocker → 修正済み]** `design.md` D-03: `useRef<number>` カウンターのリセット仕様が欠落していた。再レンダー時にインデックスが累積してチェックボックス状態がズレる問題。→ D-03 にカウンターを `ArtifactViewer` 関数本体トップレベルでリセットする制約を追記した。

- **[warning → 修正済み]** `research.md` のステート型が `Set<string>` と誤記されていた。`design.md` の `Set<number>` が正しい型。→ `research.md` を修正済み。

### Constitution Re-Evaluation（レビュワー確認）

| Principle | Phase 0 | Phase 1 | Reviewer | Notes |
|-----------|---------|---------|----------|-------|
| I. ステップ独立性 | ✅ | ✅ | ✅ | `ArtifactViewer.tsx` 単体変更、外部依存増加なし |
| II. 決定論的マージ | ✅ | ✅ | ✅ | 追加レンダラーのみ。既存 `code` レンダラー変更なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | ⚠️ Partial | D-03 のカウンターリセット仕様を追記して解消 |
| IV. 双方向アンカー | ✅ | ✅ | ✅ | `@mspec-delta` アンカーが全 6 ファイルで整合 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ✅ | `workflow.yaml` 変更なし |
| VI. Security by Default | ✅ | ✅ | ✅ | インメモリのみ、外部 I/O なし |
