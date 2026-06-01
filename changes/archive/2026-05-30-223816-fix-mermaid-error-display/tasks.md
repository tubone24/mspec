---
doc_type: Reference
---

# Tasks: fix-mermaid-error-display

## Phase 1 — Setup

> このチェンジは既存の Mermaid ライブラリ（v11.15.0）と Playwright 環境を使用するため、新規依存関係・環境構築は不要。

- [x] 既存 E2E 環境確認（`packages/web-ui/playwright.config.ts` が存在）

## Phase 2 — Foundational

> 単一コンポーネント（`MermaidRenderer.tsx`）のみの変更。型定義や共通ユーティリティの変更は不要。

スキップ（該当なし）

## Phase 3 — User Story

### Task 3-1: E2E テスト — Mermaid エラー表示抑制の確認（Red）

<!-- verify: fr-015 -->

`packages/web-ui` の E2E テストに Mermaid 構文エラー時の表示確認テストを追加する。**実装前に実行して FAIL することを確認する（Red フェーズ）。**

- [ ] `packages/web-ui/tests/` または既存 E2E テストファイルに以下のテストを追加する:
  - 構文エラーを含む Mermaid ブロックを含む MD ファイルをプレビューする
  - 「Syntax error in text」または「mermaid version」を含むテキストが DOM に存在しないことをアサートする
  - コンパクトなエラーインジケータ（「⚠ Mermaid 構文エラー」または `data-testid="mermaid-error"` 相当の要素）が表示されることをアサートする
- [ ] `pnpm playwright test` を実行し、テストが FAIL することを確認する（Red 確認）

```
@mspec-delta 2026-05-30-223816-fix-mermaid-error-display/specs/artifact-preview/spec.md
Requirements implemented: FR-015
Change: fix-mermaid-error-display
```

### Task 3-2: E2E テスト — 正常 Mermaid の SVG 描画が維持されることの確認

<!-- verify: fr-015 -->

既存 E2E テスト（FR-006 対応: `data-testid="mermaid-svg"` の SVG 確認テスト）が引き続き通過することを実装後に確認する準備として、テストが現時点で GREEN であることを記録する。

- [ ] 既存の `[data-testid="mermaid-svg"] svg` テストを実行してGREEN であることを確認（ベースライン記録）

```
@mspec-delta 2026-05-30-223816-fix-mermaid-error-display/specs/artifact-preview/spec.md
Requirements implemented: FR-015
Change: fix-mermaid-error-display
```

### Task 3-3: 実装 — `MermaidRenderer.tsx` の修正（Green）

<!-- verify: fr-015 -->

`packages/web-ui/src/components/MermaidRenderer.tsx` を以下の手順で修正する。Task 3-1 の E2E テストが GREEN になることを確認する。

- [ ] `mermaid.initialize()` の引数に `suppressErrorRendering: true` を追加する

  ```ts
  mermaid.initialize({ startOnLoad: false, theme: 'default', suppressErrorRendering: true });
  ```

- [ ] `mermaid.render()` の前に `mermaid.parse(chart)` の呼び出しを追加し、エラー時に render をスキップする

  ```ts
  const id = `mermaid-${Math.random().toString(36).slice(2)}`;
  try {
    await mermaid.parse(chart);
  } catch {
    setError('Mermaid 構文エラー');
    return;
  }
  mermaid
    .render(id, chart)
    .then(({ svg: rendered }) => setSvg(rendered))
    .catch(() => setError('Mermaid 構文エラー'));
  ```

  > 注: `useEffect` の非同期実行に合わせて適切に async/await または Promise チェーンを調整すること。

- [ ] エラー表示部分を `String(err)` の生出力から固定文字列バッジに変更する

  ```tsx
  if (error) {
    return (
      <div
        data-testid="mermaid-error"
        className="text-amber-600 text-xs p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800"
      >
        ⚠ {error}
      </div>
    );
  }
  ```

- [ ] `pnpm build` または `pnpm typecheck` でビルドエラーがないことを確認する
- [ ] Task 3-1 の E2E テストを再実行して GREEN になることを確認する

```
@mspec-delta 2026-05-30-223816-fix-mermaid-error-display/specs/artifact-preview/spec.md
Requirements implemented: FR-015, FR-016
Change: fix-mermaid-error-display
```

### Task 3-4: 既存 E2E テストのリグレッション確認

<!-- verify: fr-015 -->

`MermaidRenderer.tsx` の変更が既存テストを壊していないことを確認する。

- [ ] `pnpm playwright test` を実行し、`data-testid="mermaid-svg"` の SVG レンダリングテスト（FR-006）が GREEN を維持していることを確認する
- [ ] テーマトグル (FR-007)・EARS/Gherkin ハイライト (FR-008) テストも引き続き GREEN であることを確認する

```
@mspec-delta 2026-05-30-223816-fix-mermaid-error-display/specs/artifact-preview/spec.md
Requirements implemented: FR-015
Change: fix-mermaid-error-display
```

## Phase 4 — Polish

### Task 4-1: 目視確認 — エラー表示のビジュアル確認

<!-- verify: fr-015 -->

Web UI を起動して実際のブラウザで Mermaid エラー表示を目視確認する。

- [ ] `mspec new` で作成したテスト用 MD ファイルに構文エラーを含む Mermaid ブロックを追加する（例: ```` ```mermaid\ngraph TD A--\n``` ````）
- [ ] Web UI でそのファイルをプレビューし、「Syntax error in text」や「mermaid version 11.15.0」が大きく表示されていないことを目視確認する
- [ ] 「⚠ Mermaid 構文エラー」バッジがコンパクトに表示されていることを目視確認する
- [ ] ダーク・ライトモードの両方でエラーバッジが適切に表示されることを確認する

## Constitution Check

### Phase 0

| 原則 | 評価 | 備考 |
|------|------|------|
| I. ステップ独立性 | ✅ | tasks.md は design.md・checklist.md から独立して実行可能 |
| II. 決定論的マージ | ✅ | タスクは FR-015・FR-016 のみを実装。既存 FR は変更しない |
| III. 質問駆動の要件確定 | ✅ | タスクの範囲はユーザー要求と一致 |
| IV. 双方向アンカー | ✅ | 全タスクに `@mspec-delta` アンカーブロックが付与されている |
| V. 強制/拡張ステップ分離 | ✅ | tasks は強制ステップ |
| VI. Security by Default | ✅ | Task 3-3 で `dangerouslySetInnerHTML` の用途を維持（Mermaid 生成 SVG のみ）し、エラー表示は固定文字列 |
| VII. 設計意図と実装の対応 | ✅ | Decision 1→Task 3-3 (suppressErrorRendering)、Decision 2→Task 3-3 (parse())、Decision 3→Task 3-3 (バッジ表示) |

### Complexity Tracking

None
